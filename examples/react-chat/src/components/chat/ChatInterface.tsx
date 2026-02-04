import { Conversation, ConversationContent, ConversationEmptyState, ConversationScrollButton } from '@/components/ai-elements/conversation'
import { useAgnoChat, useAgnoToolExecution, type ToolHandler } from '@rodrigocoliveira/agno-react'
import { Bot, Loader2, Sparkles, Wrench, Zap, Brain, Code2 } from 'lucide-react'
import { toast } from 'sonner'
import { ChatInput } from './ChatInput'
import { MessageItem } from './MessageItem'
import { StreamingIndicator } from './StreamingIndicator'
import { EXAMPLE_GENERATIVE_TOOLS } from '@/tools/exampleGenerativeTools'

const SUGGESTED_PROMPTS = [
  { icon: <Zap className="h-3.5 w-3.5" />, text: "What can you help me with?" },
  { icon: <Brain className="h-3.5 w-3.5" />, text: "Explain how you work" },
  { icon: <Code2 className="h-3.5 w-3.5" />, text: "Show me a code example" },
  { icon: <Sparkles className="h-3.5 w-3.5" />, text: "Surprise me with something creative" },
]

export function ChatInterface() {
  const { messages, sendMessage, isStreaming, error } = useAgnoChat()

  // Combine example generative tools with other tool handlers
  const toolHandlers: Record<string, ToolHandler> = {
    // Example: show alert (legacy tool)
    show_alert: async (args: Record<string, any>) => {
      const content = args.content as string

      // Also show as toast notification
      toast.info('Alert from Agent', {
        description: content,
      })

      return {
        success: true,
        message: 'Alert displayed successfully',
        content: content,
      }
    },

    // Add all generative UI example tools
    ...EXAMPLE_GENERATIVE_TOOLS,
  }

  // Use tool execution hook with auto-execution enabled
  const {
    isPaused,
    isExecuting,
    pendingTools,
    executionError,
  } = useAgnoToolExecution(toolHandlers, true)

  const handleSend = async (message: string | FormData) => {
    try {
      await sendMessage(message)
    } catch (err) {
      toast.error(`Failed to send message: ${error || err}`)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Messages area - flex-1 fills remaining space */}
      <Conversation className="relative flex-1 w-full">
        <ConversationContent className="max-w-3xl mx-auto">
          {messages.length === 0 ? (
            <ConversationEmptyState>
              <div className="flex flex-col items-center gap-6 animate-fade-in-up">
                {/* Logo / Icon */}
                <div className="relative">
                  <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Bot className="h-8 w-8 text-primary" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-green-500 border-2 border-background flex items-center justify-center">
                    <span className="h-2 w-2 rounded-full bg-white animate-pulse-glow" />
                  </div>
                </div>

                {/* Welcome text */}
                <div className="space-y-2 text-center">
                  <h3 className="text-xl font-semibold tracking-tight">Welcome to Agno Chat</h3>
                  <p className="text-muted-foreground text-sm max-w-sm">
                    Start a conversation with your AI agent. Ask questions, explore ideas, or run tools.
                  </p>
                </div>

                {/* Suggested prompts */}
                <div className="grid grid-cols-2 gap-2 w-full max-w-md">
                  {SUGGESTED_PROMPTS.map((prompt, idx) => (
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
              </div>
            </ConversationEmptyState>
          ) : (
            messages.map((message, index) => (
              <MessageItem key={index} message={message} />
            ))
          )}

          {/* Streaming indicator inline at bottom of messages */}
          {isStreaming && (
            <div className="py-2 animate-message-in">
              <StreamingIndicator />
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {/* Tool execution status bar */}
      {(isPaused || isExecuting) && (
        <div className="px-4 py-2.5 border-t border-border bg-primary/5">
          <div className="flex items-center gap-2.5 text-sm max-w-3xl mx-auto">
            {isExecuting ? (
              <>
                <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="h-3 w-3 animate-spin text-primary" />
                </div>
                <span className="text-muted-foreground">
                  Executing <span className="font-medium text-foreground">{pendingTools.length}</span> tool{pendingTools.length !== 1 ? 's' : ''}...
                </span>
              </>
            ) : (
              <>
                <div className="h-5 w-5 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <Wrench className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-muted-foreground">
                  Preparing <span className="font-medium text-foreground">{pendingTools.length}</span> tool{pendingTools.length !== 1 ? 's' : ''}...
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Error bar */}
      {(error || executionError) && (
        <div className="px-4 py-2.5 bg-destructive/5 border-t border-destructive/20">
          <p className="text-sm text-destructive max-w-3xl mx-auto">
            {error || executionError}
          </p>
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <ChatInput
            onSend={handleSend}
            disabled={isStreaming || isPaused}
            placeholder="Message your agent..."
          />
        </div>
      </div>
    </div>
  )
}
