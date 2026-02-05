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
  /** Knowledge base configuration */
  knowledge?: {
    db_id?: string;
  };
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

// ============================================================================
// Memory Types
// ============================================================================

/**
 * User memory schema
 */
export interface UserMemory {
  /** Unique identifier for the memory */
  memory_id: string;
  /** Memory content text */
  memory: string;
  /** Topics or tags associated with the memory */
  topics?: string[] | null;
  /** Agent ID associated with this memory */
  agent_id?: string | null;
  /** Team ID associated with this memory */
  team_id?: string | null;
  /** User ID who owns this memory */
  user_id?: string | null;
  /** Timestamp when memory was last updated */
  updated_at?: string | null;
}

// ============================================================================
// Knowledge API Types
// ============================================================================

/**
 * Content processing status
 */
export type ContentStatus = 'processing' | 'completed' | 'failed';

/**
 * Reader configuration schema
 */
export interface ReaderSchema {
  id: string;
  name?: string | null;
  description?: string | null;
  chunkers?: string[] | null;
}

/**
 * Chunker configuration schema
 */
export interface ChunkerSchema {
  key: string;
  name?: string | null;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Vector database configuration schema
 */
export interface VectorDbSchema {
  id: string;
  name?: string | null;
  description?: string | null;
  search_types?: string[] | null;
}

/**
 * Knowledge configuration response (GET /knowledge/config)
 */
export interface KnowledgeConfigResponse {
  readers?: Record<string, ReaderSchema> | null;
  readersForType?: Record<string, string[]> | null;
  chunkers?: Record<string, ChunkerSchema> | null;
  filters?: string[] | null;
  vector_dbs?: VectorDbSchema[] | null;
}

/**
 * Content response schema
 */
export interface ContentResponse {
  id: string;
  name?: string | null;
  description?: string | null;
  type?: string | null;
  size?: string | null;
  linked_to?: string | null;
  metadata?: Record<string, unknown> | null;
  access_count?: number | null;
  status?: ContentStatus | null;
  status_message?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

// ============================================================================
// Evaluation Types
// ============================================================================

/**
 * Evaluation type enum
 */
export type EvalType = 'accuracy' | 'agent_as_judge' | 'performance' | 'reliability';

/**
 * Component type for evaluations
 */
export type EvalComponentType = 'agent' | 'team' | 'workflow';

/**
 * Scoring strategy for evaluations
 */
export type ScoringStrategy = 'numeric' | 'binary';

/**
 * Sort order for list queries
 */
export type SortOrder = 'asc' | 'desc';

/**
 * Evaluation schema - represents a single evaluation run
 */
export interface EvalSchema {
  /** Unique identifier for the evaluation run */
  id: string;

  /** Agent ID if evaluating an agent */
  agent_id?: string | null;

  /** Team ID if evaluating a team */
  team_id?: string | null;

  /** Workflow ID if evaluating a workflow */
  workflow_id?: string | null;

  /** Model identifier used for evaluation */
  model_id?: string | null;

  /** Model provider name */
  model_provider?: string | null;

  /** Name of the evaluation run */
  name?: string | null;

  /** Name of the evaluated component */
  evaluated_component_name?: string | null;

  /** Type of evaluation */
  eval_type: EvalType;

  /** Evaluation results and metrics */
  eval_data: Record<string, unknown>;

  /** Input parameters used for the evaluation */
  eval_input?: Record<string, unknown> | null;

  /** Creation timestamp */
  created_at?: string | null;

  /** Last update timestamp */
  updated_at?: string | null;
}

/**
 * List memories response with pagination
 */
export interface MemoriesListResponse {
  data: UserMemory[];
  meta: PaginationInfo;
}

/**
 * Content status response (GET /knowledge/content/{id}/status)
 */
export interface ContentStatusResponse {
  status: ContentStatus;
  status_message?: string;
}

/**
 * Paginated content list response
 */
export interface ContentListResponse {
  data: ContentResponse[];
  meta: PaginationInfo;
}

/**
 * Query parameters for listing memories
 */
export interface ListMemoriesParams {
  /** Filter memories by user ID */
  user_id?: string;
  /** Filter memories by agent ID */
  agent_id?: string;
  /** Filter memories by team ID */
  team_id?: string;
  /** Fuzzy search within memory content */
  search_content?: string;
  /** Number of memories to return per page (default: 20) */
  limit?: number;
  /** Page number for pagination (default: 1) */
  page?: number;
  /** Field to sort memories by (default: updated_at) */
  sort_by?: string;
  /** Sort order (default: desc) */
  sort_order?: 'asc' | 'desc';
  /** Database ID to query memories from */
  db_id?: string;
  /** The database table to use */
  table?: string;
  /** Filter by topics */
  topics?: string[];
}

/**
 * Request body for creating a new memory
 */
export interface CreateMemoryRequest {
  /** Memory content text (1-5000 characters) */
  memory: string;
  /** User identifier */
  user_id?: string | null;
  /** Topics or tags to associate with the memory */
  topics?: string[] | null;
}

/**
 * Request body for updating an existing memory
 */
export interface UpdateMemoryRequest {
  /** Memory content text (1-5000 characters) */
  memory: string;
  /** User identifier */
  user_id?: string | null;
  /** Topics or tags to associate with the memory */
  topics?: string[] | null;
}

/**
 * Request body for deleting multiple memories
 */
export interface DeleteMultipleMemoriesRequest {
  /** List of memory IDs to delete (minimum 1 item) */
  memory_ids: string[];
  /** User ID to filter memories for deletion */
  user_id?: string;
}

/**
 * User memory statistics
 */
export interface UserMemoryStats {
  /** User ID */
  user_id: string;
  /** Total number of memories for this user */
  total_memories: number;
  /** Timestamp of last memory update */
  last_memory_updated_at?: string | null;
}

/**
 * User memory statistics response with pagination
 */
export interface UserMemoryStatsResponse {
  data: UserMemoryStats[];
  meta: PaginationInfo;
}

/**
 * Parameters for listing evaluation runs
 */
export interface ListEvalRunsParams {
  /** Filter by agent ID */
  agent_id?: string;

  /** Filter by team ID */
  team_id?: string;

  /** Filter by workflow ID */
  workflow_id?: string;

  /** Filter by model ID */
  model_id?: string;

  /** Filter by component type */
  type?: EvalComponentType;

  /** Number of evaluation runs to return (default: 20) */
  limit?: number;

  /** Page number (default: 1) */
  page?: number;

  /** Field to sort by (default: created_at) */
  sort_by?: string;

  /** Sort order (default: desc) */
  sort_order?: SortOrder;

  /** Database ID to use */
  db_id?: string;

  /** Database table to use */
  table?: string;

  /** Comma-separated eval types to filter */
  eval_types?: string;
}

/**
 * Response for listing evaluation runs
 */
export interface EvalRunsListResponse {
  data: EvalSchema[];
  meta: PaginationInfo;
}

/**
 * Options for listing content
 */
export interface ContentListOptions {
  limit?: number;
  page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  db_id?: string;
}

/**
 * Vector search request
 */
export interface VectorSearchRequest {
  query: string;
  db_id?: string | null;
  vector_db_ids?: string[] | null;
  search_type?: string | null;
  max_results?: number | null;
  filters?: Record<string, unknown> | null;
  meta?: { limit?: number; page?: number } | null;
}

/**
 * Vector search result
 */
export interface VectorSearchResult {
  id: string;
  content: string;
  name?: string | null;
  meta_data?: Record<string, unknown> | null;
  usage?: Record<string, unknown> | null;
  reranking_score?: number | null;
  content_id?: string | null;
  content_origin?: string | null;
  size?: number | null;
}

/**
 * Vector search response
 */
export interface VectorSearchResponse {
  data: VectorSearchResult[];
  meta: PaginationInfo;
}

/**
 * Query parameters for user memory statistics
 */
export interface UserMemoryStatsParams {
  /** Number of user statistics to return per page (default: 20) */
  limit?: number;
  /** Page number for pagination (default: 1) */
  page?: number;
  /** Database ID to query statistics from */
  db_id?: string;
  /** Table to query statistics from */
  table?: string;
}

/**
 * Content upload request
 * Note: This is typically sent as multipart/form-data
 */
export interface ContentUploadRequest {
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
}

/**
 * Content update request
 */
export interface ContentUpdateRequest {
  name?: string | null;
  description?: string | null;
  metadata?: string | null;
  reader_id?: string | null;
}

// ============================================================================
// Metrics API Types
// ============================================================================

/**
 * Token usage metrics for a day
 */
export interface TokenMetrics {
  /** Number of input tokens consumed */
  input_tokens: number;
  /** Number of output tokens generated */
  output_tokens: number;
  /** Total tokens (input + output) */
  total_tokens: number;
}

/**
 * Model-specific usage metrics
 */
export interface ModelMetrics {
  /** Model name/identifier */
  model_name: string;
  /** Model provider (e.g., 'openai', 'anthropic') */
  model_provider: string;
  /** Number of input tokens for this model */
  input_tokens: number;
  /** Number of output tokens for this model */
  output_tokens: number;
  /** Total tokens for this model */
  total_tokens: number;
  /** Number of runs using this model */
  runs_count: number;
}

/**
 * Aggregated metrics for a single day
 */
export interface DayAggregatedMetrics {
  /** Unique identifier for this metrics record */
  id: string;
  /** Total number of agent runs */
  agent_runs_count: number;
  /** Total number of agent sessions */
  agent_sessions_count: number;
  /** Total number of team runs */
  team_runs_count: number;
  /** Total number of team sessions */
  team_sessions_count: number;
  /** Total number of workflow runs */
  workflow_runs_count: number;
  /** Total number of workflow sessions */
  workflow_sessions_count: number;
  /** Total number of unique users */
  users_count: number;
  /** Token usage breakdown */
  token_metrics: TokenMetrics;
  /** Per-model usage breakdown */
  model_metrics: ModelMetrics[];
  /** Date for which these metrics are aggregated (ISO datetime string) */
  date: string;
  /** Unix timestamp when record was created */
  created_at: number;
  /** Unix timestamp when record was last updated */
  updated_at: number;
}

/**
 * Response from GET /metrics endpoint
 */
export interface MetricsResponse {
  /** Array of daily aggregated metrics */
  metrics: DayAggregatedMetrics[];
  /** Timestamp of most recent metrics update (ISO datetime string, nullable) */
  updated_at: string | null;
}

/**
 * Options for fetching metrics via GET /metrics
 */
export interface MetricsOptions {
  /**
   * Start of metrics range in YYYY-MM-DD format
   */
  startingDate?: string;

  /**
   * End of metrics range in YYYY-MM-DD format
   */
  endingDate?: string;

  /**
   * Database identifier (overrides config dbId if provided)
   */
  dbId?: string;

  /**
   * Specific database table to query
   */
  table?: string;

  /**
   * Additional query parameters
   */
  params?: Record<string, string>;
}

/**
 * Options for refreshing metrics via POST /metrics/refresh
 */
export interface RefreshMetricsOptions {
  /**
   * Database ID for metrics calculation (overrides config dbId if provided)
   */
  dbId?: string;

  /**
   * Table for metrics calculation
   */
  table?: string;

  /**
   * Additional query parameters
   */
  params?: Record<string, string>;
}

// ============================================================================
// Evaluation API Types
// ============================================================================

/**
 * Request body for executing an evaluation
 */
export interface ExecuteEvalRequest {
  /** Agent identifier to assess */
  agent_id?: string | null;

  /** Team identifier to assess */
  team_id?: string | null;

  /** Model identifier for evaluation */
  model_id?: string | null;

  /** Provider name */
  model_provider?: string | null;

  /** Assessment category (required) */
  eval_type: EvalType;

  /** Query or text for evaluation (required, min 1 char) */
  input: string;

  /** Target output for accuracy checks */
  expected_output?: string | null;

  /** Evaluation criteria for agent-as-judge */
  criteria?: string | null;

  /** Scoring strategy (default: binary) */
  scoring_strategy?: ScoringStrategy | null;

  /** Numeric score cutoff (1-10, default: 7) */
  threshold?: number | null;

  /** Repetition count (1-100, default: 1) */
  num_iterations?: number;

  /** Pre-measurement iterations (0-10, default: 0) */
  warmup_runs?: number;

  /** Required tool invocations */
  expected_tool_calls?: string[] | null;

  /** Supplementary instructions */
  additional_guidelines?: string | null;

  /** Background information */
  additional_context?: string | null;

  /** Run identifier name */
  name?: string | null;
}

/**
 * Request body for updating an evaluation run
 */
export interface UpdateEvalRunRequest {
  /** New name for the evaluation run (1-255 characters) */
  name: string;
}

/**
 * Request body for deleting evaluation runs
 */
export interface DeleteEvalRunsRequest {
  /** List of evaluation run IDs to delete (min 1 item) */
  eval_run_ids: string[];
}
