import type { RunRequirement, ToolCall } from '@rodrigocoliveira/agno-types';
import { parseToolArgs } from './parse-tool-arg';

/**
 * Whether a tool call is still blocking its run (HITL), mirroring Agno v3's own
 * `RunRequirement.needs_confirmation` / `needs_user_input` / `needs_external_execution`
 * resolution logic (verified against `agno==3.0.6` source):
 * - confirmation: pending while `confirmed` hasn't been set yet.
 * - user input: pending while the tool hasn't been marked `answered`.
 * - external execution: pending while no `result` has been recorded yet.
 */
export function isToolPending(tool: ToolCall): boolean {
  if (tool.requires_confirmation === true && tool.confirmed == null) {
    return true;
  }
  if (tool.requires_user_input === true && tool.answered !== true) {
    return true;
  }
  if (tool.external_execution_required === true && tool.result == null) {
    return true;
  }
  return false;
}

/** Unwrap a `RunRequirement` into a `ToolCall`, keeping the requirement's identity for round-trip. */
function toolFromRequirement(req: RunRequirement): ToolCall {
  return {
    ...req.tool_execution,
    requirement_id: req.id,
    member_agent_id: req.member_agent_id,
    member_agent_name: req.member_agent_name,
    member_run_id: req.member_run_id,
  };
}

/**
 * Extract the tools still blocking a paused run.
 *
 * Reads `requirements` first — it is the only field that carries a pause originating
 * from a delegated team member (the member's tool is propagated into the team's
 * `requirements`, tagged with `member_*`, and is never mirrored into the team's flat
 * `tools`; verified against `agno==3.0.6` `team/_run.py`). `tools` is merged in for
 * anything not already covered (agent runs populate both with the same data).
 *
 * `tool_args` are coerced defensively (agno#8007; a no-op for Agno v3's valid JSON).
 */
export function getPendingTools(
  source: { tools?: ToolCall[] | null; requirements?: RunRequirement[] | null } | undefined | null
): ToolCall[] {
  const byId = new Map<string, ToolCall>();
  for (const req of source?.requirements ?? []) {
    if (req.tool_execution) byId.set(req.tool_execution.tool_call_id, toolFromRequirement(req));
  }
  for (const tool of source?.tools ?? []) {
    if (!byId.has(tool.tool_call_id)) byId.set(tool.tool_call_id, tool);
  }
  return [...byId.values()]
    .filter(isToolPending)
    .map((t) => ({ ...t, tool_args: parseToolArgs(t.tool_args) }));
}
