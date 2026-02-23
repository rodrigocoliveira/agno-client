import type { ChatMessage, ToolCall } from '@rodrigocoliveira/agno-types';
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
import type { AgnoMessageClassNames, AgnoMessageAvatars, AgnoMessageActions, SuggestedPrompt } from '../../types';

export interface AgnoChatMessagesProps {
  className?: string;
  renderMessage?: (message: ChatMessage, index: number) => ReactNode;

  /** Grouped avatar configuration */
  avatars?: AgnoMessageAvatars;

  /** Grouped action buttons configuration with visibility control */
  actions?: AgnoMessageActions;

  // ── Message display options ────────────────────────────────────────
  /** Show reasoning steps (default: true) */
  showReasoning?: boolean;
  /** Show references (default: true) */
  showReferences?: boolean;
  /** Show timestamp (default: true) */
  showTimestamp?: boolean;
  /** Show generative UI renders (default: true) */
  showGenerativeUI?: boolean;
  /** Show tool call details (default: true) */
  showToolCalls?: boolean;
  /** Enable file preview cards with click-to-open modal (default: true) */
  showFilePreview?: boolean;
  /** Enable image lightbox on click (default: true) */
  showImageLightbox?: boolean;
  /** Custom render for individual tool calls */
  renderToolCall?: (tool: ToolCall, index: number) => ReactNode;
  /** Custom render for the entire message content area */
  renderContent?: (message: ChatMessage) => ReactNode;
  /** Custom render for media sections */
  renderMedia?: (message: ChatMessage) => ReactNode;
  /** Custom timestamp formatter */
  formatTimestamp?: (date: Date) => string;
  /** ClassNames override map for message item sections */
  messageClassNames?: AgnoMessageClassNames;

  // ── Empty state ──────────────────────────────────────────────────
  emptyState?: ReactNode;
  suggestedPrompts?: SuggestedPrompt[];
  /** Custom empty state via children — takes priority over emptyState prop */
  children?: ReactNode;

  // ── Thinking indicator ───────────────────────────────────────────
  /** Show the thinking indicator while waiting for the first response content (default: true) */
  showThinkingIndicator?: boolean;
  /** Custom component to render instead of the default thinking indicator */
  renderThinkingIndicator?: ReactNode;
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
  avatars,
  actions,
  // Message display options
  showReasoning,
  showReferences,
  showTimestamp,
  showGenerativeUI,
  showToolCalls,
  showFilePreview,
  showImageLightbox,
  renderToolCall,
  renderContent,
  renderMedia,
  formatTimestamp,
  messageClassNames,
  // Empty state
  emptyState,
  suggestedPrompts = DEFAULT_PROMPTS,
  children,
  // Thinking indicator
  showThinkingIndicator = true,
  renderThinkingIndicator,
}: AgnoChatMessagesProps) {
  const { messages, isStreaming } = useAgnoChatContext();
  const lastMessage = messages[messages.length - 1];
  const isThinking = showThinkingIndicator && isStreaming && (!lastMessage || lastMessage.role !== 'user') && !lastMessage?.content;

  // Find the index of the last assistant message (for visibility logic)
  let lastAssistantIndex = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role !== 'user') {
      lastAssistantIndex = i;
      break;
    }
  }

  // Build message item props from direct props
  const messageItemProps: Partial<Omit<AgnoMessageItemProps, 'message'>> = {
    ...(showReasoning !== undefined && { showReasoning }),
    ...(showReferences !== undefined && { showReferences }),
    ...(showTimestamp !== undefined && { showTimestamp }),
    ...(showGenerativeUI !== undefined && { showGenerativeUI }),
    ...(showToolCalls !== undefined && { showToolCalls }),
    ...(showFilePreview !== undefined && { showFilePreview }),
    ...(showImageLightbox !== undefined && { showImageLightbox }),
    ...(renderToolCall !== undefined && { renderToolCall }),
    ...(renderContent !== undefined && { renderContent }),
    ...(renderMedia !== undefined && { renderMedia }),
    ...(formatTimestamp !== undefined && { formatTimestamp }),
    ...(messageClassNames !== undefined && { classNames: messageClassNames }),
  };

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
                avatars={avatars}
                actions={actions}
                isLastAssistantMessage={index === lastAssistantIndex}
                {...messageItemProps}
              />
            );
          })
        )}

        {isThinking && (
          <div className="py-2">
            {renderThinkingIndicator ?? <StreamingIndicator avatar={avatars?.assistant} />}
          </div>
        )}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}
