import type { ReactNode } from 'react';
import type { ChatMessage } from '@rodrigocoliveira/agno-types';
import type { ToolHandler } from '@rodrigocoliveira/agno-react';
import type { AgnoChatInterfaceClassNames, FileUploadConfig, SuggestedPrompt } from '../types';
import type { AgnoMessageItemProps } from './AgnoMessageItem';
import type { AgnoChatInputProps } from './AgnoChatInput';
import { AgnoChat } from './agno-chat';
import { cn } from '../lib/cn';
import { Bot, Sparkles } from 'lucide-react';

export interface AgnoChatInterfaceProps {
  className?: string;
  classNames?: AgnoChatInterfaceClassNames;
  /** Custom render for individual messages */
  renderMessage?: (message: ChatMessage, index: number) => ReactNode;
  /** Custom render for the input area */
  renderInput?: (props: { onSend: (msg: string | FormData) => void; disabled: boolean }) => ReactNode;
  /** Custom empty state content */
  emptyState?: ReactNode;
  /** Slot: content above the messages area */
  headerSlot?: ReactNode;
  /** Slot: extra buttons in the input toolbar */
  inputToolbarSlot?: ReactNode;
  /** Suggested prompts for empty state */
  suggestedPrompts?: SuggestedPrompt[];
  /** Tool handlers for HITL execution */
  toolHandlers?: Record<string, ToolHandler>;
  /** Auto-execute tools (default: true) */
  autoExecuteTools?: boolean;
  /** Input placeholder */
  placeholder?: string;
  /** Custom user avatar */
  userAvatar?: ReactNode;
  /** Custom assistant avatar */
  assistantAvatar?: ReactNode;
  /** File upload config */
  fileUpload?: FileUploadConfig;
  /** Show audio recorder (default: true) */
  showAudioRecorder?: boolean;
  /** Props forwarded to AgnoMessageItem */
  messageItemProps?: Partial<Omit<AgnoMessageItemProps, 'message'>>;
  /** Props forwarded to AgnoChatInput */
  chatInputProps?: Partial<Omit<AgnoChatInputProps, 'onSend'>>;
}

const DEFAULT_PROMPTS: SuggestedPrompt[] = [
  { icon: <Sparkles className="h-3.5 w-3.5" />, text: 'What can you help me with?' },
  { icon: <Bot className="h-3.5 w-3.5" />, text: 'Explain how you work' },
];

export function AgnoChatInterface({
  className,
  classNames,
  renderMessage,
  renderInput,
  emptyState,
  headerSlot,
  inputToolbarSlot,
  suggestedPrompts = DEFAULT_PROMPTS,
  toolHandlers = {},
  autoExecuteTools = true,
  placeholder,
  userAvatar,
  assistantAvatar,
  fileUpload,
  showAudioRecorder = true,
  messageItemProps,
  chatInputProps,
}: AgnoChatInterfaceProps) {
  return (
    <AgnoChat
      toolHandlers={toolHandlers}
      autoExecuteTools={autoExecuteTools}
      className={cn(classNames?.root, className)}
    >
      {headerSlot}

      <AgnoChat.Messages
        className={classNames?.messagesArea}
        renderMessage={renderMessage}
        userAvatar={userAvatar}
        assistantAvatar={assistantAvatar}
        messageItemProps={messageItemProps}
        emptyState={emptyState}
        suggestedPrompts={suggestedPrompts}
      />

      <AgnoChat.ToolStatus className={classNames?.toolStatusBar} />
      <AgnoChat.ErrorBar className={classNames?.errorBar} />

      <AgnoChat.Input
        className={classNames?.inputArea}
        placeholder={placeholder}
        fileUpload={fileUpload}
        showAudioRecorder={showAudioRecorder}
        extraTools={inputToolbarSlot}
        chatInputProps={chatInputProps}
      >
        {renderInput
          ? ({ onSend, disabled }) => renderInput({ onSend, disabled })
          : undefined}
      </AgnoChat.Input>
    </AgnoChat>
  );
}
