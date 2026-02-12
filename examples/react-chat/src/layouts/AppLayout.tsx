import { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router'
import { AgnoProvider, useAgnoActions, useAgnoClient } from '@rodrigocoliveira/agno-react'
import { AgnoClientConfig } from '@rodrigocoliveira/agno-types'
import { Toaster } from '@/components/ui/sonner'
import { ConfigPanel } from '@/components/config/ConfigPanel'
import { StateInspector } from '@/components/debug/StateInspector'
import { registerGenerativeUIComponents } from '@/components/generative-ui'
import {
  Bot,
  MessageSquare,
  History,
  Brain,
  Database,
  BarChart3,
  FlaskConical,
  Activity,
  Moon,
  Sun,
  PanelRightClose,
  PanelRightOpen,
  Home,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'

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
 * Load initial config from environment variables
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
 * Auto-initializes the Agno client on mount
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
 * Connection status indicator
 */
function ConnectionStatus() {
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
        <span className="text-sm font-semibold leading-none">Agno Demo</span>
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

/**
 * Navigation items configuration
 */
const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/chat', label: 'Chat', icon: MessageSquare },
  { path: '/chat-v2', label: 'Chat v2', icon: MessageSquare },
  { path: '/sessions', label: 'Sessions', icon: History },
  { path: '/memory', label: 'Memory', icon: Brain },
  { path: '/knowledge', label: 'Knowledge', icon: Database },
  { path: '/metrics', label: 'Metrics', icon: BarChart3 },
  { path: '/evals', label: 'Evaluations', icon: FlaskConical },
  { path: '/traces', label: 'Traces', icon: Activity },
]

/**
 * Sidebar navigation component
 */
function Sidebar() {
  const location = useLocation()

  return (
    <div className="flex flex-col h-full py-4">
      <div className="px-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <Bot className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm">Agno Client</span>
            <span className="text-[10px] text-muted-foreground">API Demo</span>
          </div>
        </div>
      </div>

      <Separator className="mb-2" />

      <ScrollArea className="flex-1 px-2">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  isActive && "bg-accent text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
      </ScrollArea>
    </div>
  )
}

/**
 * Main content area with sidebar and header
 */
function MainLayout() {
  const [showConfigPanel, setShowConfigPanel] = useState(false)
  const location = useLocation()

  // Register generative UI components on mount
  useEffect(() => {
    registerGenerativeUIComponents()
  }, [])

  // Get current page title
  const currentPage = navItems.find(item => item.path === location.pathname)
  const pageTitle = currentPage?.label || 'Agno Demo'

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-screen bg-background text-foreground overflow-hidden">
        {/* Sidebar - Left */}
        <div className="w-56 border-r border-border flex flex-col bg-muted/30 shrink-0">
          <Sidebar />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Header */}
          <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-background/80 backdrop-blur-sm shrink-0">
            <div className="flex items-center gap-3">
              <ConnectionStatus />
              <Separator orientation="vertical" className="h-5" />
              <h1 className="text-sm font-medium text-muted-foreground">{pageTitle}</h1>
            </div>

            <div className="flex items-center gap-1">
              <ThemeToggle />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={showConfigPanel ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => setShowConfigPanel(!showConfigPanel)}
                    className="h-8 w-8"
                  >
                    {showConfigPanel ? (
                      <PanelRightClose className="h-4 w-4" />
                    ) : (
                      <PanelRightOpen className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{showConfigPanel ? 'Hide settings' : 'Show settings'}</TooltipContent>
              </Tooltip>
            </div>
          </header>

          {/* Page Content */}
          <div className="flex-1 overflow-hidden">
            <Outlet />
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
  )
}

/**
 * App layout with AgnoProvider wrapper
 */
export function AppLayout() {
  return (
    <AgnoProvider config={INITIAL_CONFIG}>
      <AutoInitializer />
      <MainLayout />
      <Toaster />
    </AgnoProvider>
  )
}
