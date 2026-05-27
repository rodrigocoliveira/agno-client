import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  ToolCall,
  UIComponentSpec,
  ToolHandlerResult,
} from '@rodrigocoliveira/agno-types';
import { useAgnoClient } from '../context/AgnoContext';
import { useToolHandlers } from '../context/ToolHandlerContext';

export type ToolHandler = (args: Record<string, any>) => Promise<any>;

function isToolHandlerResult(value: any): value is ToolHandlerResult {
  return value && typeof value === 'object' && ('data' in value || 'ui' in value);
}

function isUIComponentSpec(value: any): value is UIComponentSpec {
  return value && typeof value === 'object' && 'type' in value;
}

/**
 * Split a handler return value into (a) the string `tool.result` field sent
 * back to the backend and (b) an optional `ui` spec attached as
 * `tool.ui_component` for consumer renderers to read.
 */
export function processToolResult(result: any, _tool: ToolCall): {
  resultData: string;
  uiComponent?: any;
} {
  if (isToolHandlerResult(result)) {
    const { data, ui } = result;
    return {
      resultData: typeof data === 'string' ? data : JSON.stringify(data),
      uiComponent: ui,
    };
  }

  if (isUIComponentSpec(result)) {
    return {
      resultData: JSON.stringify(result),
      uiComponent: result,
    };
  }

  return {
    resultData: typeof result === 'string' ? result : JSON.stringify(result),
    uiComponent: undefined,
  };
}

/**
 * Tool execution event payload
 */
export interface ToolExecutionEvent {
  runId?: string;
  sessionId?: string;
  tools: ToolCall[];
}

/**
 * Hook for handling frontend tool execution (HITL)
 *
 * **Note:** HITL (Human-in-the-Loop) frontend tool execution is only supported for agents.
 * Teams do not support the continue endpoint. This hook will log a warning and no-op if used with team mode.
 *
 * @param handlers - Map of tool names to handler functions (local handlers)
 * @param autoExecute - Whether to automatically execute tools when paused (default: true)
 * @param options.skipToolsOnSessionLoad - Tool names whose handlers should NOT be re-invoked
 *   when a saved session is loaded. Use this for interactive tools with side effects.
 *
 * @example
 * ```tsx
 * const toolHandlers = {
 *   navigate_to_page: async (args) => {
 *     window.location.href = args.url;
 *     return { success: true };
 *   },
 *   fill_form: async (args) => {
 *     document.querySelector(args.selector).value = args.value;
 *     return { filled: true };
 *   }
 * };
 *
 * const { isPaused, isExecuting, pendingTools } = useAgnoToolExecution(toolHandlers);
 * ```
 */
export function useAgnoToolExecution(
  handlers: Record<string, ToolHandler> = {},
  autoExecute: boolean = true,
  options?: { skipToolsOnSessionLoad?: string[] }
) {
  const client = useAgnoClient();
  const toolHandlerContext = useToolHandlers();

  // Check if in team mode - teams don't support HITL
  const isTeamMode = client.getConfig().mode === 'team';

  // Log warning once if in team mode
  useEffect(() => {
    if (isTeamMode) {
      console.warn(
        '[useAgnoToolExecution] HITL (Human-in-the-Loop) frontend tool execution is not supported for teams. ' +
        'Only agents support the continue endpoint. This hook will not function in team mode.'
      );
    }
  }, [isTeamMode]);

  // Merge global handlers with local handlers (local takes precedence)
  const mergedHandlers = useMemo(() => {
    const globalHandlers = toolHandlerContext?.handlers || {};
    return { ...globalHandlers, ...handlers };
  }, [toolHandlerContext?.handlers, handlers]);

  const [pendingTools, setPendingTools] = useState<ToolCall[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionError, setExecutionError] = useState<string | undefined>();

  // Listen for run:paused events (only for agents, not teams)
  useEffect(() => {
    // Don't register listeners if in team mode
    if (isTeamMode) {
      return;
    }

    const handleRunPaused = (event: ToolExecutionEvent) => {
      setIsPaused(true);
      setPendingTools(event.tools);
      setExecutionError(undefined);
    };

    const handleRunContinued = () => {
      setIsPaused(false);
      setPendingTools([]);
      setIsExecuting(false);
      setExecutionError(undefined);
    };

    client.on('run:paused', handleRunPaused);
    client.on('run:continued', handleRunContinued);

    return () => {
      client.off('run:paused', handleRunPaused);
      client.off('run:continued', handleRunContinued);
    };
  }, [client, isTeamMode]);

  /**
   * Execute all pending tools and continue the run
   */
  const executeAndContinue = useCallback(async () => {
    if (!isPaused || pendingTools.length === 0) {
      console.warn('[useAgnoToolExecution] Cannot execute: no pending tools');
      return;
    }

    setIsExecuting(true);
    setExecutionError(undefined);

    try {
      // Execute each tool
      const updatedTools = await Promise.all(
        pendingTools.map(async (tool) => {
          const handler = mergedHandlers[tool.tool_name];

          if (!handler) {
            return {
              ...tool,
              result: JSON.stringify({
                error: `No handler registered for ${tool.tool_name}`,
              }),
            };
          }

          try {
            const result = await handler(tool.tool_args);

            // Process result to extract data and UI components
            const { resultData, uiComponent } = processToolResult(result, tool);

            return {
              ...tool,
              result: resultData,
              ui_component: uiComponent,
            } as ToolCall;
          } catch (error) {
            return {
              ...tool,
              result: JSON.stringify({
                error: error instanceof Error ? error.message : String(error),
              }),
            };
          }
        })
      );

      // Store UI components in the client's message store before continuing
      // This ensures the UI components are visible even if the backend doesn't echo them back
      const toolsWithUI = updatedTools.filter(t => (t as any).ui_component);
      if (toolsWithUI.length > 0) {
        // Emit a custom event with the UI data
        client.emit('ui:render', {
          tools: updatedTools,
          runId: client.getState().pausedRunId,
        });
      }

      // Add frontend-executed tool calls to the message before continuing
      // This ensures they appear in the UI and persist in the message
      client.addToolCallsToLastMessage(updatedTools);

      // Continue the run with results
      await client.continueRun(updatedTools);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setExecutionError(errorMessage);
      setIsExecuting(false);
      throw error;
    }
  }, [client, mergedHandlers, isPaused, pendingTools]);

  /**
   * Hydrate tool calls with UI when session loads
   */
  useEffect(() => {
    const handleSessionLoaded = async (_sessionId: string) => {
      const messages = client.getMessages();

      for (const message of messages) {
        if (!message.tool_calls) continue;

        for (const tool of message.tool_calls) {
          // Skip if already has UI
          if ((tool as any).ui_component) continue;

          // Skip interactive tools — re-invoking would trigger side effects (modals, navigation).
          // The stored result still renders from history via the message's tool_calls.
          if (options?.skipToolsOnSessionLoad?.includes(tool.tool_name)) continue;

          const handler = mergedHandlers[tool.tool_name];
          if (!handler) continue;

          try {
            const result = await handler(tool.tool_args);
            const { uiComponent } = processToolResult(result, tool);

            if (uiComponent) {
              client.hydrateToolCallUI(tool.tool_call_id, uiComponent);
            }
          } catch (err) {
            console.error(`Failed to hydrate UI for ${tool.tool_name}:`, err);
          }
        }
      }
    };

    client.on('session:loaded', handleSessionLoaded);
    return () => {
      client.off('session:loaded', handleSessionLoaded);
    };
  }, [client, mergedHandlers]);

  /**
   * Execute tools manually (for user confirmation flows)
   * Returns the updated tools with results set
   */
  const executeTools = useCallback(
    async (tools: ToolCall[]): Promise<ToolCall[]> => {
      return Promise.all(
        tools.map(async (tool) => {
          const handler = mergedHandlers[tool.tool_name];
          if (!handler) return tool;

          try {
            const result = await handler(tool.tool_args);

            // Process result to extract data and UI components
            const { resultData, uiComponent } = processToolResult(result, tool);

            return {
              ...tool,
              result: resultData,
              ui_component: uiComponent,
            } as ToolCall;
          } catch (error) {
            return {
              ...tool,
              result: JSON.stringify({
                error: error instanceof Error ? error.message : String(error),
              }),
            };
          }
        })
      );
    },
    [mergedHandlers]
  );

  /**
   * Manually continue the run with custom tool results
   */
  const continueWithResults = useCallback(
    async (tools: ToolCall[], options?: { headers?: Record<string, string>; params?: Record<string, string> }) => {
      if (!isPaused) {
        throw new Error('No paused run to continue');
      }
      setIsExecuting(true);
      try {
        await client.continueRun(tools, options);
      } catch (error) {
        setIsExecuting(false);
        throw error;
      }
    },
    [client, isPaused]
  );

  // Auto-execute when paused (if enabled)
  useEffect(() => {
    if (autoExecute && isPaused && !isExecuting && pendingTools.length > 0) {
      executeAndContinue();
    }
  }, [autoExecute, isPaused, isExecuting, pendingTools.length, executeAndContinue]);

  return {
    /** Whether the run is currently paused awaiting tool execution */
    isPaused,
    /** Whether tools are currently being executed */
    isExecuting,
    /** Tools awaiting execution */
    pendingTools,
    /** Execute all pending tools and continue the run */
    executeAndContinue,
    /** Execute specific tools and return results without continuing */
    executeTools,
    /** Continue the run with manually provided tool results */
    continueWithResults,
    /** Error from tool execution, if any */
    executionError,
  };
}
