import { useState } from 'react'
import { AgnoChatInterface } from '@rodrigocoliveira/agno-react/ui'
import type { ToolHandler } from '@rodrigocoliveira/agno-react'
import { SessionSidebar } from '@/components/sessions/SessionSidebar'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { PanelLeftClose, PanelLeftOpen, Zap, Brain, Code2, Sparkles } from 'lucide-react'
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

export function ChatV2Page() {
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

        {/* Chat Interface (library component) */}
        <div className="flex-1 overflow-hidden">
          <AgnoChatInterface
            toolHandlers={toolHandlers}
            suggestedPrompts={SUGGESTED_PROMPTS}
            placeholder="Message your agent..."
            showAudioRecorder={true}
          />
        </div>
      </div>
    </div>
  )
}
