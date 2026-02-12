import type { ChatMessage } from '@rodrigocoliveira/agno-types';
import { useAgnoChat } from '../../hooks/useAgnoChat';
import { useAgnoToolExecution } from '../../hooks/useAgnoToolExecution';
import type { ToolHandler } from '../../hooks/useAgnoToolExecution';
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from '../components/conversation';
import { StreamingIndicator } from '../components/streaming-indicator';
import { AgnoMessageItem } from './AgnoMessageItem';
import type { AgnoMessageItemProps } from './AgnoMessageItem';
import { AgnoChatInput } from './AgnoChatInput';
import type { AgnoChatInputProps } from './AgnoChatInput';
import { cn } from '../lib/cn';
import type { AgnoChatInterfaceClassNames, FileUploadConfig, SuggestedPrompt } from '../types';
import { Bot, Loader2, Sparkles, Wrench } from 'lucide-react';
import type { ReactNode } from 'react';

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
  const { messages, sendMessage, isStreaming, error } = useAgnoChat();

  const { isPaused, isExecuting, pendingTools, executionError } = useAgnoToolExecution(
    toolHandlers,
    autoExecuteTools,
  );

  const handleSend = async (message: string | FormData) => {
    try {
      await sendMessage(message);
    } catch {
      // Error is surfaced via the error state
    }
  };

  return (
    <div className={cn('h-full flex flex-col', classNames?.root, className)}>
      {headerSlot}

      {/* Messages area */}
      <Conversation className={cn('relative flex-1 w-full', classNames?.messagesArea)}>
        <ConversationContent className="max-w-3xl mx-auto">
          {messages.length === 0 ? (
            <ConversationEmptyState>
              {emptyState ?? (
                <div className="flex flex-col items-center gap-6">
                  <div className="relative">
                    <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Bot className="h-8 w-8 text-primary" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-green-500 border-2 border-background flex items-center justify-center">
                      <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-2 text-center">
                    <h3 className="text-xl font-semibold tracking-tight">Welcome to Agno Chat</h3>
                    <p className="text-muted-foreground text-sm max-w-sm">
                      Start a conversation with your AI agent. Ask questions, explore ideas, or run tools.
                    </p>
                  </div>
                  {suggestedPrompts.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 w-full max-w-md">
                      {suggestedPrompts.map((prompt, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(prompt.text)}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-card hover:bg-accent/50 hover:border-primary/20 transition-all duration-200 text-left text-sm group"
                        >
                          <span className="text-muted-foreground group-hover:text-primary transition-colors">
                            {prompt.icon}
                          </span>
                          <span className="text-muted-foreground group-hover:text-foreground transition-colors text-xs leading-snug">
                            {prompt.text}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </ConversationEmptyState>
          ) : (
            messages.map((message, index) =>
              renderMessage ? (
                renderMessage(message, index)
              ) : (
                <AgnoMessageItem
                  key={index}
                  message={message}
                  userAvatar={userAvatar}
                  assistantAvatar={assistantAvatar}
                  {...messageItemProps}
                />
              ),
            )
          )}

          {isStreaming && (
            <div className="py-2">
              <StreamingIndicator />
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {/* Tool execution status bar */}
      {(isPaused || isExecuting) && (
        <div className={cn('px-4 py-2.5 border-t border-border bg-primary/5', classNames?.toolStatusBar)}>
          <div className="flex items-center gap-2.5 text-sm max-w-3xl mx-auto">
            {isExecuting ? (
              <>
                <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="h-3 w-3 animate-spin text-primary" />
                </div>
                <span className="text-muted-foreground">
                  Executing{' '}
                  <span className="font-medium text-foreground">{pendingTools.length}</span> tool
                  {pendingTools.length !== 1 ? 's' : ''}...
                </span>
              </>
            ) : (
              <>
                <div className="h-5 w-5 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <Wrench className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-muted-foreground">
                  Preparing{' '}
                  <span className="font-medium text-foreground">{pendingTools.length}</span> tool
                  {pendingTools.length !== 1 ? 's' : ''}...
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Error bar */}
      {(error || executionError) && (
        <div className={cn('px-4 py-2.5 bg-destructive/5 border-t border-destructive/20', classNames?.errorBar)}>
          <p className="text-sm text-destructive max-w-3xl mx-auto">{error || executionError}</p>
        </div>
      )}

      {/* Input area */}
      <div className={cn('border-t border-border bg-background/80 backdrop-blur-sm', classNames?.inputArea)}>
        <div className="max-w-3xl mx-auto px-4 py-3">
          {renderInput ? (
            renderInput({ onSend: handleSend, disabled: isStreaming || isPaused })
          ) : (
            <AgnoChatInput
              onSend={handleSend}
              disabled={isStreaming || isPaused}
              placeholder={placeholder ?? 'Message your agent...'}
              fileUpload={fileUpload}
              showAudioRecorder={showAudioRecorder}
              extraTools={inputToolbarSlot}
              {...chatInputProps}
            />
          )}
        </div>
      </div>
    </div>
  );
}
