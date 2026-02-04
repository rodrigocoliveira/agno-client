import { useAgnoSession, useAgnoChat } from '@rodrigocoliveira/agno-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { RefreshCw, MessageSquarePlus, Loader2, MessageCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function SessionSidebar() {
  const { sessions, currentSessionId, loadSession, fetchSessions, isLoading } = useAgnoSession()
  const { clearMessages } = useAgnoChat()

  const handleFetchSessions = async () => {
    try {
      await fetchSessions()
      toast.success('Sessions refreshed')
    } catch (err) {
      toast.error('Failed to fetch sessions')
    }
  }

  const handleLoadSession = async (sessionId: string) => {
    try {
      await loadSession(sessionId)
      toast.success('Session loaded')
    } catch (err) {
      console.error(err)
      toast.error('Failed to load session')
    }
  }

  const handleNewChat = () => {
    clearMessages()
    toast.success('Started new chat')
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Sessions</h2>
          <Button
            onClick={handleFetchSessions}
            disabled={isLoading}
            size="icon"
            variant="ghost"
            className="h-7 w-7"
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
        <Button
          onClick={handleNewChat}
          className="w-full justify-start gap-2 h-9"
          size="sm"
          variant="default"
        >
          <MessageSquarePlus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      {/* Sessions List */}
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-0.5 pb-3">
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center gap-2 text-center py-10 px-4">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No sessions yet</p>
              <p className="text-xs text-muted-foreground/70">Start a conversation or click refresh</p>
            </div>
          ) : (
            sessions.map((session) => {
              const isActive = currentSessionId === session.session_id
              return (
                <button
                  key={session.session_id}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-lg transition-all duration-150 group",
                    isActive
                      ? "bg-primary/10 text-foreground"
                      : "hover:bg-muted/70 text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => handleLoadSession(session.session_id)}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {isActive && (
                        <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                      )}
                      <span className={cn(
                        "text-sm truncate flex-1",
                        isActive ? "font-medium" : "font-normal"
                      )}>
                        {session.session_name || session.session_id.slice(0, 12) + '...'}
                      </span>
                    </div>
                    {session.created_at && (
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground/70 pl-0.5">
                        <Clock className="h-3 w-3" />
                        {formatDate(session.created_at)}
                      </div>
                    )}
                  </div>
                </button>
              )
            })
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
