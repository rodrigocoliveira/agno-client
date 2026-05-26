import type { ReactNode } from 'react';
import type { ToolCall } from '@rodrigocoliveira/agno-types';

export type ToolRenderArgs = {
  index: number;
  isDebug: boolean;
  defaultRender: () => ReactNode;
};

export type RenderTool = (tool: ToolCall, args: ToolRenderArgs) => ReactNode | null;

export type ToolEntry = false | RenderTool;

export function byToolName(
  map: Record<string, ToolEntry>,
  fallback?: RenderTool,
): RenderTool {
  return (tool, args) => {
    // hasOwnProperty guard so tool names like 'toString' / 'constructor' /
    // '__proto__' don't resolve to Object.prototype methods.
    if (!Object.prototype.hasOwnProperty.call(map, tool.tool_name)) {
      return fallback ? fallback(tool, args) : args.defaultRender();
    }
    const entry = map[tool.tool_name];
    if (entry === false) return null;
    return entry(tool, args);
  };
}
