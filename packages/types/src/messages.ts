/**
 * Tool call metrics
 */
export interface ToolMetrics {
  time: number;
}

/**
 * A single field of a `requires_user_input` tool's input form.
 */
export interface UserInputField {
  name: string;
  field_type: string;
  description?: string | null;
  value?: unknown;
}

/**
 * One selectable option of a `UserFeedbackQuestion`.
 */
export interface UserFeedbackOption {
  label: string;
  description?: string | null;
  selected?: boolean;
}

/**
 * A structured question (with predefined options) used for user-feedback HITL.
 */
export interface UserFeedbackQuestion {
  question: string;
  header?: string | null;
  options?: UserFeedbackOption[];
  multi_select?: boolean;
  selected_options?: string[] | null;
}

/**
 * Tool call information.
 *
 * Mirrors Agno v3's `ToolExecution` dataclass field-for-field (verified against
 * `agno==3.0.6` source and a live SSE capture) — `role`/`content` are NOT part of
 * the backend shape; they only ever get populated by the client itself when a tool
 * call is synthesized from a run's `reasoning_messages` history.
 */
export interface ToolCall {
  tool_call_id: string;
  tool_name: string;
  tool_args: Record<string, unknown>;
  tool_call_error: boolean | null;
  result?: unknown;
  metrics?: ToolMetrics | null;
  child_run_id?: string | null;
  stop_after_tool_call?: boolean;
  created_at: number;
  // HITL fields
  requires_confirmation?: boolean | null;
  confirmed?: boolean | null;
  confirmation_note?: string | null;
  requires_user_input?: boolean | null;
  user_input_schema?: UserInputField[] | null;
  user_feedback_schema?: UserFeedbackQuestion[] | null;
  answered?: boolean | null;
  external_execution_required?: boolean | null;
  external_execution_silent?: boolean | null;
  approval_type?: string | null;
  approval_id?: string | null;
  // Only present when synthesized from `reasoning_messages` history (see session-manager)
  role?: 'user' | 'tool' | 'system' | 'assistant';
  content?: string | null;
  // Generative UI field (serializable component spec only)
  ui_component?: any; // UIComponentSpec - imported dynamically to avoid circular deps
}

/**
 * A requirement blocking a paused run (HITL), wrapping a `ToolCall`/`ToolExecution`
 * plus the resolution fields the AgentOS API expects back.
 *
 * Matches Agno v3's `RunRequirement` dataclass. Used as the wire shape for
 * `POST /teams/{id}/runs/{run_id}/continue`'s `requirements` field — the agent
 * equivalent endpoint instead takes a flat `ToolCall[]` under `tools` (see
 * `docs/frontend-tools.md`).
 */
export interface RunRequirement {
  id?: string;
  created_at?: string;
  tool_execution: ToolCall;
  confirmation?: boolean | null;
  confirmation_note?: string | null;
  user_input_schema?: UserInputField[] | null;
  user_feedback_schema?: UserFeedbackQuestion[] | null;
  external_execution_result?: string | null;
  member_agent_id?: string | null;
  member_agent_name?: string | null;
  member_run_id?: string | null;
}

/**
 * Reasoning step message
 */
export interface ReasoningMessage {
  role: 'user' | 'tool' | 'system' | 'assistant';
  content: string | null;
  tool_call_id?: string;
  tool_name?: string;
  tool_args?: Record<string, unknown>;
  tool_call_error?: boolean;
  metrics?: ToolMetrics;
  created_at?: number;
}

/**
 * Structured reasoning step
 */
export interface ReasoningSteps {
  title: string;
  action?: string;
  result: string;
  reasoning: string;
  confidence?: number;
  next_action?: string;
}

/**
 * Image data
 */
export interface ImageData {
  revised_prompt: string;
  url: string;
}

/**
 * Video data
 */
export interface VideoData {
  id: number;
  eta: number;
  url: string;
}

/**
 * Audio data
 */
export interface AudioData {
  base64_audio?: string;
  mime_type?: string;
  url?: string;
  id?: string;
  content?: string;
  channels?: number;
  sample_rate?: number;
}

/**
 * Response audio data
 */
export interface ResponseAudioData {
  id?: string;
  content?: string;
  transcript?: string;
  channels?: number;
  sample_rate?: number;
}

/**
 * Reference data item
 */
export interface Reference {
  content: string;
  meta_data: {
    chunk: number;
    chunk_size: number;
  };
  name: string;
}

/**
 * Reference data with query
 */
export interface ReferenceData {
  query: string;
  references: Reference[];
  time?: number;
}

/**
 * Extra data in messages (reasoning, references, etc.)
 */
export interface MessageExtraData {
  reasoning_steps?: ReasoningSteps[];
  reasoning_messages?: ReasoningMessage[];
  references?: ReferenceData[];
}

/**
 * User-uploaded file attachment metadata
 */
export interface UserFileAttachment {
  name: string;
  type: string;
  url?: string;
  size?: number;
}

/**
 * Chat message structure
 */
export interface ChatMessage {
  role: 'user' | 'agent' | 'system' | 'tool';
  content: string;
  tool_calls?: ToolCall[];
  extra_data?: MessageExtraData;
  images?: ImageData[];
  videos?: VideoData[];
  audio?: AudioData[];
  response_audio?: ResponseAudioData;
  files?: UserFileAttachment[];
  created_at: number;
  streamingError?: boolean;
  /**
   * Whether this message was cancelled during streaming
   */
  cancelled?: boolean;
  /**
   * Run ID this message belongs to.
   *
   * Both the user message and the agent response of the same conversation
   * round share the same `run_id`, allowing consumers to correlate a pair
   * (or a paused/continued run) with backend traces, metrics, feedback, etc.
   *
   * - Populated from `RunSchema.run_id` when loading session history.
   * - Populated from the `RunStarted` / `TeamRunStarted` event during streaming.
   * - May be absent on the optimistic user message and agent placeholder
   *   added locally before the first streaming chunk arrives — the lib
   *   backfills it as soon as `RunStarted` is received.
   */
  run_id?: string;
}
