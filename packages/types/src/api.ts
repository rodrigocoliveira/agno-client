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
