/**
 * Events emitted during an Agno agent run.
 *
 * Matches the Agno v3 (AgentOS v3.0.x) `RunEvent`/`TeamRunEvent` wire enums exactly
 * (verified byte-for-byte against `agno==3.0.6` source, and against a live SSE capture).
 */
export enum RunEvent {
  RunStarted = 'RunStarted',
  RunContent = 'RunContent',
  RunContentCompleted = 'RunContentCompleted',
  RunIntermediateContent = 'RunIntermediateContent',
  RunCompleted = 'RunCompleted',
  RunError = 'RunError',
  RunCancelled = 'RunCancelled',

  RunPaused = 'RunPaused',
  RunContinued = 'RunContinued',

  PreHookStarted = 'PreHookStarted',
  PreHookCompleted = 'PreHookCompleted',
  PostHookStarted = 'PostHookStarted',
  PostHookCompleted = 'PostHookCompleted',

  ToolCallStarted = 'ToolCallStarted',
  ToolCallCompleted = 'ToolCallCompleted',
  ToolCallError = 'ToolCallError',

  ReasoningStarted = 'ReasoningStarted',
  ReasoningStep = 'ReasoningStep',
  ReasoningContentDelta = 'ReasoningContentDelta',
  ReasoningCompleted = 'ReasoningCompleted',

  MemoryUpdateStarted = 'MemoryUpdateStarted',
  MemoryUpdateCompleted = 'MemoryUpdateCompleted',

  SessionSummaryStarted = 'SessionSummaryStarted',
  SessionSummaryCompleted = 'SessionSummaryCompleted',

  ParserModelResponseStarted = 'ParserModelResponseStarted',
  ParserModelResponseCompleted = 'ParserModelResponseCompleted',

  OutputModelResponseStarted = 'OutputModelResponseStarted',
  OutputModelResponseCompleted = 'OutputModelResponseCompleted',

  ModelRequestStarted = 'ModelRequestStarted',
  ModelRequestCompleted = 'ModelRequestCompleted',

  CompressionStarted = 'CompressionStarted',
  CompressionCompleted = 'CompressionCompleted',

  FollowupsStarted = 'FollowupsStarted',
  FollowupsCompleted = 'FollowupsCompleted',

  // Team Events (mirror the agent events above 1:1, prefixed `Team`)
  TeamRunStarted = 'TeamRunStarted',
  TeamRunContent = 'TeamRunContent',
  TeamRunContentCompleted = 'TeamRunContentCompleted',
  TeamRunIntermediateContent = 'TeamRunIntermediateContent',
  TeamRunCompleted = 'TeamRunCompleted',
  TeamRunError = 'TeamRunError',
  TeamRunCancelled = 'TeamRunCancelled',

  TeamRunPaused = 'TeamRunPaused',
  TeamRunContinued = 'TeamRunContinued',

  TeamPreHookStarted = 'TeamPreHookStarted',
  TeamPreHookCompleted = 'TeamPreHookCompleted',
  TeamPostHookStarted = 'TeamPostHookStarted',
  TeamPostHookCompleted = 'TeamPostHookCompleted',

  TeamToolCallStarted = 'TeamToolCallStarted',
  TeamToolCallCompleted = 'TeamToolCallCompleted',
  TeamToolCallError = 'TeamToolCallError',

  TeamReasoningStarted = 'TeamReasoningStarted',
  TeamReasoningStep = 'TeamReasoningStep',
  TeamReasoningContentDelta = 'TeamReasoningContentDelta',
  TeamReasoningCompleted = 'TeamReasoningCompleted',

  TeamMemoryUpdateStarted = 'TeamMemoryUpdateStarted',
  TeamMemoryUpdateCompleted = 'TeamMemoryUpdateCompleted',

  TeamSessionSummaryStarted = 'TeamSessionSummaryStarted',
  TeamSessionSummaryCompleted = 'TeamSessionSummaryCompleted',

  TeamParserModelResponseStarted = 'TeamParserModelResponseStarted',
  TeamParserModelResponseCompleted = 'TeamParserModelResponseCompleted',

  TeamOutputModelResponseStarted = 'TeamOutputModelResponseStarted',
  TeamOutputModelResponseCompleted = 'TeamOutputModelResponseCompleted',

  TeamModelRequestStarted = 'TeamModelRequestStarted',
  TeamModelRequestCompleted = 'TeamModelRequestCompleted',

  TeamCompressionStarted = 'TeamCompressionStarted',
  TeamCompressionCompleted = 'TeamCompressionCompleted',

  TeamFollowupsStarted = 'TeamFollowupsStarted',
  TeamFollowupsCompleted = 'TeamFollowupsCompleted',

  // Team-only "task mode" events (no agent equivalent)
  TeamTaskIterationStarted = 'TeamTaskIterationStarted',
  TeamTaskIterationCompleted = 'TeamTaskIterationCompleted',
  TeamTaskStateUpdated = 'TeamTaskStateUpdated',
  TeamTaskCreated = 'TeamTaskCreated',
  TeamTaskUpdated = 'TeamTaskUpdated',

  // Custom Events (user-defined events from tools)
  CustomEvent = 'CustomEvent',
}

/**
 * Status of a run, as reported by the AgentOS API (`RunStatus` enum).
 * Wire values are UPPERCASE strings.
 */
export enum RunStatus {
  Pending = 'PENDING',
  Running = 'RUNNING',
  Completed = 'COMPLETED',
  Paused = 'PAUSED',
  Cancelled = 'CANCELLED',
  Error = 'ERROR',
  /** Marker for a run whose response was regenerated via `/continue?regenerate=true` */
  Regenerated = 'REGENERATED',
}

/**
 * Events emitted by the AgnoClient
 */
export type ClientEvent =
  | 'message:update'
  | 'message:complete'
  | 'message:refreshed'
  | 'message:error'
  | 'session:loaded'
  | 'session:created'
  | 'stream:start'
  | 'stream:end'
  | 'state:change'
  | 'config:change'
  | 'run:paused'
  | 'run:continued'
  | 'run:cancelled'   // Emitted when run is cancelled by user
  // Generative UI events
  | 'ui:update'       // Emitted when UI component data updates (streaming)
  | 'ui:complete'     // Emitted when UI component is finalized
  | 'ui:render'      // Emitted when a new UI component should be rendered
  | 'custom:event'
  // Team member events (internal agent activity within teams)
  | 'member:event'    // Emitted for any internal team member event (when emitMemberEvents is true)
  | 'member:started'  // Emitted when a team member starts processing
  | 'member:content'  // Emitted when a team member produces content
  | 'member:completed' // Emitted when a team member completes
  | 'member:error'    // Emitted when a team member encounters an error
  // Background execution / resume lifecycle
  | 'run:resume:start'   // resumeRun call started
  | 'run:resume:meta'    // catch_up / replay / subscribed meta event from /resume
  | 'run:resume:end'     // resume stream completed normally
  | 'run:resume:error'   // /resume failed (run not found, buffer expired, network)
  | 'run:background:error'; // background sendMessage got a 429 (queue full) or 409 (Idempotency-Key conflict)
