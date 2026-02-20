import { useCallback, useMemo, useRef } from 'react';
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

  const containerRef = useRef<HTMLDivElement>(null);

  // Stable ref so handleSend never changes identity
  const sendRef = useRef(chat.sendMessage);
  sendRef.current = chat.sendMessage;

  const handleSend = useCallback(async (message: string | FormData) => {
    try {
      await sendRef.current(message);
    } catch {
      // Error is surfaced via the error state
    }
  }, []);

  // Destructure individual values for stable dependency tracking
  const {
    messages,
    sendMessage,
    clearMessages,
    cancelRun,
    isStreaming,
    isRefreshing,
    isCancelling,
    currentRunId,
    error,
    state,
  } = chat;

  const {
    isPaused,
    isExecuting,
    pendingTools,
    executeAndContinue,
    executeTools,
    continueWithResults,
    executionError,
  } = toolExec;

  const contextValue = useMemo<AgnoChatContextValue>(
    () => ({
      // chat
      messages,
      sendMessage,
      clearMessages,
      cancelRun,
      isStreaming,
      isRefreshing,
      isCancelling: isCancelling ?? false,
      currentRunId,
      error,
      state,

      // tool execution
      isPaused,
      isExecuting,
      pendingTools,
      executeAndContinue,
      executeTools,
      continueWithResults,
      executionError,

      // derived
      handleSend,
      inputDisabled: isStreaming || isPaused,

      // drop zone
      dropZoneContainerRef: containerRef,
    }),
    [
      messages,
      sendMessage,
      clearMessages,
      cancelRun,
      isStreaming,
      isRefreshing,
      isCancelling,
      currentRunId,
      error,
      state,
      isPaused,
      isExecuting,
      pendingTools,
      executeAndContinue,
      executeTools,
      continueWithResults,
      executionError,
      handleSend,
    ],
  );

  return (
    <AgnoChatContext.Provider value={contextValue}>
      <div ref={containerRef} className={cn('relative h-full flex flex-col', className)} {...divProps}>
        {children}
      </div>
    </AgnoChatContext.Provider>
  );
}
