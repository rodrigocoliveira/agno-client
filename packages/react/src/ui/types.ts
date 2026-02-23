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
 * Audio recording/transcription configuration.
 *
 * Pass `true` as shorthand for `{ enabled: true }` (send mode).
 *
 * @example
 * // Send audio blob directly
 * audio={true}
 *
 * // Transcribe audio to text
 * audio={{ enabled: true, mode: 'transcribe', endpoint: 'http://...' }}
 */
export type AudioConfig = {
  /** Enable audio recording (default: false) */
  enabled?: boolean;
  /** 'send' sends the blob as a file, 'transcribe' converts to text (default: 'send') */
  mode?: 'send' | 'transcribe';
  /** Transcription endpoint URL (required when mode='transcribe') */
  endpoint?: string;
  /** Extra headers for the transcription request */
  headers?: Record<string, string>;
  /** Custom parser for the transcription JSON response — return the text */
  parseResponse?: (data: unknown) => string;
  /** Async callback to request microphone permission (e.g., for WebView bridges) */
  requestPermission?: () => Promise<boolean>;
  /** Custom labels for the audio recorder button (i18n) */
  labels?: Record<string, string>;
};

export type AgnoMessageAvatars = {
  user?: ReactNode;
  assistant?: ReactNode;
};

/** Controls when action buttons are visible */
export type AgnoActionsVisibility =
  | 'visible'              // Always visible on all messages
  | 'hover'                // Show only on hover for all messages
  | 'last-assistant'       // Only visible on the last assistant message (always shown)
  | 'hover-last-visible';  // Hover on all messages + always visible on last assistant (Claude-like)

export type AgnoMessageActions = {
  /** Render action buttons for user messages */
  user?: (message: import('@rodrigocoliveira/agno-types').ChatMessage) => ReactNode;
  /** Render action buttons for assistant messages */
  assistant?: (message: import('@rodrigocoliveira/agno-types').ChatMessage) => ReactNode;
  /** When to show the action buttons (default: 'visible') */
  visibility?: AgnoActionsVisibility;
};

export type AgnoMessageClassNames = {
  root?: string;
  user?: {
    bubble?: string;
  };
  assistant?: {
    container?: string;
    toolCalls?: string;
    reasoning?: string;
    references?: string;
    media?: string;
    actions?: string;
  };
};
