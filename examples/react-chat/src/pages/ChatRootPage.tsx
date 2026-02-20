import { useState } from 'react'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { SessionSidebar } from '@/components/sessions/SessionSidebar'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ChatRootPage() {
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

        {/* Chat Interface */}
        <div className="flex-1 overflow-hidden">
          <ChatInterface />
        </div>
      </div>
    </div>
  )
}
