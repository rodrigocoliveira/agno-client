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
   * Whether to request member events from the backend during team runs.
   * When false, the backend may skip sending internal agent events (saves bandwidth).
   * Default: false
   */
  streamMemberEvents?: boolean;

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
