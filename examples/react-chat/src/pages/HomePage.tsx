import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useAgnoClient } from '@rodrigocoliveira/agno-react'
import {
  MessageSquare,
  History,
  Brain,
  Database,
  BarChart3,
  FlaskConical,
  Activity,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface FeatureCardProps {
  title: string
  description: string
  icon: React.ElementType
  href: string
  status?: 'ready' | 'loading' | 'error'
}

function FeatureCard({ title, description, icon: Icon, href, status = 'ready' }: FeatureCardProps) {
  return (
    <Link to={href} className="block">
      <Card className="h-full transition-all hover:shadow-md hover:border-primary/50 cursor-pointer group">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className={cn(
              "h-10 w-10 rounded-lg flex items-center justify-center transition-colors",
              "bg-primary/10 group-hover:bg-primary/20"
            )}>
              <Icon className="h-5 w-5 text-primary" />
            </div>
            {status === 'loading' && (
              <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
            )}
            {status === 'ready' && (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            )}
            {status === 'error' && (
              <XCircle className="h-4 w-4 text-destructive" />
            )}
          </div>
          <CardTitle className="text-lg mt-3">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-sm">{description}</CardDescription>
        </CardContent>
      </Card>
    </Link>
  )
}

export function HomePage() {
  const client = useAgnoClient()
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'connecting'>('connecting')
  const [stats, setStats] = useState({
    agents: 0,
    teams: 0,
    sessions: 0,
  })

  useEffect(() => {
    const handleState = () => {
      const state = client.getState()
      setConnectionStatus(state.isEndpointActive ? 'online' : 'offline')
      setStats({
        agents: state.agents.length,
        teams: state.teams.length,
        sessions: state.sessions.length,
      })
    }

    client.on('state:change', handleState)
    handleState()

    return () => {
      client.off('state:change', handleState)
    }
  }, [client])

  const features: FeatureCardProps[] = [
    {
      title: 'Chat',
      description: 'Interactive chat interface with streaming support, tool execution, and media attachments.',
      icon: MessageSquare,
      href: '/chat',
      status: connectionStatus === 'online' ? 'ready' : connectionStatus === 'connecting' ? 'loading' : 'error',
    },
    {
      title: 'Sessions',
      description: 'Manage conversation sessions - create, load, rename, and delete sessions.',
      icon: History,
      href: '/sessions',
      status: connectionStatus === 'online' ? 'ready' : connectionStatus === 'connecting' ? 'loading' : 'error',
    },
    {
      title: 'Memory',
      description: 'User memory management - create, update, and delete memories with topic organization.',
      icon: Brain,
      href: '/memory',
      status: connectionStatus === 'online' ? 'ready' : connectionStatus === 'connecting' ? 'loading' : 'error',
    },
    {
      title: 'Knowledge',
      description: 'Knowledge base management - upload documents, search content, and configure RAG.',
      icon: Database,
      href: '/knowledge',
      status: connectionStatus === 'online' ? 'ready' : connectionStatus === 'connecting' ? 'loading' : 'error',
    },
    {
      title: 'Metrics',
      description: 'View aggregated metrics - token usage, runs, sessions, and model performance.',
      icon: BarChart3,
      href: '/metrics',
      status: connectionStatus === 'online' ? 'ready' : connectionStatus === 'connecting' ? 'loading' : 'error',
    },
    {
      title: 'Evaluations',
      description: 'Run and manage evaluations - accuracy, reliability, and agent-as-judge tests.',
      icon: FlaskConical,
      href: '/evals',
      status: connectionStatus === 'online' ? 'ready' : connectionStatus === 'connecting' ? 'loading' : 'error',
    },
    {
      title: 'Traces',
      description: 'View execution traces with span-level detail for debugging and monitoring.',
      icon: Activity,
      href: '/traces',
      status: connectionStatus === 'online' ? 'ready' : connectionStatus === 'connecting' ? 'loading' : 'error',
    },
  ]

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4 py-8">
          <h1 className="text-4xl font-bold tracking-tight">Agno Client API Demo</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A comprehensive demonstration of all Agno client APIs. Explore chat, sessions, memory, knowledge, metrics, evaluations, and traces.
          </p>

          {/* Connection Status */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <Badge variant={connectionStatus === 'online' ? 'default' : 'secondary'} className={cn(
              connectionStatus === 'online' && 'bg-green-500/10 text-green-600 border-green-500/20',
              connectionStatus === 'offline' && 'bg-red-500/10 text-red-600 border-red-500/20',
              connectionStatus === 'connecting' && 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
            )}>
              <span className={cn(
                "h-2 w-2 rounded-full mr-2",
                connectionStatus === 'online' && 'bg-green-500',
                connectionStatus === 'offline' && 'bg-red-500',
                connectionStatus === 'connecting' && 'bg-yellow-500 animate-pulse'
              )} />
              {connectionStatus === 'online' ? 'Connected' : connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
            </Badge>

            {connectionStatus === 'online' && (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>{stats.agents} agents</span>
                <span className="text-muted-foreground/50">|</span>
                <span>{stats.teams} teams</span>
                <span className="text-muted-foreground/50">|</span>
                <span>{stats.sessions} sessions</span>
              </div>
            )}
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature) => (
            <FeatureCard key={feature.href} {...feature} />
          ))}
        </div>

        {/* API Documentation Link */}
        <div className="text-center py-8 border-t border-border">
          <p className="text-sm text-muted-foreground">
            This demo showcases the{' '}
            <a
              href="https://docs.agno.com/reference-api/overview"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Agno API
            </a>{' '}
            using the{' '}
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">@rodrigocoliveira/agno-client</code>{' '}
            library.
          </p>
        </div>
      </div>
    </div>
  )
}
