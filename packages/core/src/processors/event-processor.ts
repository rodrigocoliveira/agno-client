import type {
  RunEvent,
  RunResponse,
  RunResponseContent,
  ChatMessage,
  ToolCall,
  ReasoningSteps,
} from '@rodrigocoliveira/agno-types';
import { RunEvent as RunEventEnum } from '@rodrigocoliveira/agno-types';
import { getJsonMarkdown } from '../utils/json-markdown';
import { parseToolArgs } from '../utils/parse-tool-arg';

/**
 * Processes a new tool call and adds/updates it in the message
 */
export function processToolCall(
  toolCall: ToolCall,
  prevToolCalls: ToolCall[] = []
): ToolCall[] {
  // Coerce Python-repr tool_args at the parser boundary
  // (workaround for agno#8007 / agno-client#11).
  const normalized: ToolCall = toolCall.tool_args
    ? { ...toolCall, tool_args: parseToolArgs(toolCall.tool_args) }
    : toolCall;

  const toolCallId =
    normalized.tool_call_id || `${normalized.tool_name}-${normalized.created_at}`;

  const existingToolCallIndex = prevToolCalls.findIndex(
    (tc) =>
      (tc.tool_call_id && tc.tool_call_id === normalized.tool_call_id) ||
      (!tc.tool_call_id &&
        normalized.tool_name &&
        normalized.created_at &&
        `${tc.tool_name}-${tc.created_at}` === toolCallId)
  );

  if (existingToolCallIndex >= 0) {
    const updatedToolCalls = [...prevToolCalls];
    updatedToolCalls[existingToolCallIndex] = {
      ...updatedToolCalls[existingToolCallIndex],
      ...normalized,
    };
    return updatedToolCalls;
  } else {
    return [...prevToolCalls, normalized];
  }
}

/**
 * Processes tool calls from a chunk
 */
export function processChunkToolCalls(
  chunk: RunResponseContent | RunResponse,
  existingToolCalls: ToolCall[] = []
): ToolCall[] {
  let updatedToolCalls = [...existingToolCalls];

  if (chunk.tool) {
    updatedToolCalls = processToolCall(chunk.tool, updatedToolCalls);
  }

  if (chunk.tools && chunk.tools.length > 0) {
    for (const toolCall of chunk.tools) {
      updatedToolCalls = processToolCall(toolCall, updatedToolCalls);
    }
  }

  return updatedToolCalls;
}

/**
 * Event processor that handles different RunEvent types
 */
export class EventProcessor {
  private lastContent = '';

  /**
   * Process a chunk and update the last message
   */
  processChunk(
    chunk: RunResponse,
    lastMessage: ChatMessage | undefined
  ): ChatMessage | undefined {
    if (!lastMessage || lastMessage.role !== 'agent') {
      return lastMessage;
    }

    const event = chunk.event as RunEvent;
    const updatedMessage = { ...lastMessage };

    switch (event) {
      case RunEventEnum.RunStarted:
      case RunEventEnum.TeamRunStarted:
      case RunEventEnum.ReasoningStarted:
      case RunEventEnum.TeamReasoningStarted:
        // These events are handled at the client level for session management
        break;

      case RunEventEnum.ToolCallStarted:
      case RunEventEnum.TeamToolCallStarted:
      case RunEventEnum.ToolCallCompleted:
      case RunEventEnum.TeamToolCallCompleted:
      case RunEventEnum.ToolCallError:
      case RunEventEnum.TeamToolCallError:
        // ToolCallError carries the failed tool on the same `tool`/`tools` fields as
        // Started/Completed, with `tool_call_error: true` set on it — merging it in here
        // is what makes the error state visible on the rendered tool call card.
        updatedMessage.tool_calls = processChunkToolCalls(
          chunk,
          lastMessage.tool_calls
        );
        break;

      case RunEventEnum.RunContent:
      case RunEventEnum.TeamRunContent:
        if (typeof chunk.content === 'string') {
          const uniqueContent = chunk.content.replace(this.lastContent, '');
          updatedMessage.content =
            (updatedMessage.content as string) + uniqueContent;
          this.lastContent = chunk.content;
        } else if (
          typeof chunk.content !== 'string' &&
          chunk.content !== null
        ) {
          const jsonBlock = getJsonMarkdown(chunk.content);
          updatedMessage.content = (updatedMessage.content as string) + jsonBlock;
          this.lastContent = jsonBlock;
        }

        // Handle tool calls streaming
        updatedMessage.tool_calls = processChunkToolCalls(
          chunk,
          lastMessage.tool_calls
        );

        // Handle extra data
        if (chunk.extra_data?.reasoning_steps) {
          updatedMessage.extra_data = {
            ...updatedMessage.extra_data,
            reasoning_steps: chunk.extra_data.reasoning_steps,
          };
        }

        if (chunk.extra_data?.references) {
          updatedMessage.extra_data = {
            ...updatedMessage.extra_data,
            references: chunk.extra_data.references,
          };
        }

        // Note: UI components are now stored in tool_calls array, not extra_data
        // This section is preserved for backward compatibility but doesn't update extra_data

        updatedMessage.created_at = chunk.created_at ?? lastMessage.created_at;

        if (chunk.images) {
          updatedMessage.images = chunk.images;
        }
        if (chunk.videos) {
          updatedMessage.videos = chunk.videos;
        }
        if (chunk.audio) {
          updatedMessage.audio = chunk.audio;
        }

        // Handle response audio transcript
        if (
          chunk.response_audio?.transcript &&
          typeof chunk.response_audio.transcript === 'string'
        ) {
          const transcript = chunk.response_audio.transcript;
          updatedMessage.response_audio = {
            ...updatedMessage.response_audio,
            transcript:
              (updatedMessage.response_audio?.transcript || '') + transcript,
          };
        }
        break;

      case RunEventEnum.ReasoningStep:
      case RunEventEnum.TeamReasoningStep: {
        const existingSteps = lastMessage.extra_data?.reasoning_steps ?? [];

        // Agno backend emits one ReasoningStep per event with the step in
        // `chunk.content`. Keep `extra_data.reasoning_steps` as a fallback for
        // backend variants that surface an accumulated list there.
        const incomingSteps =
          chunk.extra_data?.reasoning_steps ??
          (chunk.content && typeof chunk.content === 'object'
            ? [chunk.content as ReasoningSteps]
            : []);

        updatedMessage.extra_data = {
          ...updatedMessage.extra_data,
          reasoning_steps: [...existingSteps, ...incomingSteps],
        };
        break;
      }

      case RunEventEnum.ReasoningCompleted:
      case RunEventEnum.TeamReasoningCompleted:
        if (chunk.extra_data?.reasoning_steps) {
          updatedMessage.extra_data = {
            ...updatedMessage.extra_data,
            reasoning_steps: chunk.extra_data.reasoning_steps,
          };
        }
        break;

      case RunEventEnum.RunCompleted:
      case RunEventEnum.TeamRunCompleted:
        let updatedContent: string;
        if (typeof chunk.content === 'string') {
          updatedContent = chunk.content;
        } else {
          try {
            updatedContent = JSON.stringify(chunk.content);
          } catch {
            updatedContent = 'Error parsing response';
          }
        }

        updatedMessage.content = updatedContent;
        updatedMessage.tool_calls = processChunkToolCalls(
          chunk,
          lastMessage.tool_calls
        );
        updatedMessage.images = chunk.images ?? lastMessage.images;
        updatedMessage.videos = chunk.videos ?? lastMessage.videos;
        updatedMessage.response_audio = chunk.response_audio;
        updatedMessage.created_at = chunk.created_at ?? lastMessage.created_at;
        updatedMessage.extra_data = {
          reasoning_steps:
            chunk.extra_data?.reasoning_steps ??
            lastMessage.extra_data?.reasoning_steps,
          references:
            chunk.extra_data?.references ?? lastMessage.extra_data?.references,
        };
        break;

      case RunEventEnum.MemoryUpdateStarted:
      case RunEventEnum.MemoryUpdateCompleted:
      case RunEventEnum.TeamMemoryUpdateStarted:
      case RunEventEnum.TeamMemoryUpdateCompleted:
        // No-op for now
        break;

      case RunEventEnum.RunPaused:
      case RunEventEnum.TeamRunPaused:
        // Run paused for HITL - handled at client level
        // Don't update the message, just let the client emit run:paused event
      case RunEventEnum.RunContinued:
      case RunEventEnum.TeamRunContinued:
        // Control-flow marker only - client emits run:continued when it calls continueRun()
      case RunEventEnum.CustomEvent:
        // Custom events are passed through without modifying message state.
        // They are handled at the client level via the 'custom:event' emission.
        // Tool-emitted custom data is available in the raw event payload.
        break;

      case RunEventEnum.RunCancelled:
        // User-initiated cancellation - mark as cancelled, not error
        updatedMessage.cancelled = true;
        break;

      case RunEventEnum.RunError:
      case RunEventEnum.TeamRunError:
      case RunEventEnum.TeamRunCancelled:
        updatedMessage.streamingError = true;
        break;

      // --- Agno v3: newer lifecycle events with no message-mutation semantics
      // defined yet. Listed explicitly (instead of falling through to a default)
      // so each one is a deliberate no-op, not a silently-ignored unknown event. ---
      case RunEventEnum.RunContentCompleted:
      case RunEventEnum.TeamRunContentCompleted:
      case RunEventEnum.RunIntermediateContent:
      case RunEventEnum.TeamRunIntermediateContent:
      case RunEventEnum.PreHookStarted:
      case RunEventEnum.PreHookCompleted:
      case RunEventEnum.TeamPreHookStarted:
      case RunEventEnum.TeamPreHookCompleted:
      case RunEventEnum.PostHookStarted:
      case RunEventEnum.PostHookCompleted:
      case RunEventEnum.TeamPostHookStarted:
      case RunEventEnum.TeamPostHookCompleted:
      case RunEventEnum.ReasoningContentDelta:
      case RunEventEnum.TeamReasoningContentDelta:
      case RunEventEnum.SessionSummaryStarted:
      case RunEventEnum.SessionSummaryCompleted:
      case RunEventEnum.TeamSessionSummaryStarted:
      case RunEventEnum.TeamSessionSummaryCompleted:
      case RunEventEnum.ParserModelResponseStarted:
      case RunEventEnum.ParserModelResponseCompleted:
      case RunEventEnum.TeamParserModelResponseStarted:
      case RunEventEnum.TeamParserModelResponseCompleted:
      case RunEventEnum.OutputModelResponseStarted:
      case RunEventEnum.OutputModelResponseCompleted:
      case RunEventEnum.TeamOutputModelResponseStarted:
      case RunEventEnum.TeamOutputModelResponseCompleted:
      case RunEventEnum.ModelRequestStarted:
      case RunEventEnum.ModelRequestCompleted:
      case RunEventEnum.TeamModelRequestStarted:
      case RunEventEnum.TeamModelRequestCompleted:
      case RunEventEnum.CompressionStarted:
      case RunEventEnum.CompressionCompleted:
      case RunEventEnum.TeamCompressionStarted:
      case RunEventEnum.TeamCompressionCompleted:
      case RunEventEnum.FollowupsStarted:
      case RunEventEnum.FollowupsCompleted:
      case RunEventEnum.TeamFollowupsStarted:
      case RunEventEnum.TeamFollowupsCompleted:
      case RunEventEnum.TeamTaskIterationStarted:
      case RunEventEnum.TeamTaskIterationCompleted:
      case RunEventEnum.TeamTaskStateUpdated:
      case RunEventEnum.TeamTaskCreated:
      case RunEventEnum.TeamTaskUpdated:
        break;
    }

    return updatedMessage;
  }

  /**
   * Reset the processor state (e.g., between messages)
   */
  reset() {
    this.lastContent = '';
  }
}
