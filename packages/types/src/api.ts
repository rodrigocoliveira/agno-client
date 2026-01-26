import { RunEvent } from './events';
import {
  ToolCall,
  MessageExtraData,
  ImageData,
  VideoData,
  AudioData,
  ResponseAudioData,
} from './messages';

/**
 * Model information
 */
export interface Model {
  name: string;
  model: string;
  provider: string;
}

/**
 * Message context (RAG context)
 */
export interface MessageContext {
  query: string;
  docs?: Array<Record<string, object>>;
  time?: number;
}

/**
 * Model message structure
 */
export interface ModelMessage {
  content: string | null;
  context?: MessageContext[];
  created_at: number;
  metrics?: {
    time: number;
    prompt_tokens: number;
    input_tokens: number;
    completion_tokens: number;
    output_tokens: number;
  };
  name: string | null;
  role: string;
  tool_args?: unknown;
  tool_call_id: string | null;
  tool_calls: Array<{
    function: {
      arguments: string;
      name: string;
    };
    id: string;
    type: string;
  }> | null;
  from_history?: boolean;
  stop_after_tool_call?: boolean;
}

/**
 * Agent details
 */
export interface AgentDetails {
  id: string;
  name?: string;
  description?: string;
  model?: Model;
  db_id?: string;
  storage?: boolean;
}

/**
 * Team details
 */
export interface TeamDetails {
  id: string;
  name?: string;
  description?: string;
  model?: Model;
  db_id?: string;
  storage?: boolean;
}

/**
 * Session entry in sessions list
 */
export interface SessionEntry {
  session_id: string;
  session_name: string;
  created_at: string | null;
  updated_at?: string | null;
}

/**
 * Pagination information
 */
export interface PaginationInfo {
  page: number;
  limit: number;
  total_pages: number;
  total_count: number;
  search_time_ms: number;
}

/**
 * Run schema - represents a single agent run
 */
export interface RunSchema {
  run_id: string;
  parent_run_id?: string | null;
  agent_id?: string | null;
  user_id?: string | null;
  run_input?: string | null;
  content?: string | object | null;
  run_response_format?: string | null;
  reasoning_content?: string | null;
  reasoning_steps?: Array<Record<string, unknown>> | null;
  metrics?: Record<string, unknown> | null;
  messages?: Array<Record<string, unknown>> | null;
  tools?: Array<Record<string, unknown>> | null;
  events?: Array<Record<string, unknown>> | null;
  created_at?: string | null;
  references?: Array<Record<string, unknown>> | null;
  reasoning_messages?: Array<Record<string, unknown>> | null;
  images?: Array<Record<string, unknown>> | null;
  videos?: Array<Record<string, unknown>> | null;
  audio?: Array<Record<string, unknown>> | null;
  files?: Array<Record<string, unknown>> | null;
  response_audio?: Record<string, unknown> | null;
  input_media?: Record<string, unknown> | null;
}

/**
 * Team run schema - represents a single team run
 */
export interface TeamRunSchema {
  run_id: string;
  parent_run_id?: string | null;
  team_id?: string | null;
  content?: string | object | null;
  reasoning_content?: string | null;
  reasoning_steps?: Array<Record<string, unknown>> | null;
  run_input?: string | null;
  run_response_format?: string | null;
  metrics?: Record<string, unknown> | null;
  tools?: Array<Record<string, unknown>> | null;
  messages?: Array<Record<string, unknown>> | null;
  events?: Array<Record<string, unknown>> | null;
  created_at?: string | null;
  references?: Array<Record<string, unknown>> | null;
  reasoning_messages?: Array<Record<string, unknown>> | null;
  input_media?: Record<string, unknown> | null;
  images?: Array<Record<string, unknown>> | null;
  videos?: Array<Record<string, unknown>> | null;
  audio?: Array<Record<string, unknown>> | null;
  files?: Array<Record<string, unknown>> | null;
  response_audio?: Record<string, unknown> | null;
}

/**
 * Session schema - basic session information
 */
export interface SessionSchema {
  session_id: string;
  session_name: string;
  session_state?: Record<string, unknown> | null;
  created_at?: string | null;
  updated_at?: string | null;
}

/**
 * Agent session detail schema - complete agent session with runs
 */
export interface AgentSessionDetailSchema {
  agent_session_id: string;
  session_id: string;
  session_name: string;
  user_id?: string | null;
  session_summary?: Record<string, unknown> | null;
  session_state?: Record<string, unknown> | null;
  agent_id?: string | null;
  total_tokens?: number | null;
  agent_data?: Record<string, unknown> | null;
  metrics?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  chat_history?: Array<Record<string, unknown>> | null;
  created_at?: string | null;
  updated_at?: string | null;
}

/**
 * Team session detail schema - complete team session with runs
 */
export interface TeamSessionDetailSchema {
  session_id: string;
  session_name: string;
  user_id?: string | null;
  team_id?: string | null;
  session_summary?: Record<string, unknown> | null;
  session_state?: Record<string, unknown> | null;
  metrics?: Record<string, unknown> | null;
  team_data?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  chat_history?: Array<Record<string, unknown>> | null;
  created_at?: string | null;
  updated_at?: string | null;
  total_tokens?: number | null;
}

/**
 * Response from a run endpoint (streaming chunk)
 */
export interface RunResponse {
  content?: string | object;
  content_type: string;
  context?: MessageContext[];
  event: RunEvent;
  event_data?: object;
  messages?: ModelMessage[];
  metrics?: object;
  model?: string;
  run_id?: string;
  agent_id?: string;
  session_id?: string;
  tool?: ToolCall;
  tools?: ToolCall[];
  created_at: number;
  extra_data?: MessageExtraData;
  images?: ImageData[];
  videos?: VideoData[];
  audio?: AudioData[];
  response_audio?: ResponseAudioData;
  // HITL fields
  is_paused?: boolean;
  tools_awaiting_external_execution?: ToolCall[];
  tools_requiring_confirmation?: ToolCall[];
  tools_requiring_user_input?: ToolCall[];
}

/**
 * Processed run response content
 */
export interface RunResponseContent {
  content?: string | object;
  content_type: string;
  context?: MessageContext[];
  event: RunEvent;
  event_data?: object;
  messages?: ModelMessage[];
  metrics?: object;
  model?: string;
  run_id?: string;
  agent_id?: string;
  session_id?: string;
  tool?: ToolCall;
  tools?: Array<ToolCall>;
  created_at: number;
  extra_data?: MessageExtraData;
  images?: ImageData[];
  videos?: VideoData[];
  audio?: AudioData[];
  response_audio?: ResponseAudioData;
}

/**
 * Sessions list response
 */
export interface SessionsListResponse {
  data: SessionEntry[];
  meta: PaginationInfo;
}

/**
 * Session runs response - list of runs for a session
 */
export interface SessionRunsResponse {
  data: RunSchema[];
  meta: PaginationInfo;
}

/**
 * Team session runs response - list of team runs for a session
 */
export interface TeamSessionRunsResponse {
  data: TeamRunSchema[];
  meta: PaginationInfo;
}

/**
 * Create session request
 */
export interface CreateSessionRequest {
  session_id?: string | null;
  session_name?: string | null;
  session_state?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  user_id?: string | null;
  agent_id?: string | null;
  team_id?: string | null;
}

/**
 * Update session request
 */
export interface UpdateSessionRequest {
  session_name?: string | null;
  session_state?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  summary?: Record<string, unknown> | null;
}

/**
 * Rename session request
 */
export interface RenameSessionRequest {
  session_name: string;
}

/**
 * Delete multiple sessions request
 */
export interface DeleteMultipleSessionsRequest {
  session_ids: string[];
  session_types: Array<'agent' | 'team'>;
}

// =============================================================================
// TRACES API TYPES
// =============================================================================

/**
 * Trace status values
 */
export type TraceStatus = 'OK' | 'ERROR' | 'UNSET';

/**
 * Trace summary - used in list traces response
 * GET /traces
 */
export interface TraceSummary {
  /** Unique trace identifier */
  trace_id: string;

  /** Trace name */
  name: string;

  /** Trace status */
  status: TraceStatus;

  /** Duration as a string (e.g., "1.23s") */
  duration: string;

  /** Start time (ISO 8601 datetime) */
  start_time: string;

  /** End time (ISO 8601 datetime) */
  end_time: string;

  /** Total number of spans in the trace */
  total_spans: number;

  /** Number of errors in the trace */
  error_count: number;

  /** Input that triggered the trace */
  input?: string | null;

  /** Associated run ID */
  run_id?: string | null;

  /** Associated session ID */
  session_id?: string | null;

  /** Associated user ID */
  user_id?: string | null;

  /** Associated agent ID */
  agent_id?: string | null;

  /** Associated team ID */
  team_id?: string | null;

  /** Associated workflow ID */
  workflow_id?: string | null;

  /** Creation timestamp (ISO 8601 datetime) */
  created_at: string;
}

/**
 * Trace node - represents a span in the trace tree
 * Used both as child spans and as the response when querying with span_id
 */
export interface TraceNode {
  /** Span ID */
  id: string;

  /** Span name */
  name: string;

  /** Span type */
  type: string;

  /** Duration as a string */
  duration: string;

  /** Start time (ISO 8601 datetime) */
  start_time: string;

  /** End time (ISO 8601 datetime) */
  end_time: string;

  /** Span status */
  status: TraceStatus;

  /** Input data */
  input?: string | null;

  /** Output data */
  output?: string | null;

  /** Error message if status is ERROR */
  error?: string | null;

  /** Child spans */
  spans?: TraceNode[] | null;

  /** Step type */
  step_type?: string | null;

  /** Additional metadata */
  metadata?: Record<string, unknown> | null;

  /** Extra data */
  extra_data?: Record<string, unknown> | null;
}

/**
 * Trace detail - full trace information
 * GET /traces/{trace_id} (without span_id)
 */
export interface TraceDetail {
  /** Unique trace identifier */
  trace_id: string;

  /** Trace name */
  name: string;

  /** Trace status */
  status: TraceStatus;

  /** Duration as a string */
  duration: string;

  /** Start time (ISO 8601 datetime) */
  start_time: string;

  /** End time (ISO 8601 datetime) */
  end_time: string;

  /** Total number of spans */
  total_spans: number;

  /** Number of errors */
  error_count: number;

  /** Input that triggered the trace */
  input?: string | null;

  /** Output of the trace */
  output?: string | null;

  /** Error message if status is ERROR */
  error?: string | null;

  /** Associated run ID */
  run_id?: string | null;

  /** Associated session ID */
  session_id?: string | null;

  /** Associated user ID */
  user_id?: string | null;

  /** Associated agent ID */
  agent_id?: string | null;

  /** Associated team ID */
  team_id?: string | null;

  /** Associated workflow ID */
  workflow_id?: string | null;

  /** Creation timestamp (ISO 8601 datetime) */
  created_at: string;

  /** Trace tree structure */
  tree: TraceNode[];
}

/**
 * Trace session statistics
 * GET /trace_session_stats
 */
export interface TraceSessionStats {
  /** Session ID */
  session_id: string;

  /** Associated user ID */
  user_id?: string | null;

  /** Associated agent ID */
  agent_id?: string | null;

  /** Associated team ID */
  team_id?: string | null;

  /** Associated workflow ID */
  workflow_id?: string | null;

  /** Total number of traces in the session */
  total_traces: number;

  /** Timestamp of the first trace (ISO 8601 datetime) */
  first_trace_at: string;

  /** Timestamp of the last trace (ISO 8601 datetime) */
  last_trace_at: string;
}

/**
 * List traces response
 * GET /traces
 */
export interface TracesListResponse {
  data: TraceSummary[];
  meta: PaginationInfo;
}

/**
 * Trace session stats response
 * GET /trace_session_stats
 */
export interface TraceSessionStatsResponse {
  data: TraceSessionStats[];
  meta: PaginationInfo;
}

/**
 * Options for listing traces
 */
export interface ListTracesOptions {
  /** Filter by run ID */
  run_id?: string;

  /** Filter by session ID */
  session_id?: string;

  /** Filter by user ID */
  user_id?: string;

  /** Filter by agent ID */
  agent_id?: string;

  /** Filter by team ID */
  team_id?: string;

  /** Filter by workflow ID */
  workflow_id?: string;

  /** Filter by status (OK, ERROR) */
  status?: TraceStatus;

  /** Filter traces after this time (ISO 8601 datetime with timezone) */
  start_time?: string;

  /** Filter traces before this time (ISO 8601 datetime with timezone) */
  end_time?: string;

  /** Page number (1-indexed, default: 1) */
  page?: number;

  /** Traces per page (1-100, default: 20) */
  limit?: number;

  /** Database ID for query source */
  db_id?: string;
}

/**
 * Options for getting trace detail
 */
export interface GetTraceOptions {
  /** Optional span ID to retrieve specific span */
  span_id?: string;

  /** Optional run ID to retrieve trace for */
  run_id?: string;

  /** Database ID to query trace from */
  db_id?: string;
}

/**
 * Options for getting trace session statistics
 */
export interface GetTraceSessionStatsOptions {
  /** Filter by user ID */
  user_id?: string;

  /** Filter by agent ID */
  agent_id?: string;

  /** Filter by team ID */
  team_id?: string;

  /** Filter by workflow ID */
  workflow_id?: string;

  /** Filter traces after this time (ISO 8601 datetime) */
  start_time?: string;

  /** Filter traces before this time (ISO 8601 datetime) */
  end_time?: string;

  /** Page number (1-indexed, default: 1) */
  page?: number;

  /** Items per page (1-100, default: 20) */
  limit?: number;

  /** Database ID to query from */
  db_id?: string;
}

// =============================================================================
// CUSTOM EVENT TYPES
// =============================================================================

/**
 * Data payload for CustomEvent events emitted by agent tools.
 *
 * Custom events contain standard metadata fields plus arbitrary
 * user-defined fields from the tool implementation.
 *
 * @example
 * // A greet_user tool might emit:
 * {
 *   event: 'CustomEvent',
 *   created_at: 1768858175,
 *   agent_id: 'hello-agno-world',
 *   agent_name: 'Hello Agno World',
 *   run_id: '3b032e52-...',
 *   session_id: '94528649-...',
 *   greeting: 'Hello! Welcome to Agno World!'  // Custom field
 * }
 */
export interface CustomEventData {
  /** Event type identifier */
  event: 'CustomEvent';

  /** Unix timestamp when the event was created */
  created_at: number;

  /** Agent ID (for agent runs) */
  agent_id?: string;

  /** Agent display name */
  agent_name?: string;

  /** Team ID (for team runs) */
  team_id?: string;

  /** Current run ID */
  run_id?: string;

  /** Current session ID */
  session_id?: string;

  /**
   * Custom fields from the tool implementation.
   * These are user-defined and vary by tool.
   */
  [key: string]: unknown;
}
