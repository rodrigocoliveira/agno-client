/**
 * Client configuration options
 */
export interface AgnoClientConfig {
  /**
   * Base endpoint URL (e.g., 'http://localhost:7777')
   */
  endpoint: string;

  /**
   * Optional authentication token
   */
  authToken?: string;

  /**
   * Mode: 'agent' or 'team'
   */
  mode?: 'agent' | 'team';

  /**
   * Agent ID (required if mode is 'agent')
   */
  agentId?: string;

  /**
   * Team ID (required if mode is 'team')
   */
  teamId?: string;

  /**
   * Database ID
   */
  dbId?: string;

  /**
   * Current session ID
   */
  sessionId?: string;

  /**
   * User ID to link the session to a specific user
   */
  userId?: string;

  /**
   * Global custom headers to include in all API requests.
   * These headers are applied before per-request headers.
   * Note: Authorization header from authToken will override any Authorization header set here.
   */
  headers?: Record<string, string>;

  /**
   * Global query parameters to append to all API requests.
   * These parameters are applied before per-request parameters.
   * Per-request parameters will override global parameters with the same key.
   */
  params?: Record<string, string>;

  /**
   * Callback invoked when a request fails with 401 Unauthorized.
   * Use this to refresh the authentication token and retry the request automatically.
   *
   * @returns The new token to use for retry, or null/undefined to propagate the error.
   *
   * @example
   * ```typescript
   * // With Laravel Inertia
   * onTokenExpired: async () => {
   *   await router.reload({ only: ['agnoToken'] });
   *   return page.props.agnoToken;
   * }
   *
   * // With a refresh endpoint
   * onTokenExpired: async () => {
   *   const response = await fetch('/api/refresh-token');
   *   const { token } = await response.json();
   *   return token;
   * }
   * ```
   */
  onTokenExpired?: () => Promise<string | null | undefined> | string | null | undefined;

  /**
   * Whether to emit member:* events for internal team member activity.
   * When true, internal agent events during team runs are emitted as member:* events.
   * Useful for debugging or building advanced UIs that show team member activity.
   * Default: false
   */
  emitMemberEvents?: boolean;

  /**
   * How to react to custom events that may carry session_state updates from the backend.
   *
   * Yield a `CustomEvent` dataclass with a `session_state` field from a tool and the client
   * will pick it up automatically — no REST round-trip, live mid-run updates.
   *
   * - `true` (default): any `CustomEvent` chunk with a `session_state` field updates the cache.
   * - `false`: disables auto-extraction. `custom:event` still fires for `useAgnoCustomEvents`.
   * - `(event) => Record<string, unknown> | null`: custom extractor for non-standard conventions.
   *
   * Recommended backend convention:
   * ```python
   * from dataclasses import dataclass
   * from agno.run.agent import CustomEvent
   *
   * @dataclass
   * class SessionStateUpdatedEvent(CustomEvent):
   *     session_state: Optional[Dict[str, Any]] = None
   * ```
   */
  extractSessionStateFromCustomEvent?:
    | boolean
    | ((event: import('./api').CustomEventData) => Record<string, unknown> | null | undefined);

  /**
   * Whether the client should refresh `sessionState` from `GET /sessions/{id}` when
   * a team stream ends. Required because `TeamRunCompleted` does not carry `session_state`
   * over the wire (verified against Agno 2.5.17 and 2.6.0). Has no effect on agent runs.
   * Default: true
   */
  refreshTeamSessionStateOnStreamEnd?: boolean;

  /**
   * If true, `sendMessage` defaults to background mode (server-side detached run
   * that survives client disconnect). Can be overridden per-call via
   * `sendMessage(msg, { background: false })`. Default: false.
   *
   * See docs/background-execution.md.
   */
  background?: boolean;
}

/**
 * Streaming options
 */
export interface StreamOptions {
  /**
   * Custom headers to include in the request
   */
  headers?: Record<string, string>;

  /**
   * Custom query parameters to append to the request URL
   */
  params?: Record<string, string>;

  /**
   * Request timeout in milliseconds
   */
  timeout?: number;

  /**
   * Idempotency key for background (job-queue) runs (Agno v3). Sent as the
   * `Idempotency-Key` request header. Reusing a key retries the identical
   * submission; the server rejects (409) a key reused for a different
   * component, or one used by a non-streaming submission, and rejects (429)
   * a submission when the job queue is full. Max 512 characters (422 if
   * longer). Has no effect when `background` is false.
   */
  idempotencyKey?: string;
}

/**
 * Options for `AgnoClient.sendMessage()`.
 */
export interface SendMessageOptions extends StreamOptions {
  /**
   * Run in background (server-side detached job, survives client disconnect).
   * Overrides `AgnoClientConfig.background` for this call. Default: false.
   */
  background?: boolean;

  /**
   * Per-file metadata objects, matched to the `files` FormData entries by
   * position (Agno v3).
   */
  filesMetadata?: unknown[];

  /**
   * Pin this run to a specific published component version (Agno v3 Studio
   * components) instead of whatever is currently `current`.
   */
  version?: number;

  /**
   * Factory-specific parameters for dynamic agent/team construction (Agno v3).
   */
  factoryInput?: Record<string, unknown>;
}

/**
 * Options for `AgnoClient.continueRun()`.
 *
 * All fields below `params`/`headers` are Agno v3-only additions to the
 * `/continue` endpoint, unrelated to submitting HITL tool results (which is
 * always the `tools` argument to `continueRun()`, not an option here).
 */
export interface ContinueRunOptions extends StreamOptions {
  /** Run the continuation in background (job-queue) mode. Default: false. */
  background?: boolean;

  /**
   * Append this as a new user message before resuming. Use to continue a
   * COMPLETED run with a follow-up, or to add context to a RUNNING/ERROR resume.
   */
  input?: string;

  /**
   * Continuation boundary: `'end'` (default), `'last_user'`, or a numeric
   * message index (as a string).
   */
  continueFrom?: string;

  /**
   * When true, clone the run with a new `run_id` before resuming instead of
   * mutating the original in place. The clone becomes a sibling within the
   * same session.
   */
  fork?: boolean;

  /** Regenerate the response from `continueFrom` instead of resuming as-is. */
  regenerate?: boolean;

  /** Whether a `fork`/`regenerate` result replaces the original in history. */
  replaceOriginal?: boolean;

  /** Extra instructions appended for this continuation only. */
  additionalInstructions?: string;
}

/**
 * Client state
 */
export interface ClientState {
  /**
   * Whether a stream is currently active
   */
  isStreaming: boolean;

  /**
   * Whether a session refresh is in progress
   */
  isRefreshing: boolean;

  /**
   * Current error message (if any)
   */
  errorMessage?: string;

  /**
   * Whether the endpoint is active/reachable
   */
  isEndpointActive: boolean;

  /**
   * Available agents
   */
  agents: import('./api').AgentDetails[];

  /**
   * Available teams
   */
  teams: import('./api').TeamDetails[];

  /**
   * Available sessions
   */
  sessions: import('./api').SessionEntry[];

  /**
   * Whether the run is paused (HITL)
   */
  isPaused: boolean;

  /**
   * Current paused run ID
   */
  pausedRunId?: string;

  /**
   * Tools awaiting external execution
   */
  toolsAwaitingExecution?: import('./messages').ToolCall[];

  /**
   * Current active run ID (during streaming)
   */
  currentRunId?: string;

  /**
   * Whether a cancellation request is in progress
   */
  isCancelling?: boolean;

  /**
   * Cached memories
   */
  memories: import('./api').UserMemory[];

  /**
   * Cached memory topics
   */
  memoryTopics: string[];

  /**
   * Traces list (from last fetchTraces call)
   */
  traces: import('./api').TraceSummary[];

  /**
   * Trace session statistics (from last fetchTraceSessionStats call)
   */
  traceSessionStats: import('./api').TraceSessionStats[];

  /**
   * Cached schedules
   */
  schedules: import('./api').ScheduleResponse[];

  /**
   * Cached approvals
   */
  approvals: import('./api').ApprovalResponse[];

  /**
   * Cached components
   */
  components: import('./api').ComponentResponse[];

  /**
   * Current session state (backend-managed per-session dict the agent/team reads and writes).
   * Populated by: (a) parallel `getSessionById()` when a session is loaded,
   * (b) `session_state` field on `RunCompleted` chunks for agent runs,
   * (c) `session_state` field on custom events when extraction is enabled,
   * (d) a post-stream `refreshSessionState()` call for team runs.
   */
  sessionState?: Record<string, unknown> | null;

  /**
   * Whether a session_state refresh is currently in flight (e.g., post-team-run sync).
   */
  isSessionStateRefreshing?: boolean;
}
