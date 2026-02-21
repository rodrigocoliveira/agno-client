import { Link } from 'react-router'
import { Code2, Puzzle, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ChatOptionCard {
  title: string
  badge: string
  description: string
  bullets: string[]
  href: string
  icon: React.ElementType
  gradient: string
}

const chatOptions: ChatOptionCard[] = [
  {
    title: 'Hooks API',
    badge: 'Build Your Own',
    description:
      'Full control over your chat UI. Use hooks like useAgnoChat and useAgnoToolExecution to build exactly what you need from scratch.',
    bullets: [
      'Custom message rendering and layout',
      'Direct access to streaming/errors/tools',
      'Bring your own UI components',
    ],
    href: '/chat/hooks',
    icon: Code2,
    gradient: 'from-violet-500 to-fuchsia-500',
  },
  {
    title: 'Compound Components',
    badge: 'Plug & Play',
    description:
      'Get a complete chat UI out of the box. Drop in the <AgnoChat> compound component and customize with props and slots.',
    bullets: [
      'Ready-to-use chat UI in minutes',
      'Customize avatars/themes/actions/empty states',
      'Built-in audio input, file attachments, and tool status',
    ],
    href: '/chat/components',
    icon: Puzzle,
    gradient: 'from-cyan-500 to-blue-600',
  },
]

export function ChatHubPage() {
  return (
    <div className="h-full overflow-auto">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-3 py-8">
          <h1 className="text-3xl font-bold tracking-tight">Choose Your Chat Approach</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Two ways to build a chat UI with Agno — pick the one that fits your needs.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {chatOptions.map((option) => {
            const Icon = option.icon
            return (
              <Link key={option.href} to={option.href} className="block">
                <Card className="h-full transition-all hover:shadow-md hover:border-primary/50 cursor-pointer group">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${option.gradient} flex items-center justify-center`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {option.badge}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg mt-3">{option.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <CardDescription className="text-sm">{option.description}</CardDescription>
                    <ul className="space-y-2">
                      {option.bullets.map((bullet) => (
                        <li key={bullet} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
