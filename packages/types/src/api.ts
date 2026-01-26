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
