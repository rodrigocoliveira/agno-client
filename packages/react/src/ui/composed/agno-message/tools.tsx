import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { useAgnoChatContext } from '../agno-chat/context';
import { ToolDebugCard, ToolGenerativeUI } from '../agno-chat/tool-building-blocks';
import type { RenderTool } from '../agno-chat/render-tool';
import { useAgnoMessageContext } from './context';

export interface AgnoMessageToolsProps {
  /** Override the `renderTool` from context for this slot only */
  renderTool?: RenderTool;
}

export function AgnoMessageTools({ renderTool: renderToolProp }: AgnoMessageToolsProps = {}) {
  const { message, classNames, renderTool: ctxMsgRenderTool } = useAgnoMessageContext();
  const { renderTool: ctxChatRenderTool, isDebug } = useAgnoChatContext();
  const renderTool = renderToolProp ?? ctxMsgRenderTool ?? ctxChatRenderTool;

  if (!message.tool_calls || message.tool_calls.length === 0) return null;

  return (
    <div className={cn('space-y-2 pt-1', classNames?.assistant?.toolCalls)}>
      {message.tool_calls.map((tool, idx) => {
        const defaultRender = (): ReactNode => (
          <>
            <ToolGenerativeUI tool={tool} />
            {isDebug ? <ToolDebugCard tool={tool} defaultOpen={idx === 0} /> : null}
          </>
        );
        const node = renderTool
          ? renderTool(tool, { index: idx, isDebug, defaultRender })
          : defaultRender();
        if (node === null || node === undefined) return null;
        return <div key={tool.tool_call_id || idx}>{node}</div>;
      })}
    </div>
  );
}
