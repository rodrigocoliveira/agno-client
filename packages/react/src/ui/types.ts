import type { ReactNode } from 'react';

/**
 * Tool execution state - replaces Vercel AI SDK's ToolUIPart["state"]
 */
export type ToolState =
  | 'input-streaming'
  | 'input-available'
  | 'approval-requested'
  | 'approval-responded'
  | 'output-available'
  | 'output-error'
  | 'output-denied';

/**
 * File attachment type - replaces Vercel AI SDK's FileUIPart
 */
export type FileAttachment = {
  type: 'file';
  url: string;
  mediaType?: string;
  filename?: string;
};

/**
 * Chat status for UI state management
 */
export type ChatStatus = 'idle' | 'submitted' | 'streaming' | 'error';

/**
 * Suggested prompt for empty state
 */
export type SuggestedPrompt = {
  icon?: ReactNode;
  text: string;
};

/**
 * File upload configuration
 */
export type FileUploadConfig = {
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxFileSize?: number;
};

/**
 * ClassNames override map for composed components
 */
export type AgnoChatInterfaceClassNames = {
  root?: string;
  messagesArea?: string;
  inputArea?: string;
  toolStatusBar?: string;
  errorBar?: string;
  dropZone?: string;
};

export type AgnoMessageItemClassNames = {
  root?: string;
  userBubble?: string;
  assistantContainer?: string;
  toolCalls?: string;
  reasoning?: string;
  references?: string;
  media?: string;
  actions?: string;
};
