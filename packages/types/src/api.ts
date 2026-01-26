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

/**
 * List memories response with pagination
 */
export interface MemoriesListResponse {
  data: UserMemory[];
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
