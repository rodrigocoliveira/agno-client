// Context & hooks
export {
  usePromptInputController,
  usePromptInputAttachments,
  useProviderAttachments,
  usePromptInputDropZone,
} from './context';
export type { AttachmentsContext, TextInputContext, PromptInputControllerProps, DropZoneContextValue } from './context';

// Provider
export { PromptInputProvider } from './provider';
export type { PromptInputProviderProps } from './provider';

// Main form
export { PromptInput } from './prompt-input';
export type { PromptInputProps, PromptInputMessage } from './prompt-input';

// Textarea
export { PromptInputTextarea } from './textarea';
export type { PromptInputTextareaProps } from './textarea';

// Attachments
export { PromptInputAttachment, PromptInputAttachments, PromptInputActionAddAttachments } from './attachments';
export type {
  PromptInputAttachmentProps,
  PromptInputAttachmentsProps,
  PromptInputActionAddAttachmentsProps,
} from './attachments';

// Layout
export { PromptInputBody, PromptInputHeader, PromptInputFooter, PromptInputTools } from './footer';
export type {
  PromptInputBodyProps,
  PromptInputHeaderProps,
  PromptInputFooterProps,
  PromptInputToolsProps,
} from './footer';

// Buttons
export {
  PromptInputButton,
  PromptInputSubmit,
  PromptInputActionMenu,
  PromptInputActionMenuTrigger,
  PromptInputActionMenuContent,
  PromptInputActionMenuItem,
} from './buttons';
export type {
  PromptInputButtonProps,
  PromptInputSubmitProps,
  PromptInputActionMenuProps,
  PromptInputActionMenuTriggerProps,
  PromptInputActionMenuContentProps,
  PromptInputActionMenuItemProps,
} from './buttons';

// Drop zone
export { PromptInputDropZone } from './drop-zone';
export type { PromptInputDropZoneProps } from './drop-zone';

// Speech
export { PromptInputSpeechButton } from './speech';
export type { PromptInputSpeechButtonProps } from './speech';

// Model select
export {
  PromptInputModelSelect,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectValue,
} from './model-select';
export type {
  PromptInputModelSelectProps,
  PromptInputModelSelectTriggerProps,
  PromptInputModelSelectContentProps,
  PromptInputModelSelectItemProps,
  PromptInputModelSelectValueProps,
} from './model-select';

// Tabs
export {
  PromptInputTabsList,
  PromptInputTab,
  PromptInputTabLabel,
  PromptInputTabBody,
  PromptInputTabItem,
} from './tabs';
export type {
  PromptInputTabsListProps,
  PromptInputTabProps,
  PromptInputTabLabelProps,
  PromptInputTabBodyProps,
  PromptInputTabItemProps,
} from './tabs';

// Command
export {
  PromptInputCommand,
  PromptInputCommandInput,
  PromptInputCommandList,
  PromptInputCommandEmpty,
  PromptInputCommandGroup,
  PromptInputCommandItem,
  PromptInputCommandSeparator,
} from './command';
export type {
  PromptInputCommandProps,
  PromptInputCommandInputProps,
  PromptInputCommandListProps,
  PromptInputCommandEmptyProps,
  PromptInputCommandGroupProps,
  PromptInputCommandItemProps,
  PromptInputCommandSeparatorProps,
} from './command';
