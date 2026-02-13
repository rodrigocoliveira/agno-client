import { createContext, useContext } from 'react';
import type { ChatMessage, ClientState, ToolCall } from '@rodrigocoliveira/agno-types';

export interface AgnoChatContextValue {
  // From useAgnoChat()
  messages: ChatMessage[];
  sendMessage: (
    message: string | FormData,
    options?: { headers?: Record<string, string>; params?: Record<string, string> },
  ) => Promise<void>;
  clearMessages: () => void;
  cancelRun: () => Promise<void>;
  isStreaming: boolean;
  isRefreshing: boolean;
  isCancelling: boolean;
  currentRunId?: string;
  error?: string;
  state: ClientState;

  // From useAgnoToolExecution()
  isPaused: boolean;
  isExecuting: boolean;
  pendingTools: ToolCall[];
  executeAndContinue: () => Promise<void>;
  executeTools: (tools: ToolCall[]) => Promise<ToolCall[]>;
  continueWithResults: (
    tools: ToolCall[],
    options?: { headers?: Record<string, string>; params?: Record<string, string> },
  ) => Promise<void>;
  executionError?: string;

  // Derived convenience
  handleSend: (message: string | FormData) => Promise<void>;
  inputDisabled: boolean;
}

export const AgnoChatContext = createContext<AgnoChatContextValue | null>(null);

export function useAgnoChatContext(): AgnoChatContextValue {
  const ctx = useContext(AgnoChatContext);
  if (!ctx) {
    throw new Error(
      'useAgnoChatContext must be used within an <AgnoChat> provider. ' +
        'Wrap your component tree with <AgnoChat>.',
    );
  }
  return ctx;
}
