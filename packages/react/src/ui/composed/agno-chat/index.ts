import type { ComponentType } from 'react';
import { AgnoChatRoot } from './agno-chat';
import type { AgnoChatRootProps } from './agno-chat';
import { AgnoChatMessages } from './messages';
import type { AgnoChatMessagesProps } from './messages';
import { AgnoChatEmptyState } from './empty-state';
import type { AgnoChatEmptyStateProps } from './empty-state';
import { AgnoChatSuggestedPrompts } from './suggested-prompts';
import type { AgnoChatSuggestedPromptsProps } from './suggested-prompts';
import { AgnoChatToolStatus } from './tool-status';
import type { AgnoChatToolStatusProps } from './tool-status';
import { AgnoChatErrorBar } from './error-bar';
import type { AgnoChatErrorBarProps } from './error-bar';
import { AgnoChatInputArea } from './input';
import type { AgnoChatInputAreaProps } from './input';

// Re-export context hook and type
export { useAgnoChatContext } from './context';
export type { AgnoChatContextValue } from './context';

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

// Compound component type
type AgnoChatComponent = ComponentType<AgnoChatRootProps> & {
  Messages: ComponentType<AgnoChatMessagesProps>;
  EmptyState: ComponentType<AgnoChatEmptyStateProps>;
  SuggestedPrompts: ComponentType<AgnoChatSuggestedPromptsProps>;
  ToolStatus: ComponentType<AgnoChatToolStatusProps>;
  ErrorBar: ComponentType<AgnoChatErrorBarProps>;
  Input: ComponentType<AgnoChatInputAreaProps>;
};

// Static sub-component assignment
const AgnoChat = AgnoChatRoot as unknown as AgnoChatComponent;
AgnoChat.Messages = AgnoChatMessages;
AgnoChat.EmptyState = AgnoChatEmptyState;
AgnoChat.SuggestedPrompts = AgnoChatSuggestedPrompts;
AgnoChat.ToolStatus = AgnoChatToolStatus;
AgnoChat.ErrorBar = AgnoChatErrorBar;
AgnoChat.Input = AgnoChatInputArea;

export { AgnoChat };
