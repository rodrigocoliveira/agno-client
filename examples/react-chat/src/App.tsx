import { AgnoProvider, useAgnoActions, useAgnoClient } from '@rodrigocoliveira/agno-react'
import { AgnoClientConfig } from '@rodrigocoliveira/agno-types'
import { Toaster } from '@/components/ui/sonner'
import { ConfigPanel } from '@/components/config/ConfigPanel'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { SessionSidebar } from '@/components/sessions/SessionSidebar'
import { StateInspector } from '@/components/debug/StateInspector'
import { useState, useEffect, useRef } from 'react'
import { PanelLeftClose, PanelLeftOpen, Settings, Moon, Sun, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { registerGenerativeUIComponents } from '@/components/generative-ui'
import { cn } from '@/lib/utils'

/**
 * Validate mode from environment variable
 */
function validateMode(value: unknown): 'agent' | 'team' {
  if (value === 'agent' || value === 'team') {
    return value
  }
  if (value) {
    console.warn(`Invalid mode: ${value}, defaulting to 'agent'`)
  }
  return 'agent'
}

/**
 * Load initial config from environment variables (created once, outside component)
 */
const INITIAL_CONFIG: AgnoClientConfig = {
  endpoint: import.meta.env.VITE_AGNO_ENDPOINT || 'http://localhost:7777',
  authToken: import.meta.env.VITE_AGNO_AUTH_TOKEN || undefined,
  mode: validateMode(import.meta.env.VITE_AGNO_MODE),
  agentId: import.meta.env.VITE_AGNO_AGENT_ID || undefined,
  teamId: import.meta.env.VITE_AGNO_TEAM_ID || undefined,
  dbId: import.meta.env.VITE_AGNO_DB_ID || undefined,
}

/**
 * Auto-initializes the Agno client on mount.
 * Must be rendered inside AgnoProvider so hooks have access to the client.
 */
function AutoInitializer() {
  const { initialize } = useAgnoActions()
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    initialize()
  }, [])

  return null
}

/**
 * Theme toggle button
 */
function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark')
    }
    return false
  })

  const toggle = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  useEffect(() => {
    const stored = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const shouldBeDark = stored === 'dark' || (!stored && prefersDark)
    setDark(shouldBeDark)
    document.documentElement.classList.toggle('dark', shouldBeDark)
  }, [])

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" onClick={toggle} className="h-8 w-8">
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{dark ? 'Light mode' : 'Dark mode'}</TooltipContent>
    </Tooltip>
  )
}

/**
 * Agent status indicator in header
 */
function AgentStatus() {
  const client = useAgnoClient()
  const [status, setStatus] = useState<'online' | 'offline' | 'unknown'>('unknown')

  useEffect(() => {
    const handleState = () => {
      const state = client.getState()
      if (state.isEndpointActive) {
        setStatus('online')
      } else {
        setStatus('unknown')
      }
    }
    client.on('state:change', handleState)
    handleState()
    return () => { client.off('state:change', handleState) }
  }, [client])

  return (
    <div className="flex items-center gap-2">
      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
        <Bot className="h-4 w-4 text-primary" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-semibold leading-none">Agno Chat</span>
        <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
          <span className={cn(
            "h-1.5 w-1.5 rounded-full",
            status === 'online' ? 'bg-green-500' : status === 'offline' ? 'bg-red-500' : 'bg-muted-foreground/50'
          )} />
          {status === 'online' ? 'Connected' : status === 'offline' ? 'Disconnected' : 'Connecting...'}
        </span>
      </div>
    </div>
  )
}

function App() {
  const [showSessionSidebar, setShowSessionSidebar] = useState(true)
  const [showConfigPanel, setShowConfigPanel] = useState(false)

  // Register generative UI components on mount
  useEffect(() => {
    registerGenerativeUIComponents()
  }, [])

  return (
    <AgnoProvider config={INITIAL_CONFIG}>
      <AutoInitializer />
      <TooltipProvider delayDuration={300}>
        <div className="flex h-screen bg-background text-foreground overflow-hidden">
          {/* Session Sidebar - Left (animated width) */}
          <div className={cn(
            "border-r border-border flex flex-col bg-muted/30 transition-all duration-300 ease-in-out overflow-hidden",
            showSessionSidebar ? "w-64" : "w-0 border-r-0"
          )}>
            <div className="w-64 h-full flex flex-col">
              <SessionSidebar />
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            {/* Header */}
            <header className="h-14 border-b border-border flex items-center justify-between px-3 bg-background/80 backdrop-blur-sm flex-shrink-0">
              <div className="flex items-center gap-1.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowSessionSidebar(!showSessionSidebar)}
                      className="h-8 w-8"
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

                <Separator orientation="vertical" className="h-5 mx-1" />
                <AgentStatus />
              </div>

              <div className="flex items-center gap-0.5">
                <ThemeToggle />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={showConfigPanel ? "secondary" : "ghost"}
                      size="icon"
                      onClick={() => setShowConfigPanel(!showConfigPanel)}
                      className="h-8 w-8"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{showConfigPanel ? 'Hide settings' : 'Show settings'}</TooltipContent>
                </Tooltip>
              </div>
            </header>

            {/* Chat Interface */}
            <div className="flex-1 overflow-hidden">
              <ChatInterface />
            </div>
          </div>

          {/* Config & Debug Panel - Right (animated width) */}
          <div className={cn(
            "border-l border-border flex flex-col bg-muted/20 transition-all duration-300 ease-in-out overflow-hidden",
            showConfigPanel ? "w-96" : "w-0 border-l-0"
          )}>
            <div className="w-96 h-full overflow-auto">
              <ConfigPanel />
              <Separator className="my-4" />
              <StateInspector />
            </div>
          </div>
        </div>
      </TooltipProvider>

      {/* Toast notifications */}
      <Toaster />
    </AgnoProvider>
  )
}

export default App
