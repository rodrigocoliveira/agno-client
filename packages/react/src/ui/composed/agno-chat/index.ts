import { AgnoChatRoot } from './agno-chat';
import { AgnoChatMessages } from './messages';
import { AgnoChatEmptyState } from './empty-state';
import { AgnoChatSuggestedPrompts } from './suggested-prompts';
import { AgnoChatToolStatus } from './tool-status';
import { AgnoChatErrorBar } from './error-bar';
import { AgnoChatInputArea } from './input';

// Re-export context hook and types
export { useAgnoChatContext } from './context';
export type { AgnoChatContextValue, AgnoChatAvatars } from './context';

// Re-export individual sub-components for tree-shaking / named imports
export { AgnoChatRoot } from './agno-chat';
export type { AgnoChatRootProps } from './agno-chat';
export { AgnoChatMessages } from './messages';
export type { AgnoChatMessagesProps } from './messages';
export { AgnoChatEmptyState } from './empty-state';
export type { AgnoChatEmptyStateProps } from './empty-state';
export { AgnoChatSuggestedPrompts } from './suggested-prompts';
export type { AgnoChatSuggestedPromptsProps } from './suggested-prompts';
export { AgnoChatToolStatus } from './tool-status';
export type { AgnoChatToolStatusProps } from './tool-status';
export { AgnoChatErrorBar } from './error-bar';
export type { AgnoChatErrorBarProps } from './error-bar';
export { AgnoChatInputArea } from './input';
export type { AgnoChatInputAreaProps, AgnoChatInputRenderProps } from './input';

// Compound component via Object.assign (type-safe, no double cast)
const AgnoChat = Object.assign(AgnoChatRoot, {
  Messages: AgnoChatMessages,
  EmptyState: AgnoChatEmptyState,
  SuggestedPrompts: AgnoChatSuggestedPrompts,
  ToolStatus: AgnoChatToolStatus,
  ErrorBar: AgnoChatErrorBar,
  Input: AgnoChatInputArea,
});

export { AgnoChat };
