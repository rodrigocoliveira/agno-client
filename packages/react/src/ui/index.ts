/**
 * @rodrigocoliveira/agno-react/ui
 * Pre-built UI components for Agno chat interfaces
 */

// Utility
export { cn } from './lib/cn';

// Types
export type {
  ToolState,
  FileAttachment,
  ChatStatus,
  SuggestedPrompt,
  FileUploadConfig,
  AgnoChatInterfaceClassNames,
  AgnoMessageItemClassNames,
} from './types';

// ── Primitives ──────────────────────────────────────────────────────────────

export { Button, buttonVariants } from './primitives/button';
export type { ButtonProps } from './primitives/button';

export { Badge, badgeVariants } from './primitives/badge';
export type { BadgeProps } from './primitives/badge';

export { Avatar, AvatarImage, AvatarFallback } from './primitives/avatar';

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
} from './primitives/input-group';

export { Collapsible, CollapsibleTrigger, CollapsibleContent } from './primitives/collapsible';

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './primitives/tooltip';

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './primitives/accordion';

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} from './primitives/dropdown-menu';

export { HoverCard, HoverCardTrigger, HoverCardContent } from './primitives/hover-card';

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from './primitives/select';

export {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from './primitives/command';

// ── Base Components ─────────────────────────────────────────────────────────

// Message
export { Message, MessageContent, MessageAvatar } from './components/message';
export type { MessageProps, MessageContentProps, MessageAvatarProps } from './components/message';

// Conversation
export {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from './components/conversation';
export type {
  ConversationProps,
  ConversationContentProps,
  ConversationEmptyStateProps,
  ConversationScrollButtonProps,
} from './components/conversation';

// Response (markdown renderer)
export { Response } from './components/response';

// Tool
export { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from './components/tool';
export type {
  ToolProps,
  ToolHeaderProps,
  ToolContentProps,
  ToolInputProps,
  ToolOutputProps,
} from './components/tool';

// Code Block
export { CodeBlock, CodeBlockCopyButton } from './components/code-block';
export type { CodeBlockCopyButtonProps } from './components/code-block';

// Artifact
export {
  Artifact,
  ArtifactHeader,
  ArtifactClose,
  ArtifactTitle,
  ArtifactDescription,
  ArtifactActions,
  ArtifactAction,
  ArtifactContent,
} from './components/artifact';
export type {
  ArtifactProps,
  ArtifactHeaderProps,
  ArtifactCloseProps,
  ArtifactTitleProps,
  ArtifactDescriptionProps,
  ArtifactActionsProps,
  ArtifactActionProps,
  ArtifactContentProps,
} from './components/artifact';

// Streaming Indicator
export { StreamingIndicator } from './components/streaming-indicator';
export type { StreamingIndicatorProps } from './components/streaming-indicator';

// Audio Recorder
export { AudioRecorder } from './components/audio-recorder';
export type { AudioRecorderProps } from './components/audio-recorder';

// ── Prompt Input (composable) ───────────────────────────────────────────────

export {
  // Context & hooks
  usePromptInputController,
  usePromptInputAttachments,
  useProviderAttachments,
  // Provider
  PromptInputProvider,
  // Main form
  PromptInput,
  // Textarea
  PromptInputTextarea,
  // Attachments
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputActionAddAttachments,
  // Layout
  PromptInputBody,
  PromptInputHeader,
  PromptInputFooter,
  PromptInputTools,
  // Buttons
  PromptInputButton,
  PromptInputSubmit,
  PromptInputActionMenu,
  PromptInputActionMenuTrigger,
  PromptInputActionMenuContent,
  PromptInputActionMenuItem,
  // Speech
  PromptInputSpeechButton,
  // Model select
  PromptInputModelSelect,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectValue,
  // Tabs
  PromptInputTabsList,
  PromptInputTab,
  PromptInputTabLabel,
  PromptInputTabBody,
  PromptInputTabItem,
  // Command
  PromptInputCommand,
  PromptInputCommandInput,
  PromptInputCommandList,
  PromptInputCommandEmpty,
  PromptInputCommandGroup,
  PromptInputCommandItem,
  PromptInputCommandSeparator,
} from './components/prompt-input';

export type {
  AttachmentsContext,
  TextInputContext,
  PromptInputControllerProps,
  PromptInputProviderProps,
  PromptInputProps,
  PromptInputMessage,
  PromptInputTextareaProps,
  PromptInputAttachmentProps,
  PromptInputAttachmentsProps,
  PromptInputActionAddAttachmentsProps,
  PromptInputBodyProps,
  PromptInputHeaderProps,
  PromptInputFooterProps,
  PromptInputToolsProps,
  PromptInputButtonProps,
  PromptInputSubmitProps,
  PromptInputActionMenuProps,
  PromptInputActionMenuTriggerProps,
  PromptInputActionMenuContentProps,
  PromptInputActionMenuItemProps,
  PromptInputSpeechButtonProps,
  PromptInputModelSelectProps,
  PromptInputModelSelectTriggerProps,
  PromptInputModelSelectContentProps,
  PromptInputModelSelectItemProps,
  PromptInputModelSelectValueProps,
  PromptInputTabsListProps,
  PromptInputTabProps,
  PromptInputTabLabelProps,
  PromptInputTabBodyProps,
  PromptInputTabItemProps,
  PromptInputCommandProps,
  PromptInputCommandInputProps,
  PromptInputCommandListProps,
  PromptInputCommandEmptyProps,
  PromptInputCommandGroupProps,
  PromptInputCommandItemProps,
  PromptInputCommandSeparatorProps,
} from './components/prompt-input';

// ── Composed Components ─────────────────────────────────────────────────────

export { AgnoChatInterface } from './composed/AgnoChatInterface';
export type { AgnoChatInterfaceProps } from './composed/AgnoChatInterface';

export { AgnoMessageItem } from './composed/AgnoMessageItem';
export type { AgnoMessageItemProps } from './composed/AgnoMessageItem';

export { AgnoChatInput } from './composed/AgnoChatInput';
export type { AgnoChatInputProps } from './composed/AgnoChatInput';
