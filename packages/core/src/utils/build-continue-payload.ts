import type { ToolCall, RunRequirement } from '@rodrigocoliveira/agno-types';

/** Strip client-only fields before sending a tool back to the backend as a `ToolExecution`. */
function toToolExecution(tool: ToolCall): ToolCall {
  const { ui_component, requirement_id, member_agent_id, member_agent_name, member_run_id, ...backendTool } =
    tool as ToolCall & { ui_component?: unknown };
  return backendTool as ToolCall;
}

/** Build the `tools` FormData payload for `POST /agents/{id}/runs/{run_id}/continue`. */
export function buildAgentContinueTools(tools: ToolCall[]): ToolCall[] {
  return tools.map(toToolExecution);
}

/**
 * Build the `requirements` FormData payload for `POST /teams/{id}/runs/{run_id}/continue`.
 *
 * Teams take `RunRequirement[]`, not a flat `ToolExecution[]` (verified against
 * `agno==3.0.6`: `continue_team_run` parses via `RunRequirement.from_dict`). The backend
 * binds each entry to the stored requirement by `id`, then by `tool_call_id`, and routes
 * member-originated ones via `member_*` — so those are round-tripped from the values
 * `getPendingTools` captured on pause. The decision itself lives on `tool_execution`
 * (`confirmed`/`answered`/`result`), which the backend reads directly.
 */
export function buildTeamContinueRequirements(tools: ToolCall[]): RunRequirement[] {
  return tools.map((tool) => ({
    id: tool.requirement_id,
    member_agent_id: tool.member_agent_id,
    member_agent_name: tool.member_agent_name,
    member_run_id: tool.member_run_id,
    tool_execution: toToolExecution(tool),
  }));
}
