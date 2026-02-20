import { useState } from 'react'
import { AgnoChat } from '@rodrigocoliveira/agno-react/ui'
import type { ToolHandler } from '@rodrigocoliveira/agno-react'
import { SessionSidebar } from '@/components/sessions/SessionSidebar'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { PanelLeftClose, PanelLeftOpen, Zap, Brain, Code2, Sparkles, Rocket, Cat, Copy, ThumbsUp, ThumbsDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { EXAMPLE_GENERATIVE_TOOLS } from '@/tools/exampleGenerativeTools'

const SUGGESTED_PROMPTS = [
  { icon: <Zap className="h-3.5 w-3.5" />, text: "What can you help me with?" },
  { icon: <Brain className="h-3.5 w-3.5" />, text: "Explain how you work" },
  { icon: <Code2 className="h-3.5 w-3.5" />, text: "Show me a code example" },
  { icon: <Sparkles className="h-3.5 w-3.5" />, text: "Surprise me with something creative" },
]

const toolHandlers: Record<string, ToolHandler> = {
  show_alert: async (args: Record<string, any>) => {
    const content = args.content as string
    toast.info('Alert from Agent', { description: content })
    return { success: true, message: 'Alert displayed successfully', content }
  },
  ...EXAMPLE_GENERATIVE_TOOLS,
}

export function ChatComposedPage() {
  const [showSessionSidebar, setShowSessionSidebar] = useState(true)

  return (
    <div className="flex h-full overflow-hidden">
      {/* Session Sidebar - Left (animated width) */}
      <div className={cn(
        "border-r border-border flex flex-col bg-muted/30 transition-all duration-300 ease-in-out overflow-hidden",
        showSessionSidebar ? "w-64" : "w-0 border-r-0"
      )}>
        <div className="w-64 h-full flex flex-col">
          <SessionSidebar />
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Toggle Button */}
        <div className="h-10 border-b border-border flex items-center px-2 shrink-0 bg-background/50">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSessionSidebar(!showSessionSidebar)}
                className="h-7 w-7"
              >
                {showSessionSidebar ? (
                  <PanelLeftClose className="h-4 w-4" />
                ) : (
                  <PanelLeftOpen className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{showSessionSidebar ? 'Hide sessions' : 'Show sessions'}</TooltipContent>
          </Tooltip>
          <span className="text-xs text-muted-foreground ml-2">
            {showSessionSidebar ? 'Sessions' : 'Show sessions sidebar'}
          </span>
        </div>

        {/* Chat Interface — compound component pattern */}
        <div className="flex-1 overflow-hidden">
          <AgnoChat toolHandlers={toolHandlers}>
            <AgnoChat.Messages
              userAvatar={
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-md">
                  <Cat className="h-4 w-4 text-white" />
                </div>
              }
              assistantAvatar={
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md">
                  <Rocket className="h-4 w-4 text-white" />
                </div>
              }
              messageItemProps={{
                classNames: {
                  assistantContainer: 'border-l-2 border-cyan-500/30 pl-3',
                },
                showToolCalls: false,
                showReasoning: false,
                renderActions: (message) => (
                  <>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(message.content || '')
                        toast.success('Copied to clipboard')
                      }}
                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Copy message"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => toast.success('Thanks for the feedback!')}
                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Like message"
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => toast.info('Sorry to hear that. We\'ll improve!')}
                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Dislike message"
                    >
                      <ThumbsDown className="h-3.5 w-3.5" />
                    </button>
                  </>
                ),
              }}
            >
              <AgnoChat.EmptyState>
                <div className="relative">
                  <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center border border-cyan-500/20">
                    <Rocket className="h-10 w-10 text-cyan-500" />
                  </div>
                  <div className="absolute -bottom-1.5 -right-1.5 h-6 w-6 rounded-full bg-green-500 border-2 border-background flex items-center justify-center">
                    <span className="h-2.5 w-2.5 rounded-full bg-white animate-pulse" />
                  </div>
                </div>
                <div className="space-y-2 text-center">
                  <h3 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
                    Chat (Composed)
                  </h3>
                  <p className="text-muted-foreground text-sm max-w-sm">
                    This page uses the <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">AgnoChat</code> compound component with custom avatars, colors, and suggested prompts that actually work in custom empty states.
                  </p>
                </div>
                <AgnoChat.SuggestedPrompts prompts={SUGGESTED_PROMPTS} />
              </AgnoChat.EmptyState>
            </AgnoChat.Messages>

            <AgnoChat.ToolStatus className="bg-violet-500/5 border-violet-500/20" />
            <AgnoChat.ErrorBar className="bg-red-500/5 border-t-2 border-red-500/30" />
            <AgnoChat.Input
              className="bg-muted/30 border-t-2 border-primary/10"
              placeholder="Ask me anything..."
              showAudioRecorder={true}
              audioMode="transcribe"
              transcriptionEndpoint="http://localhost:8000/transcribe"
            />
          </AgnoChat>
        </div>
      </div>
    </div>
  )
}
