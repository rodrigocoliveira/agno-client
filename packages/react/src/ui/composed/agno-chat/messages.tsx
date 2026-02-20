import type { ChatMessage } from '@rodrigocoliveira/agno-types';
import { useEffect, useRef, type ReactNode } from 'react';
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
  useStickToBottomContext,
} from '../../components/conversation';
import { StreamingIndicator } from '../../components/streaming-indicator';
import { AgnoMessageItem } from '../AgnoMessageItem';
import type { AgnoMessageItemProps } from '../AgnoMessageItem';
import { AgnoChatSuggestedPrompts } from './suggested-prompts';
import { useAgnoChatContext } from './context';
import { cn } from '../../lib/cn';
import { Bot } from 'lucide-react';
import type { SuggestedPrompt } from '../../types';

export interface AgnoChatMessagesProps {
  className?: string;
  renderMessage?: (message: ChatMessage, index: number) => ReactNode;
  userAvatar?: ReactNode;
  assistantAvatar?: ReactNode;
  messageItemProps?: Partial<Omit<AgnoMessageItemProps, 'message'>>;
  emptyState?: ReactNode;
  suggestedPrompts?: SuggestedPrompt[];
  /** Custom empty state via children — takes priority over emptyState prop */
  children?: ReactNode;
}

/** Scrolls to bottom only when the user sends a new message */
function ScrollOnNewUserMessage({ messageCount }: { messageCount: number }) {
  const { scrollToBottom } = useStickToBottomContext();
  const prevCount = useRef(messageCount);

  useEffect(() => {
    if (messageCount > prevCount.current) {
      scrollToBottom('smooth');
    }
    prevCount.current = messageCount;
  }, [messageCount, scrollToBottom]);

  return null;
}

const DEFAULT_PROMPTS: SuggestedPrompt[] = [
  { text: 'What can you help me with?' },
  { text: 'Explain how you work' },
];

export function AgnoChatMessages({
  className,
  renderMessage,
  userAvatar,
  assistantAvatar,
  messageItemProps,
  emptyState,
  suggestedPrompts = DEFAULT_PROMPTS,
  children,
}: AgnoChatMessagesProps) {
  const { messages, isStreaming } = useAgnoChatContext();
  const lastMessage = messages[messages.length - 1];
  const isThinking = isStreaming && (!lastMessage || lastMessage.role !== 'user') && !lastMessage?.content;

  const resolvedEmptyState = children ??
    emptyState ?? (
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
        {suggestedPrompts.length > 0 && <AgnoChatSuggestedPrompts prompts={suggestedPrompts} />}
      </div>
    );

  return (
    <Conversation className={cn('relative flex-1 w-full', className)}>
      <ScrollOnNewUserMessage messageCount={messages.length} />
      <ConversationContent className="max-w-3xl mx-auto">
        {messages.length === 0 ? (
          <ConversationEmptyState>{resolvedEmptyState}</ConversationEmptyState>
        ) : (
          messages.map((message, index) => {
            // Hide the empty placeholder while the thinking indicator is shown
            if (isThinking && index === messages.length - 1 && message === lastMessage) return null;
            return renderMessage ? (
              renderMessage(message, index)
            ) : (
              <AgnoMessageItem
                key={`msg-${index}-${message.created_at}`}
                message={message}
                userAvatar={userAvatar}
                assistantAvatar={assistantAvatar}
                {...messageItemProps}
              />
            );
          })
        )}

        {isThinking && (
          <div className="py-2">
            <StreamingIndicator />
          </div>
        )}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}
