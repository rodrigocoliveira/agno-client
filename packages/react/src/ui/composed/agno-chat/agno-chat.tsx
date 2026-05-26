import { useCallback, useMemo, useRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { useAgnoChat, useAgnoToolExecution } from '@rodrigocoliveira/agno-react';
import type { ToolHandler } from '@rodrigocoliveira/agno-react';
import { AgnoChatContext } from './context';
import type { AgnoChatContextValue } from './context';
import type { RenderTool } from './render-tool';
import { cn } from '../../lib/cn';

function resolveDebug(debug?: boolean): boolean {
  if (typeof debug === 'boolean') return debug;
  // Default-off: only auto-enable when NODE_ENV is explicitly 'development'.
  // Avoids leaking the debug card in production builds where `process` exists
  // but `process.env` is missing or NODE_ENV is unset (some edge runtimes,
  // partial polyfills, builds without bundler substitution).
  return typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';
}

export interface AgnoChatRootProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  toolHandlers?: Record<string, ToolHandler>;
  autoExecuteTools?: boolean;
  /**
   * Single per-tool render function. Receives the tool plus `{ index, isDebug, defaultRender }`.
   * Return `null` to hide, return `defaultRender()` to fall back to the library default,
   * or return your own JSX. Use the `byToolName` helper for the common dispatch-by-name case.
   */
  renderTool?: RenderTool;
  /**
   * When true, the default tool rendering includes the debug card. When false, only
   * user-facing content renders (generative UI from `tool.ui_component`, plus whatever
   * a custom `renderTool` returns).
   *
   * Default: auto-detected via `process.env.NODE_ENV !== 'production'`. Set explicitly
   * to investigate bugs in production (`debug={true}`) or preview the prod experience
   * in dev (`debug={false}`).
   */
  debug?: boolean;
  /**
   * Tool names whose handlers should NOT be re-invoked on session reload. Useful when
   * a tool produced a `result` you want to render as-is without re-executing side effects.
   */
  skipHydration?: string[];
}

export function AgnoChatRoot({
  children,
  toolHandlers = {},
  autoExecuteTools = true,
  renderTool,
  debug,
  skipHydration,
  className,
  ...divProps
}: AgnoChatRootProps) {
  const chat = useAgnoChat();
  const toolExec = useAgnoToolExecution(toolHandlers, autoExecuteTools, {
    skipHydration,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const isDebug = resolveDebug(debug);

  const sendRef = useRef(chat.sendMessage);
  sendRef.current = chat.sendMessage;

  const handleSend = useCallback(async (message: string | FormData) => {
    try {
      await sendRef.current(message);
    } catch {
      // Error is surfaced via the error state
    }
  }, []);

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
      isPaused,
      isExecuting,
      pendingTools,
      executeAndContinue,
      executeTools,
      continueWithResults,
      executionError,
      handleSend,
      inputDisabled: isStreaming || isPaused,
      dropZoneContainerRef: containerRef,
      renderTool,
      isDebug,
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
      renderTool,
      isDebug,
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
