import { useMemo } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { useAgnoChat, useAgnoToolExecution } from '@rodrigocoliveira/agno-react';
import type { ToolHandler } from '@rodrigocoliveira/agno-react';
import { AgnoChatContext } from './context';
import type { AgnoChatContextValue } from './context';
import { cn } from '../../lib/cn';

export interface AgnoChatRootProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  toolHandlers?: Record<string, ToolHandler>;
  autoExecuteTools?: boolean;
}

export function AgnoChatRoot({
  children,
  toolHandlers = {},
  autoExecuteTools = true,
  className,
  ...divProps
}: AgnoChatRootProps) {
  const chat = useAgnoChat();
  const toolExec = useAgnoToolExecution(toolHandlers, autoExecuteTools);

  const handleSend = useMemo(() => {
    return async (message: string | FormData) => {
      try {
        await chat.sendMessage(message);
      } catch {
        // Error is surfaced via the error state
      }
    };
  }, [chat.sendMessage]);

  const contextValue = useMemo<AgnoChatContextValue>(
    () => ({
      // chat
      messages: chat.messages,
      sendMessage: chat.sendMessage,
      clearMessages: chat.clearMessages,
      cancelRun: chat.cancelRun,
      isStreaming: chat.isStreaming,
      isRefreshing: chat.isRefreshing,
      isCancelling: chat.isCancelling ?? false,
      currentRunId: chat.currentRunId,
      error: chat.error,
      state: chat.state,

      // tool execution
      isPaused: toolExec.isPaused,
      isExecuting: toolExec.isExecuting,
      pendingTools: toolExec.pendingTools,
      executeAndContinue: toolExec.executeAndContinue,
      executeTools: toolExec.executeTools,
      continueWithResults: toolExec.continueWithResults,
      executionError: toolExec.executionError,

      // derived
      handleSend,
      inputDisabled: chat.isStreaming || toolExec.isPaused,
    }),
    [chat, toolExec, handleSend],
  );

  return (
    <AgnoChatContext.Provider value={contextValue}>
      <div className={cn('h-full flex flex-col', className)} {...divProps}>
        {children}
      </div>
    </AgnoChatContext.Provider>
  );
}
