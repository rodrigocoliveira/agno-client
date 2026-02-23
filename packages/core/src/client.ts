import EventEmitter from 'eventemitter3';
import type {
  AgnoClientConfig,
  ChatMessage,
  ImageData,
  AudioData,
  UserFileAttachment,
  RunResponse,
  SessionEntry,
  AgentDetails,
  TeamDetails,
  ClientState,
  ToolCall,
  CustomEventData,
  AgentSessionDetailSchema,
  TeamSessionDetailSchema,
  RunSchema,
  TeamRunSchema,
  CreateSessionRequest,
  UpdateSessionRequest,
  UserMemory,
  MemoriesListResponse,
  ListMemoriesParams,
  CreateMemoryRequest,
  UpdateMemoryRequest,
  DeleteMultipleMemoriesRequest,
  UserMemoryStatsResponse,
  UserMemoryStatsParams,
  KnowledgeConfigResponse,
  ContentResponse,
  ContentStatusResponse,
  ContentListResponse,
  ContentListOptions,
  VectorSearchRequest,
  VectorSearchResponse,
  ContentUpdateRequest,
  MetricsResponse,
  MetricsOptions,
  RefreshMetricsOptions,
  DayAggregatedMetrics,
  EvalSchema,
  EvalRunsListResponse,
  ListEvalRunsParams,
  ExecuteEvalRequest,
  UpdateEvalRunRequest,
  TraceDetail,
  TraceNode,
  ListTracesOptions,
  GetTraceOptions,
  GetTraceSessionStatsOptions,
} from '@rodrigocoliveira/agno-types';
import { RunEvent } from '@rodrigocoliveira/agno-types';
import { MessageStore } from './stores/message-store';
import { ConfigManager } from './managers/config-manager';
import { SessionManager } from './managers/session-manager';
import { MemoryManager } from './managers/memory-manager';
import { KnowledgeManager } from './managers/knowledge-manager';
import { EvalManager } from './managers/eval-manager';
import { TracesManager, PaginatedTracesResult, PaginatedTraceSessionStatsResult } from './managers/traces-manager';
import { EventProcessor } from './processors/event-processor';
import { streamResponse } from './parsers/stream-parser';
import { Logger } from './utils/logger';

/**
 * Safely converts a Unix timestamp to ISO string with validation
 */
function toSafeISOString(timestamp: number | undefined): string {
  const now = Date.now();
  const ts = timestamp ? timestamp * 1000 : now;

  // Validate timestamp is reasonable (between 2000 and 2100)
  const MIN_TIMESTAMP = 946684800000; // 2000-01-01
  const MAX_TIMESTAMP = 4102444800000; // 2100-01-01

  if (ts < MIN_TIMESTAMP || ts > MAX_TIMESTAMP || !Number.isFinite(ts)) {
    Logger.warn(`Invalid timestamp: ${timestamp}, using current time`);
    return new Date(now).toISOString();
  }

  return new Date(ts).toISOString();
}

/**
 * Main Agno client class
 * Provides stateful management of agent/team interactions with streaming support
 */
export class AgnoClient extends EventEmitter {
  private messageStore: MessageStore;
  private configManager: ConfigManager;
  private sessionManager: SessionManager;
  private memoryManager: MemoryManager;
  private knowledgeManager: KnowledgeManager;
  private evalManager: EvalManager;
  private tracesManager: TracesManager;
  private eventProcessor: EventProcessor;
  private state: ClientState;
  private pendingUISpecs: Map<string, any>; // toolCallId -> UIComponentSpec
  private runCompletedSuccessfully: boolean = false;
  private currentRunId?: string;
  private abortController?: AbortController;

  constructor(config: AgnoClientConfig) {
    super();
    this.messageStore = new MessageStore();
    this.configManager = new ConfigManager(config);
    this.sessionManager = new SessionManager();
    this.memoryManager = new MemoryManager();
    this.knowledgeManager = new KnowledgeManager();
    this.evalManager = new EvalManager();
    this.tracesManager = new TracesManager();
    this.eventProcessor = new EventProcessor();
    this.pendingUISpecs = new Map();
    this.state = {
      isStreaming: false,
      isRefreshing: false,
      isEndpointActive: false,
      agents: [],
      teams: [],
      sessions: [],
      isPaused: false,
      pausedRunId: undefined,
      toolsAwaitingExecution: undefined,
      currentRunId: undefined,
      isCancelling: false,
      memories: [],
      memoryTopics: [],
      traces: [],
      traceSessionStats: [],
    };
  }

  /**
   * Get current messages
   */
  getMessages(): ChatMessage[] {
    return this.messageStore.getMessages();
  }

  /**
   * Get current configuration
   */
  getConfig(): AgnoClientConfig {
    return this.configManager.getConfig();
  }

  /**
   * Get current state
   */
  getState(): ClientState {
    return { ...this.state };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<AgnoClientConfig>): void {
    this.configManager.updateConfig(updates);
    this.emit('config:change', this.configManager.getConfig());
  }

  /**
   * Clear all messages
   */
  clearMessages(): void {
    this.messageStore.clear();
    this.configManager.setSessionId(undefined);
    this.pendingUISpecs.clear(); // Clear any pending UI specs to prevent memory leaks
    this.state.errorMessage = undefined;
    this.emit('message:update', this.messageStore.getMessages());
    this.emit('state:change', this.getState());
  }

  /**
   * Send a message to the agent/team (streaming)
   *
   * To cancel a running request, use the `cancelRun()` method which:
   * 1. Aborts the local fetch stream (immediate UI feedback)
   * 2. Notifies the backend to stop processing (saves compute costs)
   */
  async sendMessage(
    message: string | FormData,
    options?: { headers?: Record<string, string>; params?: Record<string, string> }
  ): Promise<void> {
    if (this.state.isStreaming) {
      throw new Error('Already streaming a message');
    }

    // Reset completion flag for new message
    this.runCompletedSuccessfully = false;

    // Create new AbortController for this request
    this.abortController = new AbortController();

    const runUrl = this.configManager.getRunUrl();
    if (!runUrl) {
      throw new Error('No agent or team selected');
    }

    this.state.isStreaming = true;
    this.state.errorMessage = undefined;
    this.emit('stream:start');
    this.emit('state:change', this.getState());

    const formData = message instanceof FormData ? message : new FormData();
    if (typeof message === 'string') {
      formData.append('message', message);
    }

    // Remove previous error messages if retrying
    const lastMessage = this.messageStore.getLastMessage();
    if (lastMessage?.streamingError) {
      const secondLast = this.messageStore.getMessages()[
        this.messageStore.getMessages().length - 2
      ];
      if (secondLast?.role === 'user') {
        this.messageStore.removeLastMessages(2);
      }
    }

    // Extract file metadata from FormData for immediate UI rendering
    const userImages: ImageData[] = [];
    const userAudio: AudioData[] = [];
    const userFiles: UserFileAttachment[] = [];

    if (message instanceof FormData) {
      // Agno API uses a single "files" field for all media types
      const entries = message.getAll('files');
      for (const entry of entries) {
        if (typeof entry !== 'string') {
          const file = entry as File;
          const url = URL.createObjectURL(file);
          const mimeType = file.type || '';

          if (mimeType.startsWith('image/')) {
            userImages.push({ url, revised_prompt: file.name || 'Uploaded image' });
          } else if (mimeType.startsWith('audio/')) {
            userAudio.push({ url, mime_type: mimeType });
          } else {
            userFiles.push({
              name: file.name || 'file',
              type: mimeType,
              url,
              size: file.size,
            });
          }
        }
      }
    }

    // Add user message
    this.messageStore.addMessage({
      role: 'user',
      content: formData.get('message') as string,
      created_at: Math.floor(Date.now() / 1000),
      ...(userImages.length > 0 ? { images: userImages } : {}),
      ...(userAudio.length > 0 ? { audio: userAudio } : {}),
      ...(userFiles.length > 0 ? { files: userFiles } : {}),
    });

    // Add placeholder agent message
    this.messageStore.addMessage({
      role: 'agent',
      content: '',
      tool_calls: [],
      streamingError: false,
      created_at: Math.floor(Date.now() / 1000) + 1,
    });

    this.emit('message:update', this.messageStore.getMessages());
    this.eventProcessor.reset();

    let newSessionId = this.configManager.getSessionId();

    formData.append('stream', 'true');
    formData.append('session_id', newSessionId ?? '');

    // Add user_id if configured
    const userId = this.configManager.getUserId();
    if (userId) {
      formData.append('user_id', userId);
    }

    // For team mode, control whether backend sends member events
    if (this.configManager.getMode() === 'team') {
      const streamMembers = this.configManager.getStreamMemberEvents();
      formData.append('stream_member_events', String(streamMembers));
    }

    await this.executeStream({
      apiUrl: runUrl,
      requestBody: formData,
      signal: this.abortController.signal,
      perRequestHeaders: options?.headers,
      perRequestParams: options?.params,
      onChunk: (chunk: RunResponse) => {
        this.handleChunk(chunk, newSessionId, formData.get('message') as string);

        if (
          chunk.event === RunEvent.RunStarted ||
          chunk.event === RunEvent.TeamRunStarted ||
          chunk.event === RunEvent.ReasoningStarted ||
          chunk.event === RunEvent.TeamReasoningStarted
        ) {
          if (chunk.session_id) {
            newSessionId = chunk.session_id;
            this.configManager.setSessionId(chunk.session_id);
          }
        }
      },
      onError: (error) => {
        this.handleError(error, newSessionId);
      },
      onComplete: async () => {
        this.state.isStreaming = false;
        this.currentRunId = undefined;
        this.state.currentRunId = undefined;
        this.abortController = undefined;
        this.emit('stream:end');
        this.emit('message:complete', this.messageStore.getMessages());
        this.emit('state:change', this.getState());

        // Trigger refresh if run completed successfully
        if (this.runCompletedSuccessfully) {
          this.runCompletedSuccessfully = false;
          await this.refreshSessionMessages();
        }
      },
    });
  }

  /**
   * Determine if a RunEvent is a team-level event (prefixed with "Team")
   */
  private isTeamEvent(event: RunEvent): boolean {
    return event.toString().startsWith('Team');
  }

  /**
   * Determine if an event should update the user-facing message based on mode.
   *
   * In team mode: only Team* events should update the user-facing message.
   * In agent mode: only Run* (non-Team) events should update the user-facing message.
   *
   * Certain events are always processed regardless of mode:
   * - CustomEvent, RunPaused, RunContinued (control flow events)
   */
  private shouldProcessForUserMessage(event: RunEvent): boolean {
    // Control flow events are always processed
    if (
      event === RunEvent.CustomEvent ||
      event === RunEvent.RunPaused ||
      event === RunEvent.RunContinued
    ) {
      return true;
    }

    const mode = this.configManager.getMode();
    const isTeam = this.isTeamEvent(event);

    if (mode === 'team') {
      // In team mode, only Team* events update user-facing messages
      return isTeam;
    }

    // In agent mode, only non-Team events update user-facing messages
    return !isTeam;
  }

  /**
   * Emit member-specific events for internal team member activity.
   * Only emits when emitMemberEvents config option is true.
   */
  private emitMemberEvent(event: RunEvent, chunk: RunResponse): void {
    if (!this.configManager.getEmitMemberEvents()) return;

    this.emit('member:event', chunk);

    // Emit specific member events based on event type
    if (event === RunEvent.RunStarted) {
      this.emit('member:started', chunk);
    } else if (event === RunEvent.RunContent) {
      this.emit('member:content', chunk);
    } else if (event === RunEvent.RunCompleted) {
      this.emit('member:completed', chunk);
    } else if (event === RunEvent.RunError) {
      this.emit('member:error', chunk);
    }
  }

  /**
   * Handle streaming chunk
   */
  private handleChunk(chunk: RunResponse, currentSessionId: string | undefined, messageContent: string): void {
    const event = chunk.event as RunEvent;

    // Handle session creation and run ID tracking (always process these regardless of mode)
    if (
      event === RunEvent.RunStarted ||
      event === RunEvent.TeamRunStarted ||
      event === RunEvent.ReasoningStarted ||
      event === RunEvent.TeamReasoningStarted
    ) {
      // Track current run ID (only for root-level events)
      if (this.shouldProcessForUserMessage(event) && chunk.run_id) {
        this.currentRunId = chunk.run_id;
        this.state.currentRunId = chunk.run_id;
        this.emit('state:change', this.getState());
      }

      if (chunk.session_id && (!currentSessionId || currentSessionId !== chunk.session_id)) {
        const sessionData: SessionEntry = {
          session_id: chunk.session_id,
          session_name: messageContent,
          created_at: toSafeISOString(chunk.created_at),
        };

        const sessionExists = this.state.sessions.some(
          (s) => s.session_id === chunk.session_id
        );

        if (!sessionExists) {
          this.state.sessions = [sessionData, ...this.state.sessions];
          this.emit('session:created', sessionData);
        }
      }
    }

    // Handle run cancellation (user-initiated, distinct from errors)
    if (event === RunEvent.RunCancelled || event === RunEvent.TeamRunCancelled) {
      this.handleRunCancelled(chunk);
      return;
    }

    // Handle pause for HITL
    if (event === RunEvent.RunPaused) {
      this.state.isStreaming = false;
      this.state.isPaused = true;
      this.state.pausedRunId = chunk.run_id;
      this.state.toolsAwaitingExecution =
        chunk.tools_awaiting_external_execution ||
        chunk.tools_requiring_confirmation ||
        chunk.tools_requiring_user_input ||
        chunk.tools ||
        [];

      this.emit('run:paused', {
        runId: chunk.run_id,
        sessionId: chunk.session_id,
        tools: this.state.toolsAwaitingExecution,
      });
      this.emit('state:change', this.getState());
      return;
    }

    // In team mode, filter out internal agent events from user-facing messages
    if (!this.shouldProcessForUserMessage(event)) {
      // Emit member events for debugging/advanced UIs if configured
      this.emitMemberEvent(event, chunk);
      return;
    }

    // Handle errors
    if (
      event === RunEvent.RunError ||
      event === RunEvent.TeamRunError
    ) {
      const errorContent =
        (chunk.content as string) || 'Error during run';

      this.state.errorMessage = errorContent;
      const lastMessage = this.messageStore.getLastMessage();
      if (lastMessage?.role === 'agent') {
        this.messageStore.removeLastMessages(1);
      }
      this.emit('message:update', this.messageStore.getMessages());

      // Remove the session if it was just created
      if (chunk.session_id) {
        this.state.sessions = this.state.sessions.filter(
          (s) => s.session_id !== chunk.session_id
        );
      }

      this.emit('message:error', errorContent);
      return;
    }

    // Emit semantic custom:event for CustomEvent types
    if (event === RunEvent.CustomEvent) {
      this.emit('custom:event', chunk as unknown as CustomEventData);
    }

    // Process the chunk and update message
    this.messageStore.updateLastMessage((lastMessage) => {
      const updated = this.eventProcessor.processChunk(chunk, lastMessage);
      return updated || lastMessage;
    });

    // Apply any pending UI specs to newly arrived tool calls
    this.applyPendingUISpecs();

    // Track if run completed successfully for post-stream refresh
    if (event === RunEvent.RunCompleted || event === RunEvent.TeamRunCompleted) {
      this.runCompletedSuccessfully = true;
    }

    this.emit('message:update', this.messageStore.getMessages());
  }

  /**
   * Handle error
   */
  private handleError(error: Error, sessionId: string | undefined): void {
    this.state.isStreaming = false;
    this.state.errorMessage = error.message;

    const lastMessage = this.messageStore.getLastMessage();
    if (lastMessage?.role === 'agent') {
      this.messageStore.removeLastMessages(1);
    }
    this.emit('message:update', this.messageStore.getMessages());

    if (sessionId) {
      this.state.sessions = this.state.sessions.filter(
        (s) => s.session_id !== sessionId
      );
    }

    this.emit('message:error', error.message);
    this.emit('stream:end');
    this.emit('state:change', this.getState());
  }

  /**
   * Handle RunCancelled event from backend
   * Cancellation is user-initiated and distinct from errors
   */
  private handleRunCancelled(chunk: RunResponse): void {
    this.state.isStreaming = false;
    this.state.isCancelling = false;
    this.state.currentRunId = undefined;
    this.currentRunId = undefined;
    this.abortController = undefined;

    // Mark message as cancelled (distinct from error)
    this.messageStore.updateLastMessage((msg) => ({
      ...msg,
      cancelled: true,
    }));

    this.emit('run:cancelled', {
      runId: chunk.run_id,
      sessionId: chunk.session_id,
    });
    this.emit('stream:end');
    this.emit('message:update', this.messageStore.getMessages());
    this.emit('state:change', this.getState());
  }

  /**
   * Handle local cancellation cleanup
   * Called when user cancels, regardless of backend response
   */
  private handleLocalCancellation(): void {
    const runId = this.currentRunId;
    const sessionId = this.configManager.getSessionId();

    this.state.isStreaming = false;
    this.state.isCancelling = false;
    this.state.currentRunId = undefined;
    this.currentRunId = undefined;
    this.abortController = undefined;

    this.messageStore.updateLastMessage((msg) => ({
      ...msg,
      cancelled: true,
    }));

    this.emit('run:cancelled', { runId, sessionId });
    this.emit('stream:end');
    this.emit('message:update', this.messageStore.getMessages());
    this.emit('state:change', this.getState());
  }

  /**
   * Check if an error is a 401 Unauthorized error with "Token has expired" detail.
   * Only triggers token refresh for expired tokens, not other auth failures.
   */
  private isTokenExpiredError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    const errorWithStatus = error as Error & { status?: number };
    const is401 = errorWithStatus.status === 401 || error.message.includes('401');
    const isExpired = error.message.toLowerCase().includes('token has expired');
    return is401 && isExpired;
  }

  /**
   * Attempt to refresh the token using the onTokenExpired callback.
   * If successful, updates the auth token in config.
   *
   * @returns true if token was refreshed, false otherwise
   */
  private async tryRefreshToken(): Promise<boolean> {
    const onTokenExpired = this.configManager.getOnTokenExpired();
    if (!onTokenExpired) {
      return false;
    }

    try {
      const newToken = await onTokenExpired();
      if (newToken) {
        this.configManager.setAuthToken(newToken);
        Logger.debug('Token refreshed successfully');
        return true;
      }
    } catch (refreshError) {
      Logger.warn('Token refresh failed:', refreshError);
    }

    return false;
  }

  /**
   * Execute an operation with automatic token refresh on 401 Unauthorized.
   * Centralizes the token refresh and retry logic for all non-streaming API calls.
   *
   * @param operation - A function that performs the API call and returns a Promise
   * @returns The result of the operation
   * @throws The original error if it's not a 401 or if token refresh fails
   */
  private async withTokenRefresh<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (this.isTokenExpiredError(error)) {
        const refreshed = await this.tryRefreshToken();
        if (refreshed) {
          return await operation();
        }
      }
      throw error;
    }
  }

  /**
   * Execute a streaming request with automatic token refresh on 401 Unauthorized.
   * This method handles the complexity of rebuilding headers after token refresh.
   *
   * @param config - Configuration for the streaming request
   */
  private async executeStream(config: {
    apiUrl: string;
    requestBody: FormData;
    signal: AbortSignal;
    perRequestHeaders?: Record<string, string>;
    perRequestParams?: Record<string, string>;
    onChunk: (chunk: RunResponse) => void;
    onError: (error: Error) => void;
    onComplete: () => Promise<void>;
  }): Promise<void> {
    const executeStream = async () => {
      const headers = this.configManager.buildRequestHeaders(config.perRequestHeaders);
      const params = this.configManager.buildQueryString(config.perRequestParams);

      await streamResponse({
        apiUrl: config.apiUrl,
        headers,
        params,
        requestBody: config.requestBody,
        signal: config.signal,
        onChunk: config.onChunk,
        onError: config.onError,
        onComplete: config.onComplete,
      });
    };

    try {
      await executeStream();
    } catch (error) {
      if (this.isTokenExpiredError(error)) {
        const refreshed = await this.tryRefreshToken();
        if (refreshed) {
          try {
            await executeStream();
            return;
          } catch (retryError) {
            config.onError(
              retryError instanceof Error ? retryError : new Error(String(retryError))
            );
            return;
          }
        }
      }
      config.onError(
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Check if a fetch Response is a 401 with "Token has expired" detail.
   * Reads the response body to check for the specific error message.
   */
  private async isTokenExpiredResponse(response: Response): Promise<boolean> {
    if (response.status !== 401) {
      return false;
    }

    try {
      const cloned = response.clone();
      const body = await cloned.json();
      const detail = body?.detail?.toLowerCase() || '';
      return detail.includes('token has expired');
    } catch {
      return false;
    }
  }

  /**
   * Wrapper for fetch that handles 401 "Token has expired" errors with automatic token refresh and retry.
   * Used for non-streaming API calls.
   *
   * @param url - The URL to fetch
   * @param init - Optional fetch init options (method, body, etc.)
   * @returns The fetch Response
   */
  private async fetchWithTokenRefresh(
    url: string,
    init?: RequestInit
  ): Promise<Response> {
    const headers = this.configManager.buildRequestHeaders(
      init?.headers as Record<string, string> | undefined
    );

    let response = await fetch(url, { ...init, headers });

    // If 401 with "Token has expired", try to refresh token and retry once
    if (await this.isTokenExpiredResponse(response)) {
      const refreshed = await this.tryRefreshToken();
      if (refreshed) {
        const newHeaders = this.configManager.buildRequestHeaders(
          init?.headers as Record<string, string> | undefined
        );
        response = await fetch(url, { ...init, headers: newHeaders });
      }
    }

    return response;
  }

  /**
   * Cancel the current running agent/team run.
   *
   * This will:
   * 1. Abort the local fetch stream (immediate UI feedback)
   * 2. Notify the backend to stop processing
   * 3. Emit 'run:cancelled' event
   *
   * @param options - Optional request headers and query parameters
   * @throws Error if no run is currently streaming
   */
  async cancelRun(options?: {
    headers?: Record<string, string>;
    params?: Record<string, string>;
  }): Promise<void> {
    if (!this.state.isStreaming) {
      throw new Error('No active run to cancel');
    }

    if (!this.currentRunId) {
      throw new Error('No run ID available for cancellation');
    }

    this.state.isCancelling = true;
    this.emit('state:change', this.getState());

    // 1. Abort local stream immediately for instant UI feedback
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = undefined;
    }

    // 2. Notify backend to stop processing
    const cancelUrl = this.configManager.getCancelUrl(this.currentRunId);
    if (!cancelUrl) {
      // Still cleanup local state even if no cancel URL
      this.handleLocalCancellation();
      return;
    }

    const params = this.configManager.buildQueryString(options?.params);
    const url = new URL(cancelUrl);
    if (params.toString()) {
      params.forEach((value, key) => url.searchParams.set(key, value));
    }

    try {
      const response = await this.fetchWithTokenRefresh(url.toString(), {
        method: 'POST',
        headers: options?.headers,
      });

      if (!response.ok) {
        Logger.warn(`[AgnoClient] Cancel request failed: ${response.status}`);
        // Still cleanup local state
      }
    } catch (error) {
      Logger.warn('[AgnoClient] Cancel request error:', error);
      // Still cleanup local state even on network error
    }

    // 3. Cleanup local state (in case backend didn't send RunCancelled event)
    this.handleLocalCancellation();
  }

  /**
   * Get current run ID (if streaming)
   */
  getCurrentRunId(): string | undefined {
    return this.currentRunId;
  }

  /**
   * Refresh messages from the session API after run completion.
   * Replaces streamed messages with authoritative session data.
   * Preserves client-side properties like ui_component that aren't stored on the server.
   * @private
   */
  private async refreshSessionMessages(): Promise<void> {
    const sessionId = this.configManager.getSessionId();
    if (!sessionId) {
      Logger.debug('[AgnoClient] Cannot refresh: no session ID');
      return;
    }

    this.state.isRefreshing = true;
    this.emit('state:change', this.getState());

    try {
      // Preserve client-side properties before refresh (API doesn't store these)
      const existingUIComponents = new Map<string, any>();
      const existingUserAttachments: Array<{
        images?: ChatMessage['images'];
        audio?: ChatMessage['audio'];
        files?: ChatMessage['files'];
      }> = [];

      for (const message of this.messageStore.getMessages()) {
        // Preserve ui_component from tool calls
        if (message.tool_calls) {
          for (const toolCall of message.tool_calls) {
            if ((toolCall as any).ui_component) {
              existingUIComponents.set(toolCall.tool_call_id, (toolCall as any).ui_component);
            }
          }
        }
        // Preserve user message attachments (blob URLs created client-side)
        if (message.role === 'user') {
          existingUserAttachments.push({
            images: message.images,
            audio: message.audio,
            files: message.files,
          });
        }
      }

      const config = this.configManager.getConfig();
      const entityType = this.configManager.getMode();
      const dbId = this.configManager.getDbId() || '';
      const userId = this.configManager.getUserId();

      const params = this.configManager.buildQueryString();

      const response = await this.withTokenRefresh(() => {
        const headers = this.configManager.buildRequestHeaders();
        return this.sessionManager.fetchSession(
          config.endpoint,
          entityType,
          sessionId,
          dbId,
          headers,
          userId,
          params
        );
      });

      const messages = this.sessionManager.convertSessionToMessages(response);

      // Re-apply preserved ui_component properties to matching tool calls
      if (existingUIComponents.size > 0) {
        for (const message of messages) {
          if (message.tool_calls) {
            for (let i = 0; i < message.tool_calls.length; i++) {
              const toolCall = message.tool_calls[i];
              const uiComponent = existingUIComponents.get(toolCall.tool_call_id);
              if (uiComponent) {
                (message.tool_calls[i] as any).ui_component = uiComponent;
              }
            }
          }
        }
      }

      // Re-apply preserved user attachments (blob URLs) to user messages
      // The API may not return input_media, so we fall back to client-side data
      if (existingUserAttachments.length > 0) {
        let userIdx = 0;
        for (const message of messages) {
          if (message.role === 'user' && userIdx < existingUserAttachments.length) {
            const saved = existingUserAttachments[userIdx];
            // Only apply if the refreshed message lacks attachments
            if (!message.images?.length && saved.images?.length) {
              message.images = saved.images;
            }
            if (!message.audio?.length && saved.audio?.length) {
              message.audio = saved.audio;
            }
            if (!message.files?.length && saved.files?.length) {
              message.files = saved.files;
            }
            userIdx++;
          }
        }
      }

      this.messageStore.setMessages(messages);

      Logger.debug('[AgnoClient] Session refreshed:', `${messages.length} messages`);

      this.emit('message:refreshed', messages);
      this.emit('message:update', messages);
    } catch (error) {
      Logger.error('[AgnoClient] Failed to refresh session:', error);
      this.emit('message:error', `Session refresh failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      this.state.isRefreshing = false;
      this.emit('state:change', this.getState());
    }
  }

  /**
   * Load a session
   */
  async loadSession(
    sessionId: string,
    options?: { params?: Record<string, string> }
  ): Promise<ChatMessage[]> {
    Logger.debug('[AgnoClient] loadSession called with sessionId:', sessionId);
    const config = this.configManager.getConfig();
    const entityType = this.configManager.getMode();
    const dbId = this.configManager.getDbId() || '';
    const userId = this.configManager.getUserId();
    Logger.debug('[AgnoClient] Loading session with:', { entityType, dbId, userId });

    const params = this.configManager.buildQueryString(options?.params);

    const response = await this.withTokenRefresh(() => {
      const headers = this.configManager.buildRequestHeaders();
      return this.sessionManager.fetchSession(
        config.endpoint,
        entityType,
        sessionId,
        dbId,
        headers,
        userId,
        params
      );
    });

    const messages = this.sessionManager.convertSessionToMessages(response);
    Logger.debug('[AgnoClient] Setting messages to store:', `${messages.length} messages`);
    this.messageStore.setMessages(messages);
    this.configManager.setSessionId(sessionId);
    this.state.errorMessage = undefined;

    Logger.debug('[AgnoClient] Emitting events...');
    this.emit('session:loaded', sessionId);
    this.emit('message:update', this.messageStore.getMessages());
    this.emit('state:change', this.getState());
    Logger.debug('[AgnoClient] Events emitted, returning messages');

    return messages;
  }

  /**
   * Fetch all sessions
   */
  async fetchSessions(options?: { params?: Record<string, string> }): Promise<SessionEntry[]> {
    const config = this.configManager.getConfig();
    const entityType = this.configManager.getMode();
    const entityId = this.configManager.getCurrentEntityId();
    const dbId = this.configManager.getDbId() || '';

    if (!entityId) {
      throw new Error('Entity ID must be configured');
    }

    const params = this.configManager.buildQueryString(options?.params);

    const sessions = await this.withTokenRefresh(() => {
      const headers = this.configManager.buildRequestHeaders();
      return this.sessionManager.fetchSessions(
        config.endpoint,
        entityType,
        entityId,
        dbId,
        headers,
        params
      );
    });

    this.state.sessions = sessions;
    this.emit('state:change', this.getState());

    return sessions;
  }

  /**
   * Delete a session
   */
  async deleteSession(
    sessionId: string,
    options?: { params?: Record<string, string> }
  ): Promise<void> {
    const config = this.configManager.getConfig();
    const dbId = this.configManager.getDbId() || '';

    const params = this.configManager.buildQueryString(options?.params);

    await this.withTokenRefresh(() => {
      const headers = this.configManager.buildRequestHeaders();
      return this.sessionManager.deleteSession(
        config.endpoint,
        sessionId,
        dbId,
        headers,
        params
      );
    });

    // Remove from state
    this.state.sessions = this.state.sessions.filter(
      (s) => s.session_id !== sessionId
    );

    // Clear messages if this was the current session
    if (this.configManager.getSessionId() === sessionId) {
      this.clearMessages();
    }

    this.emit('session:deleted', { sessionId });
    this.emit('state:change', this.getState());
  }

  /**
   * Get a session by ID
   */
  async getSessionById(
    sessionId: string,
    options?: { params?: Record<string, string> }
  ): Promise<AgentSessionDetailSchema | TeamSessionDetailSchema> {
    const config = this.configManager.getConfig();
    const entityType = this.configManager.getMode();
    const dbId = this.configManager.getDbId() || '';
    const userId = this.configManager.getUserId();

    const params = this.configManager.buildQueryString(options?.params);

    return await this.withTokenRefresh(() => {
      const headers = this.configManager.buildRequestHeaders();
      return this.sessionManager.getSessionById(
        config.endpoint,
        entityType,
        sessionId,
        dbId,
        headers,
        userId,
        params
      );
    });
  }

  /**
   * Get a run by ID
   */
  async getRunById(
    sessionId: string,
    runId: string,
    options?: { params?: Record<string, string> }
  ): Promise<RunSchema | TeamRunSchema> {
    const config = this.configManager.getConfig();
    const entityType = this.configManager.getMode();
    const dbId = this.configManager.getDbId() || '';
    const userId = this.configManager.getUserId();

    const params = this.configManager.buildQueryString(options?.params);

    return await this.withTokenRefresh(() => {
      const headers = this.configManager.buildRequestHeaders();
      return this.sessionManager.getRunById(
        config.endpoint,
        entityType,
        sessionId,
        runId,
        dbId,
        headers,
        userId,
        params
      );
    });
  }

  /**
   * Create a new session
   */
  async createSession(
    request?: CreateSessionRequest,
    options?: { params?: Record<string, string> }
  ): Promise<AgentSessionDetailSchema | TeamSessionDetailSchema> {
    const config = this.configManager.getConfig();
    const entityType = this.configManager.getMode();
    const entityId = this.configManager.getCurrentEntityId();
    const dbId = this.configManager.getDbId() || '';

    // Build request with entity ID
    const sessionRequest: CreateSessionRequest = {
      ...request,
      ...(entityType === 'agent' ? { agent_id: entityId } : { team_id: entityId }),
    };

    const params = this.configManager.buildQueryString(options?.params);

    const session = await this.withTokenRefresh(() => {
      const headers = this.configManager.buildRequestHeaders();
      return this.sessionManager.createSession(
        config.endpoint,
        entityType,
        sessionRequest,
        dbId,
        headers,
        params
      );
    });

    // Add to state and emit event
    const sessionEntry: SessionEntry = {
      session_id: session.session_id,
      session_name: session.session_name,
      created_at: session.created_at || null,
      updated_at: session.updated_at || null,
    };
    this.state.sessions = [sessionEntry, ...this.state.sessions];
    this.emit('session:created', sessionEntry);
    this.emit('state:change', this.getState());

    return session;
  }

  /**
   * Update a session
   */
  async updateSession(
    sessionId: string,
    request: UpdateSessionRequest,
    options?: { params?: Record<string, string> }
  ): Promise<AgentSessionDetailSchema | TeamSessionDetailSchema> {
    const config = this.configManager.getConfig();
    const entityType = this.configManager.getMode();
    const dbId = this.configManager.getDbId() || '';
    const userId = this.configManager.getUserId();

    const params = this.configManager.buildQueryString(options?.params);

    const session = await this.withTokenRefresh(() => {
      const headers = this.configManager.buildRequestHeaders();
      return this.sessionManager.updateSession(
        config.endpoint,
        entityType,
        sessionId,
        request,
        dbId,
        headers,
        userId,
        params
      );
    });

    // Update in state
    this.state.sessions = this.state.sessions.map((s) =>
      s.session_id === sessionId
        ? {
            ...s,
            session_name: session.session_name,
            updated_at: session.updated_at || s.updated_at,
          }
        : s
    );
    this.emit('session:updated', session);
    this.emit('state:change', this.getState());

    return session;
  }

  /**
   * Rename a session
   */
  async renameSession(
    sessionId: string,
    newName: string,
    options?: { params?: Record<string, string> }
  ): Promise<AgentSessionDetailSchema | TeamSessionDetailSchema> {
    const config = this.configManager.getConfig();
    const entityType = this.configManager.getMode();
    const dbId = this.configManager.getDbId() || '';

    const params = this.configManager.buildQueryString(options?.params);

    const session = await this.withTokenRefresh(() => {
      const headers = this.configManager.buildRequestHeaders();
      return this.sessionManager.renameSession(
        config.endpoint,
        entityType,
        sessionId,
        newName,
        dbId,
        headers,
        params
      );
    });

    // Update in state
    this.state.sessions = this.state.sessions.map((s) =>
      s.session_id === sessionId
        ? {
            ...s,
            session_name: newName,
            updated_at: session.updated_at || s.updated_at,
          }
        : s
    );
    this.emit('session:renamed', { sessionId, newName, session });
    this.emit('state:change', this.getState());

    return session;
  }

  /**
   * Delete multiple sessions
   */
  async deleteMultipleSessions(
    sessionIds: string[],
    options?: { params?: Record<string, string> }
  ): Promise<void> {
    const config = this.configManager.getConfig();
    const entityType = this.configManager.getMode();
    const dbId = this.configManager.getDbId() || '';

    // All sessions will be of the same type (current entity type)
    const sessionTypes = sessionIds.map(() => entityType);

    const params = this.configManager.buildQueryString(options?.params);

    await this.withTokenRefresh(() => {
      const headers = this.configManager.buildRequestHeaders();
      return this.sessionManager.deleteMultipleSessions(
        config.endpoint,
        sessionIds,
        sessionTypes,
        dbId,
        headers,
        params
      );
    });

    // Remove from state
    const deletedIds = new Set(sessionIds);
    this.state.sessions = this.state.sessions.filter(
      (s) => !deletedIds.has(s.session_id)
    );

    // Clear messages if current session was deleted
    const currentSessionId = this.configManager.getSessionId();
    if (currentSessionId && deletedIds.has(currentSessionId)) {
      this.clearMessages();
    }

    this.emit('sessions:deleted', { sessionIds });
    this.emit('state:change', this.getState());
  }

  /**
   * Add tool calls to the last message
   * Used by frontend execution to add tool calls that were executed locally
   */
  addToolCallsToLastMessage(toolCalls: ToolCall[]): void {
    const lastMessage = this.messageStore.getLastMessage();
    if (!lastMessage || lastMessage.role !== 'agent') {
      return;
    }

    const existingToolCalls = lastMessage.tool_calls || [];
    const existingIds = new Set(existingToolCalls.map(t => t.tool_call_id));

    // Only add tool calls that don't already exist
    const newToolCalls = toolCalls.filter(t => !existingIds.has(t.tool_call_id));

    if (newToolCalls.length > 0) {
      this.messageStore.updateLastMessage((msg) => ({
        ...msg,
        tool_calls: [...existingToolCalls, ...newToolCalls],
      }));

      this.emit('message:update', this.messageStore.getMessages());
    }
  }

  /**
   * Hydrate a specific tool call with its UI component
   * If tool call doesn't exist yet, stores UI spec as pending
   */
  hydrateToolCallUI(toolCallId: string, uiSpec: any): void {
    // Find the message containing this tool call and update it
    const messages = this.messageStore.getMessages();

    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];

      if (message.tool_calls) {
        const toolIndex = message.tool_calls.findIndex(
          t => t.tool_call_id === toolCallId
        );

        if (toolIndex !== -1) {
          // Update this specific message
          this.messageStore.updateMessage(i, (msg) => {
            const updatedToolCalls = [...(msg.tool_calls || [])];
            updatedToolCalls[toolIndex] = {
              ...updatedToolCalls[toolIndex],
              ui_component: uiSpec,
            };

            return {
              ...msg,
              tool_calls: updatedToolCalls,
            };
          });

          // Remove from pending if it was there
          this.pendingUISpecs.delete(toolCallId);

          // Emit event to sync with React state
          this.emit('message:update', this.messageStore.getMessages());
          return;
        }
      }
    }

    // Tool call not found yet - store UI spec as pending
    this.pendingUISpecs.set(toolCallId, uiSpec);
  }

  /**
   * Apply any pending UI specs to tool calls that have just been added
   * Called after message updates to attach UI to newly arrived tool calls
   * Batches all updates to emit only one message:update event
   */
  private applyPendingUISpecs(): void {
    if (this.pendingUISpecs.size === 0) return;

    const messages = this.messageStore.getMessages();
    const updatedMessages: { index: number; message: ChatMessage }[] = [];

    // Collect all updates first (batching)
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];

      if (message.tool_calls) {
        let messageUpdated = false;
        const updatedToolCalls = [...message.tool_calls];

        for (let j = 0; j < updatedToolCalls.length; j++) {
          const toolCall = updatedToolCalls[j];
          const pendingUI = this.pendingUISpecs.get(toolCall.tool_call_id);

          if (pendingUI && !(toolCall as any).ui_component) {
            updatedToolCalls[j] = {
              ...updatedToolCalls[j],
              ui_component: pendingUI,
            };

            this.pendingUISpecs.delete(toolCall.tool_call_id);
            messageUpdated = true;
          }
        }

        if (messageUpdated) {
          updatedMessages.push({
            index: i,
            message: {
              ...message,
              tool_calls: updatedToolCalls,
            },
          });
        }
      }
    }

    // Apply all updates at once
    if (updatedMessages.length > 0) {
      updatedMessages.forEach(({ index, message }) => {
        this.messageStore.updateMessage(index, () => message);
      });

      this.emit('message:update', this.messageStore.getMessages());
    }
  }

  /**
   * Continue a paused run with tool execution results.
   *
   * **Note:** HITL (Human-in-the-Loop) frontend tool execution is only supported for agents.
   * Teams do not support the continue endpoint.
   *
   * To cancel a running request, use the `cancelRun()` method.
   *
   * @param tools - Array of tool calls with execution results
   * @param options - Optional request headers and query parameters
   * @throws Error if no paused run exists
   * @throws Error if called with team mode (teams don't support HITL)
   */
  async continueRun(
    tools: ToolCall[],
    options?: { headers?: Record<string, string>; params?: Record<string, string> }
  ): Promise<void> {
    // Validate that we're not in team mode (teams don't support continue endpoint)
    if (this.configManager.getMode() === 'team') {
      throw new Error(
        'HITL (Human-in-the-Loop) frontend tool execution is not supported for teams. ' +
        'Only agents support the continue endpoint.'
      );
    }

    if (!this.state.isPaused || !this.state.pausedRunId) {
      throw new Error('No paused run to continue');
    }

    const runUrl = this.configManager.getRunUrl();
    if (!runUrl) {
      throw new Error('No agent or team selected');
    }

    // Build continue URL: POST /agents/{id}/runs/{run_id}/continue
    const continueUrl = `${runUrl}/${this.state.pausedRunId}/continue`;

    // Create new AbortController for this request
    this.abortController = new AbortController();

    this.state.isPaused = false;
    this.state.isStreaming = true;
    this.emit('run:continued', { runId: this.state.pausedRunId });
    this.emit('state:change', this.getState());

    // Clean tools before sending to backend (remove UI-specific fields)
    const cleanedTools = tools.map(tool => {
      const { ui_component, ...backendTool } = tool as any;
      return backendTool;
    });

    const formData = new FormData();
    formData.append('tools', JSON.stringify(cleanedTools));
    formData.append('stream', 'true');

    const currentSessionId = this.configManager.getSessionId();
    if (currentSessionId) {
      formData.append('session_id', currentSessionId);
    }

    // Add user_id if configured
    const userId = this.configManager.getUserId();
    if (userId) {
      formData.append('user_id', userId);
    }

    await this.executeStream({
      apiUrl: continueUrl,
      requestBody: formData,
      signal: this.abortController.signal,
      perRequestHeaders: options?.headers,
      perRequestParams: options?.params,
      onChunk: (chunk: RunResponse) => {
        this.handleChunk(chunk, currentSessionId, '');
      },
      onError: (error) => {
        this.handleError(error, currentSessionId);
      },
      onComplete: async () => {
        this.state.isStreaming = false;
        this.state.pausedRunId = undefined;
        this.state.toolsAwaitingExecution = undefined;
        this.currentRunId = undefined;
        this.state.currentRunId = undefined;
        this.abortController = undefined;
        this.emit('stream:end');
        this.emit('message:complete', this.messageStore.getMessages());
        this.emit('state:change', this.getState());

        // Trigger refresh if run completed successfully
        if (this.runCompletedSuccessfully) {
          this.runCompletedSuccessfully = false;
          await this.refreshSessionMessages();
        }
      },
    });
  }

  /**
   * Check endpoint status
   */
  async checkStatus(options?: { params?: Record<string, string> }): Promise<boolean> {
    try {
      const params = this.configManager.buildQueryString(options?.params);
      const url = new URL(`${this.configManager.getEndpoint()}/health`);
      if (params.toString()) {
        params.forEach((value, key) => {
          url.searchParams.set(key, value);
        });
      }
      const response = await this.fetchWithTokenRefresh(url.toString());
      const isActive = response.ok;
      this.state.isEndpointActive = isActive;
      this.emit('state:change', this.getState());
      return isActive;
    } catch {
      this.state.isEndpointActive = false;
      this.emit('state:change', this.getState());
      return false;
    }
  }

  /**
   * Fetch agents from endpoint
   */
  async fetchAgents(options?: { params?: Record<string, string> }): Promise<AgentDetails[]> {
    const params = this.configManager.buildQueryString(options?.params);
    const url = new URL(`${this.configManager.getEndpoint()}/agents`);
    if (params.toString()) {
      params.forEach((value, key) => {
        url.searchParams.set(key, value);
      });
    }
    const response = await this.fetchWithTokenRefresh(url.toString());
    if (!response.ok) {
      throw new Error('Failed to fetch agents');
    }

    const agents: AgentDetails[] = await response.json();
    this.state.agents = agents;
    this.emit('state:change', this.getState());

    return agents;
  }

  /**
   * Fetch teams from endpoint
   */
  async fetchTeams(options?: { params?: Record<string, string> }): Promise<TeamDetails[]> {
    const params = this.configManager.buildQueryString(options?.params);
    const url = new URL(`${this.configManager.getEndpoint()}/teams`);
    if (params.toString()) {
      params.forEach((value, key) => {
        url.searchParams.set(key, value);
      });
    }
    const response = await this.fetchWithTokenRefresh(url.toString());
    if (!response.ok) {
      throw new Error('Failed to fetch teams');
    }

    const teams: TeamDetails[] = await response.json();
    this.state.teams = teams;
    this.emit('state:change', this.getState());

    return teams;
  }

  /**
   * Initialize client (check status and fetch agents/teams)
   * Automatically selects the first available agent or team if none is configured
   */
  async initialize(options?: { params?: Record<string, string> }): Promise<{
    agents: AgentDetails[];
    teams: TeamDetails[];
  }> {
    const isActive = await this.checkStatus(options);
    if (!isActive) {
      return { agents: [], teams: [] };
    }

    const [agents, teams] = await Promise.all([
      this.fetchAgents(options),
      this.fetchTeams(options),
    ]);

    // Auto-select first available agent or team if none is configured
    const currentConfig = this.configManager.getConfig();
    const hasAgentConfigured = currentConfig.agentId;
    const hasTeamConfigured = currentConfig.teamId;

    if (!hasAgentConfigured && !hasTeamConfigured) {
      if (agents.length > 0) {
        // Select first agent
        const firstAgent = agents[0];
        this.configManager.updateConfig({
          mode: 'agent',
          agentId: firstAgent.id,
          dbId: firstAgent.db_id || undefined,
        });
        this.emit('config:change', this.configManager.getConfig());
      } else if (teams.length > 0) {
        // Select first team if no agents available
        const firstTeam = teams[0];
        this.configManager.updateConfig({
          mode: 'team',
          teamId: firstTeam.id,
          dbId: firstTeam.db_id || undefined,
        });
        this.emit('config:change', this.configManager.getConfig());
      }
    }

    return { agents, teams };
  }

  // ============================================================================
  // Memory Methods
  // ============================================================================

  /**
   * Fetch memories with optional filtering and pagination
   */
  async fetchMemories(
    queryParams?: ListMemoriesParams,
    options?: { params?: Record<string, string> }
  ): Promise<MemoriesListResponse> {
    const config = this.configManager.getConfig();
    const dbId = this.configManager.getDbId() || '';

    const params = this.configManager.buildQueryString(options?.params);

    const response = await this.withTokenRefresh(() => {
      const headers = this.configManager.buildRequestHeaders();
      return this.memoryManager.fetchMemories(
        config.endpoint,
        dbId,
        headers,
        queryParams,
        params
      );
    });

    this.state.memories = response.data;
    this.emit('state:change', this.getState());

    return response;
  }

  /**
   * Get a specific memory by ID
   */
  async getMemoryById(
    memoryId: string,
    options?: { params?: Record<string, string>; table?: string }
  ): Promise<UserMemory> {
    const config = this.configManager.getConfig();
    const dbId = this.configManager.getDbId() || '';
    const userId = this.configManager.getUserId();

    const params = this.configManager.buildQueryString(options?.params);

    return await this.withTokenRefresh(() => {
      const headers = this.configManager.buildRequestHeaders();
      return this.memoryManager.getMemoryById(
        config.endpoint,
        memoryId,
        dbId,
        headers,
        userId,
        options?.table,
        params
      );
    });
  }

  /**
   * Get all available memory topics
   */
  async getMemoryTopics(
    options?: { params?: Record<string, string>; table?: string }
  ): Promise<string[]> {
    const config = this.configManager.getConfig();
    const dbId = this.configManager.getDbId() || '';

    const params = this.configManager.buildQueryString(options?.params);

    const topics = await this.withTokenRefresh(() => {
      const headers = this.configManager.buildRequestHeaders();
      return this.memoryManager.getMemoryTopics(
        config.endpoint,
        dbId,
        headers,
        options?.table,
        params
      );
    });

    this.state.memoryTopics = topics;
    this.emit('state:change', this.getState());

    return topics;
  }

  /**
   * Get user memory statistics
   */
  async getUserMemoryStats(
    queryParams?: UserMemoryStatsParams,
    options?: { params?: Record<string, string> }
  ): Promise<UserMemoryStatsResponse> {
    const config = this.configManager.getConfig();
    const dbId = this.configManager.getDbId() || '';

    const params = this.configManager.buildQueryString(options?.params);

    return await this.withTokenRefresh(() => {
      const headers = this.configManager.buildRequestHeaders();
      return this.memoryManager.getUserMemoryStats(
        config.endpoint,
        dbId,
        headers,
        queryParams,
        params
      );
    });
  }

  /**
   * Create a new memory
   */
  async createMemory(
    request: CreateMemoryRequest,
    options?: { params?: Record<string, string>; table?: string }
  ): Promise<UserMemory> {
    const config = this.configManager.getConfig();
    const dbId = this.configManager.getDbId() || '';

    const params = this.configManager.buildQueryString(options?.params);

    const memory = await this.withTokenRefresh(() => {
      const headers = this.configManager.buildRequestHeaders();
      return this.memoryManager.createMemory(
        config.endpoint,
        request,
        dbId,
        headers,
        options?.table,
        params
      );
    });

    // Add to state
    this.state.memories = [memory, ...this.state.memories];
    this.emit('memory:created', memory);
    this.emit('state:change', this.getState());

    return memory;
  }

  /**
   * Update an existing memory
   */
  async updateMemory(
    memoryId: string,
    request: UpdateMemoryRequest,
    options?: { params?: Record<string, string>; table?: string }
  ): Promise<UserMemory> {
    const config = this.configManager.getConfig();
    const dbId = this.configManager.getDbId() || '';

    const params = this.configManager.buildQueryString(options?.params);

    const memory = await this.withTokenRefresh(() => {
      const headers = this.configManager.buildRequestHeaders();
      return this.memoryManager.updateMemory(
        config.endpoint,
        memoryId,
        request,
        dbId,
        headers,
        options?.table,
        params
      );
    });

    // Update in state
    this.state.memories = this.state.memories.map((m) =>
      m.memory_id === memoryId ? memory : m
    );
    this.emit('memory:updated', memory);
    this.emit('state:change', this.getState());

    return memory;
  }

  /**
   * Delete a single memory
   */
  async deleteMemory(
    memoryId: string,
    options?: { params?: Record<string, string>; table?: string }
  ): Promise<void> {
    const config = this.configManager.getConfig();
    const dbId = this.configManager.getDbId() || '';
    const userId = this.configManager.getUserId();

    const params = this.configManager.buildQueryString(options?.params);

    await this.withTokenRefresh(() => {
      const headers = this.configManager.buildRequestHeaders();
      return this.memoryManager.deleteMemory(
        config.endpoint,
        memoryId,
        dbId,
        headers,
        userId,
        options?.table,
        params
      );
    });

    // Remove from state
    this.state.memories = this.state.memories.filter(
      (m) => m.memory_id !== memoryId
    );
    this.emit('memory:deleted', { memoryId });
    this.emit('state:change', this.getState());
  }

  /**
   * Delete multiple memories
   */
  async deleteMultipleMemories(
    memoryIds: string[],
    options?: { params?: Record<string, string>; table?: string; userId?: string }
  ): Promise<void> {
    const config = this.configManager.getConfig();
    const dbId = this.configManager.getDbId() || '';

    const params = this.configManager.buildQueryString(options?.params);

    const request: DeleteMultipleMemoriesRequest = {
      memory_ids: memoryIds,
      user_id: options?.userId,
    };

    await this.withTokenRefresh(() => {
      const headers = this.configManager.buildRequestHeaders();
      return this.memoryManager.deleteMultipleMemories(
        config.endpoint,
        request,
        dbId,
        headers,
        options?.table,
        params
      );
    });

    // Remove from state
    const deletedIds = new Set(memoryIds);
    this.state.memories = this.state.memories.filter(
      (m) => !deletedIds.has(m.memory_id)
    );
    this.emit('memories:deleted', { memoryIds });
    this.emit('state:change', this.getState());
  }

  // ============================================================================
  // Knowledge API Methods
  // ============================================================================

  /**
   * Get knowledge configuration
   */
  async getKnowledgeConfig(
    options?: { dbId?: string; params?: Record<string, string> }
  ): Promise<KnowledgeConfigResponse> {
    const config = this.configManager.getConfig();
    const params = this.configManager.buildQueryString(options?.params);

    return await this.withTokenRefresh(() => {
      const headers = this.configManager.buildRequestHeaders();
      return this.knowledgeManager.getConfig(
        config.endpoint,
        headers,
        options?.dbId ?? this.configManager.getDbId(),
        params
      );
    });
  }

  /**
   * List knowledge content
   */
  async listKnowledgeContent(
    listOptions?: ContentListOptions,
    options?: { params?: Record<string, string> }
  ): Promise<ContentListResponse> {
    const config = this.configManager.getConfig();
    const params = this.configManager.buildQueryString(options?.params);

    return await this.withTokenRefresh(() => {
      const headers = this.configManager.buildRequestHeaders();
      return this.knowledgeManager.listContent(
        config.endpoint,
        headers,
        listOptions,
        params
      );
    });
  }

  /**
   * Get knowledge content by ID
   */
  async getKnowledgeContent(
    contentId: string,
    options?: { dbId?: string; params?: Record<string, string> }
  ): Promise<ContentResponse> {
    const config = this.configManager.getConfig();
    const params = this.configManager.buildQueryString(options?.params);

    return await this.withTokenRefresh(() => {
      const headers = this.configManager.buildRequestHeaders();
      return this.knowledgeManager.getContent(
        config.endpoint,
        contentId,
        headers,
        options?.dbId ?? this.configManager.getDbId(),
        params
      );
    });
  }

  /**
   * Get knowledge content status
   */
  async getKnowledgeContentStatus(
    contentId: string,
    options?: { dbId?: string; params?: Record<string, string> }
  ): Promise<ContentStatusResponse> {
    const config = this.configManager.getConfig();
    const params = this.configManager.buildQueryString(options?.params);

    return await this.withTokenRefresh(() => {
      const headers = this.configManager.buildRequestHeaders();
      return this.knowledgeManager.getContentStatus(
        config.endpoint,
        contentId,
        headers,
        options?.dbId ?? this.configManager.getDbId(),
        params
      );
    });
  }

  /**
   * Search knowledge base
   */
  async searchKnowledge(
    request: VectorSearchRequest,
    options?: { params?: Record<string, string> }
  ): Promise<VectorSearchResponse> {
    const config = this.configManager.getConfig();
    const params = this.configManager.buildQueryString(options?.params);

    // Use dbId from config if not specified in request
    const searchRequest: VectorSearchRequest = {
      ...request,
      db_id: request.db_id ?? this.configManager.getDbId(),
    };

    return await this.withTokenRefresh(() => {
      const headers = this.configManager.buildRequestHeaders();
      return this.knowledgeManager.search(
        config.endpoint,
        searchRequest,
        headers,
        params
      );
    });
  }

  /**
   * Upload knowledge content
   * @param data - FormData with file/text_content or ContentUploadRequest object
   */
  async uploadKnowledgeContent(
    data:
      | FormData
      | {
          name?: string;
          description?: string;
          url?: string;
          metadata?: Record<string, unknown>;
          file?: File;
          text_content?: string;
          reader_id?: string;
          chunker?: string;
          chunk_size?: number;
          chunk_overlap?: number;
        },
    options?: { dbId?: string; params?: Record<string, string> }
  ): Promise<ContentResponse> {
    const config = this.configManager.getConfig();
    const params = this.configManager.buildQueryString(options?.params);

    // Convert object to FormData if needed
    let formData: FormData;
    if (data instanceof FormData) {
      formData = data;
    } else {
      formData = new FormData();
      if (data.name) formData.append('name', data.name);
      if (data.description) formData.append('description', data.description);
      if (data.url) formData.append('url', data.url);
      if (data.metadata) formData.append('metadata', JSON.stringify(data.metadata));
      if (data.file) formData.append('file', data.file);
      if (data.text_content) formData.append('text_content', data.text_content);
      if (data.reader_id) formData.append('reader_id', data.reader_id);
      if (data.chunker) formData.append('chunker', data.chunker);
      if (data.chunk_size !== undefined)
        formData.append('chunk_size', String(data.chunk_size));
      if (data.chunk_overlap !== undefined)
        formData.append('chunk_overlap', String(data.chunk_overlap));
    }

    return await this.withTokenRefresh(() => {
      const headers = this.configManager.buildRequestHeaders();
      return this.knowledgeManager.uploadContent(
        config.endpoint,
        formData,
        headers,
        options?.dbId ?? this.configManager.getDbId(),
        params
      );
    });
  }

  /**
   * Update knowledge content
   */
  async updateKnowledgeContent(
    contentId: string,
    request: ContentUpdateRequest,
    options?: { dbId?: string; params?: Record<string, string> }
  ): Promise<ContentResponse> {
    const config = this.configManager.getConfig();
    const params = this.configManager.buildQueryString(options?.params);

    return await this.withTokenRefresh(() => {
      const headers = this.configManager.buildRequestHeaders();
      return this.knowledgeManager.updateContent(
        config.endpoint,
        contentId,
        request,
        headers,
        options?.dbId ?? this.configManager.getDbId(),
        params
      );
    });
  }

  /**
   * Delete all knowledge content
   */
  async deleteAllKnowledgeContent(
    options?: { dbId?: string; params?: Record<string, string> }
  ): Promise<void> {
    const config = this.configManager.getConfig();
    const params = this.configManager.buildQueryString(options?.params);

    await this.withTokenRefresh(() => {
      const headers = this.configManager.buildRequestHeaders();
      return this.knowledgeManager.deleteAllContent(
        config.endpoint,
        headers,
        options?.dbId ?? this.configManager.getDbId(),
        params
      );
    });
  }

  /**
   * Delete knowledge content by ID
   */
  async deleteKnowledgeContent(
    contentId: string,
    options?: { dbId?: string; params?: Record<string, string> }
  ): Promise<ContentResponse> {
    const config = this.configManager.getConfig();
    const params = this.configManager.buildQueryString(options?.params);

    return await this.withTokenRefresh(() => {
      const headers = this.configManager.buildRequestHeaders();
      return this.knowledgeManager.deleteContent(
        config.endpoint,
        contentId,
        headers,
        options?.dbId ?? this.configManager.getDbId(),
        params
      );
    });
  }

  // ============================================================================
  // Metrics API Methods
  // ============================================================================

  /**
   * Fetch aggregated metrics from the endpoint
   *
   * @param options - Options including date range, dbId, table, and custom params
   * @returns MetricsResponse containing daily aggregated metrics
   */
  async fetchMetrics(options?: MetricsOptions): Promise<MetricsResponse> {
    const url = new URL(`${this.configManager.getEndpoint()}/metrics`);

    // Build query params from global config + per-request params
    const params = this.configManager.buildQueryString(options?.params);

    // Add metrics-specific parameters
    if (options?.startingDate) {
      params.set('starting_date', options.startingDate);
    }
    if (options?.endingDate) {
      params.set('ending_date', options.endingDate);
    }

    // Use provided dbId or fall back to config
    const dbId = options?.dbId ?? this.configManager.getDbId();
    if (dbId) {
      params.set('db_id', dbId);
    }

    if (options?.table) {
      params.set('table', options.table);
    }

    // Apply params to URL
    if (params.toString()) {
      params.forEach((value, key) => {
        url.searchParams.set(key, value);
      });
    }

    const response = await this.fetchWithTokenRefresh(url.toString());
    if (!response.ok) {
      throw new Error(`Failed to fetch metrics: ${response.status} ${response.statusText}`);
    }

    const metrics: MetricsResponse = await response.json();
    return metrics;
  }

  /**
   * Refresh/recalculate metrics on the backend
   *
   * @param options - Options including dbId, table, and custom params
   * @returns Array of refreshed DayAggregatedMetrics
   */
  async refreshMetrics(options?: RefreshMetricsOptions): Promise<DayAggregatedMetrics[]> {
    const url = new URL(`${this.configManager.getEndpoint()}/metrics/refresh`);

    // Build query params from global config + per-request params
    const params = this.configManager.buildQueryString(options?.params);

    // Use provided dbId or fall back to config
    const dbId = options?.dbId ?? this.configManager.getDbId();
    if (dbId) {
      params.set('db_id', dbId);
    }

    if (options?.table) {
      params.set('table', options.table);
    }

    // Apply params to URL
    if (params.toString()) {
      params.forEach((value, key) => {
        url.searchParams.set(key, value);
      });
    }

    const response = await this.fetchWithTokenRefresh(url.toString(), {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh metrics: ${response.status} ${response.statusText}`);
    }

    const metrics: DayAggregatedMetrics[] = await response.json();
    return metrics;
  }

  // ============================================================================
  // Evaluation Methods
  // ============================================================================

  /**
   * List evaluation runs with optional filtering and pagination
   * @param listParams - Parameters for filtering and pagination
   * @param options - Optional request query parameters
   */
  async listEvalRuns(
    listParams: ListEvalRunsParams = {},
    options?: { params?: Record<string, string> }
  ): Promise<EvalRunsListResponse> {
    const additionalParams = this.configManager.buildQueryString(options?.params);

    return await this.withTokenRefresh(() => {
      const headers = this.configManager.buildRequestHeaders();
      return this.evalManager.listEvalRuns(
        this.configManager.getEndpoint(),
        listParams,
        headers,
        additionalParams
      );
    });
  }

  /**
   * Get a specific evaluation run by ID
   * @param evalRunId - The evaluation run ID
   * @param options - Optional db_id, table, and query parameters
   */
  async getEvalRun(
    evalRunId: string,
    options?: { dbId?: string; table?: string; params?: Record<string, string> }
  ): Promise<EvalSchema> {
    const additionalParams = this.configManager.buildQueryString(options?.params);

    return await this.withTokenRefresh(() => {
      const headers = this.configManager.buildRequestHeaders();
      return this.evalManager.getEvalRun(
        this.configManager.getEndpoint(),
        evalRunId,
        options?.dbId,
        options?.table,
        headers,
        additionalParams
      );
    });
  }

  /**
   * Execute a new evaluation
   * @param request - The evaluation request parameters
   * @param options - Optional db_id, table, and query parameters
   */
  async executeEval(
    request: ExecuteEvalRequest,
    options?: { dbId?: string; table?: string; params?: Record<string, string> }
  ): Promise<EvalSchema> {
    const additionalParams = this.configManager.buildQueryString(options?.params);

    const result = await this.withTokenRefresh(() => {
      const headers = this.configManager.buildRequestHeaders();
      return this.evalManager.executeEval(
        this.configManager.getEndpoint(),
        request,
        options?.dbId,
        options?.table,
        headers,
        additionalParams
      );
    });

    this.emit('eval:executed', result);
    return result;
  }

  /**
   * Update an evaluation run (rename)
   * @param evalRunId - The evaluation run ID
   * @param request - The update request with new name
   * @param options - Optional db_id, table, and query parameters
   */
  async updateEvalRun(
    evalRunId: string,
    request: UpdateEvalRunRequest,
    options?: { dbId?: string; table?: string; params?: Record<string, string> }
  ): Promise<EvalSchema> {
    const additionalParams = this.configManager.buildQueryString(options?.params);

    const result = await this.withTokenRefresh(() => {
      const headers = this.configManager.buildRequestHeaders();
      return this.evalManager.updateEvalRun(
        this.configManager.getEndpoint(),
        evalRunId,
        request,
        options?.dbId,
        options?.table,
        headers,
        additionalParams
      );
    });

    this.emit('eval:updated', result);
    return result;
  }

  /**
   * Delete multiple evaluation runs
   * @param evalRunIds - Array of evaluation run IDs to delete
   * @param options - Optional db_id, table, and query parameters
   */
  async deleteEvalRuns(
    evalRunIds: string[],
    options?: { dbId?: string; table?: string; params?: Record<string, string> }
  ): Promise<void> {
    const additionalParams = this.configManager.buildQueryString(options?.params);

    await this.withTokenRefresh(() => {
      const headers = this.configManager.buildRequestHeaders();
      return this.evalManager.deleteEvalRuns(
        this.configManager.getEndpoint(),
        { eval_run_ids: evalRunIds },
        options?.dbId,
        options?.table,
        headers,
        additionalParams
      );
    });

    this.emit('evals:deleted', { evalRunIds });
  }

  // =============================================================================
  // TRACES API METHODS
  // =============================================================================

  /**
   * Fetch traces with optional filters
   * GET /traces
   *
   * @param options - Filter and pagination options
   * @param requestOptions - Optional per-request headers and params
   * @returns Paginated traces result with traces and pagination info
   */
  async fetchTraces(
    options: ListTracesOptions = {},
    requestOptions?: { headers?: Record<string, string>; params?: Record<string, string> }
  ): Promise<PaginatedTracesResult> {
    const config = this.configManager.getConfig();
    const dbId = this.configManager.getDbId();

    // Apply dbId from config if not specified in options
    const traceOptions: ListTracesOptions = {
      ...options,
      db_id: options.db_id ?? dbId,
    };

    const params = this.configManager.buildQueryString(requestOptions?.params);

    const result = await this.withTokenRefresh(() => {
      const headers = this.configManager.buildRequestHeaders(requestOptions?.headers);
      return this.tracesManager.fetchTraces(config.endpoint, traceOptions, headers, params);
    });

    // Update state with fetched traces
    this.state.traces = result.traces;
    this.emit('state:change', this.getState());

    return result;
  }

  /**
   * Get trace detail or a specific span
   * GET /traces/{trace_id}
   *
   * @param traceId - The trace ID to fetch
   * @param options - Options including optional span_id, run_id, db_id
   * @param requestOptions - Optional per-request headers and params
   * @returns TraceDetail (full trace) or TraceNode (specific span)
   */
  async getTraceDetail(
    traceId: string,
    options: GetTraceOptions = {},
    requestOptions?: { headers?: Record<string, string>; params?: Record<string, string> }
  ): Promise<TraceDetail | TraceNode> {
    const config = this.configManager.getConfig();
    const dbId = this.configManager.getDbId();

    // Apply dbId from config if not specified in options
    const traceOptions: GetTraceOptions = {
      ...options,
      db_id: options.db_id ?? dbId,
    };

    const params = this.configManager.buildQueryString(requestOptions?.params);

    return await this.withTokenRefresh(() => {
      const headers = this.configManager.buildRequestHeaders(requestOptions?.headers);
      return this.tracesManager.getTraceDetail(config.endpoint, traceId, traceOptions, headers, params);
    });
  }

  /**
   * Get trace session statistics
   * GET /trace_session_stats
   *
   * @param options - Filter and pagination options
   * @param requestOptions - Optional per-request headers and params
   * @returns Paginated trace session stats result
   */
  async fetchTraceSessionStats(
    options: GetTraceSessionStatsOptions = {},
    requestOptions?: { headers?: Record<string, string>; params?: Record<string, string> }
  ): Promise<PaginatedTraceSessionStatsResult> {
    const config = this.configManager.getConfig();
    const dbId = this.configManager.getDbId();

    // Apply dbId from config if not specified in options
    const statsOptions: GetTraceSessionStatsOptions = {
      ...options,
      db_id: options.db_id ?? dbId,
    };

    const params = this.configManager.buildQueryString(requestOptions?.params);

    const result = await this.withTokenRefresh(() => {
      const headers = this.configManager.buildRequestHeaders(requestOptions?.headers);
      return this.tracesManager.getTraceSessionStats(config.endpoint, statsOptions, headers, params);
    });

    // Update state with fetched stats
    this.state.traceSessionStats = result.stats;
    this.emit('state:change', this.getState());

    return result;
  }
}
