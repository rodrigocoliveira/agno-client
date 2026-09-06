import type { ToolCall } from '@rodrigocoliveira/agno-types';
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

/**
 * Extract the tools still blocking a run, coercing Python-repr `tool_args`
 * (defensive workaround for agno#8007 / agno-client#11 — Agno v3 already emits
 * valid JSON, so this is normally a no-op).
 *
 * Prefers `tools` (the raw, guaranteed-serialized array) over the `tools_awaiting_*`
 * shortcut fields, which are Python `@property`s never included in the wire JSON
 * (confirmed against source and a live capture) — kept only as a defensive fallback
 * in case a future backend does start sending them.
 */
export function getPendingTools(tools: ToolCall[] | undefined | null): ToolCall[] {
  return (tools ?? [])
    .filter(isToolPending)
    .map((t) => ({ ...t, tool_args: parseToolArgs(t.tool_args) }));
}
