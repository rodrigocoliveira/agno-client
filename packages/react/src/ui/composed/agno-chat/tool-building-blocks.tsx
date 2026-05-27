import type { ToolCall } from '@rodrigocoliveira/agno-types';
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from '../../components/tool';
import type { ToolState } from '../../types';

export interface ToolDebugCardProps {
  tool: ToolCall;
  defaultOpen?: boolean;
}

const getToolState = (tool: ToolCall): ToolState =>
  tool.tool_call_error ? 'output-error' : 'output-available';

export function ToolDebugCard({ tool, defaultOpen }: ToolDebugCardProps) {
  const output = tool.result ?? tool.content;
  return (
    <Tool defaultOpen={defaultOpen}>
      <ToolHeader title={tool.tool_name} type="tool-use" state={getToolState(tool)} />
      <ToolContent>
        <ToolInput input={tool.tool_args} />
        {output ? (
          <ToolOutput
            output={output}
            errorText={tool.tool_call_error ? 'Tool execution failed' : undefined}
          />
        ) : null}
      </ToolContent>
    </Tool>
  );
}
