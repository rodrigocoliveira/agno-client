import type { ToolCall, RunRequirement } from '@rodrigocoliveira/agno-types';

/** Strip client-only fields (ui_component) before sending a tool back to the backend. */
function stripClientOnlyFields(tool: ToolCall): ToolCall {
  const { ui_component, ...backendTool } = tool as ToolCall & { ui_component?: unknown };
  return backendTool as ToolCall;
}

/** Build the `tools` FormData payload for `POST /agents/{id}/runs/{run_id}/continue`. */
export function buildAgentContinueTools(tools: ToolCall[]): ToolCall[] {
  return tools.map(stripClientOnlyFields);
}

/**
 * Build the `requirements` FormData payload for `POST /teams/{id}/runs/{run_id}/continue`.
 *
 * Teams do NOT accept a flat `tools` array like agents do — each tool must be wrapped in a
 * `RunRequirement`, a different shape (verified byte-for-byte against `agno==3.0.6` source:
 * `os/routers/teams/router.py`'s `continue_team_run` parses a `requirements` field via
 * `RunRequirement.from_dict`, while `os/routers/agents/router.py`'s `continue_agent_run` parses
 * a `tools` field via `ToolExecution.from_dict` directly).
 */
export function buildTeamContinueRequirements(tools: ToolCall[]): RunRequirement[] {
  return tools.map((tool) => {
    const requirement: RunRequirement = { tool_execution: stripClientOnlyFields(tool) };
    if (tool.confirmed !== undefined) requirement.confirmation = tool.confirmed;
    if (tool.confirmation_note !== undefined) requirement.confirmation_note = tool.confirmation_note;
    if (tool.user_input_schema !== undefined) requirement.user_input_schema = tool.user_input_schema;
    if (tool.user_feedback_schema !== undefined) requirement.user_feedback_schema = tool.user_feedback_schema;
    if (tool.result !== undefined && tool.result !== null) {
      requirement.external_execution_result =
        typeof tool.result === 'string' ? tool.result : JSON.stringify(tool.result);
    }
    return requirement;
  });
}
