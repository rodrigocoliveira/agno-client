import { useState, useRef, useCallback } from 'react'
import type { ReactNode } from 'react'
import { AgnoChat, BarChart, LineChart, AreaChart, PieChart, CardGrid } from '@rodrigocoliveira/agno-react/ui'
import { byToolName } from '@rodrigocoliveira/agno-react'
import type { ToolHandler, RenderTool } from '@rodrigocoliveira/agno-react'
import type { ToolCall } from '@rodrigocoliveira/agno-types'
import { SessionSidebar } from '@/components/sessions/SessionSidebar'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { PanelLeftClose, PanelLeftOpen, Zap, Brain, Code2, Sparkles, Rocket, Cat, Copy, ThumbsUp, ThumbsDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { EXAMPLE_GENERATIVE_TOOLS } from '@/tools/exampleGenerativeTools'
import { AskUserQuestionModal, AnswerBubble } from '@/tools/askUserQuestion'
import { ShowAlertCard } from '@/tools/prettyToolRenderers'

const SUGGESTED_PROMPTS = [
  { icon: <Zap className="h-3.5 w-3.5" />, text: "What can you help me with?" },
  { icon: <Brain className="h-3.5 w-3.5" />, text: "Explain how you work" },
  { icon: <Code2 className="h-3.5 w-3.5" />, text: "Show me a code example" },
  { icon: <Sparkles className="h-3.5 w-3.5" />, text: "Surprise me with something creative" },
]

export function ChatComponentsPage() {
  const [showSessionSidebar, setShowSessionSidebar] = useState(true)

  // ask_user_question HITL state
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null)
  const resolveRef = useRef<((answer: string) => void) | null>(null)

  const askUserQuestionHandler: ToolHandler = useCallback(async (args) => {
    const question = (args.question ?? args.questions ?? '') as string
    setPendingQuestion(question)
    const answer = await new Promise<string>((resolve) => {
      resolveRef.current = resolve
    })
    setPendingQuestion(null)
    return answer
  }, [])

  const handleModalSubmit = useCallback((answer: string) => {
    resolveRef.current?.(answer)
    resolveRef.current = null
  }, [])

  const toolHandlers: Record<string, ToolHandler> = {
    show_alert: async (args: Record<string, any>) => {
      const content = args.content as string
      toast.info('Alert from Agent', { description: content })
      return { success: true, message: 'Alert displayed successfully', content }
    },
    ask_user_question: askUserQuestionHandler,
    ...EXAMPLE_GENERATIVE_TOOLS,
  }

  // Generative UI dispatcher: maps a tool's persisted ui spec onto our local components.
  // Lives in user code on purpose — the library no longer ships an auto-renderer.
  const renderUI = useCallback((tool: ToolCall): ReactNode => {
    const ui = (tool as any).ui_component
    if (!ui) return null
    const key = ui.component ?? ui.type
    let body: ReactNode = null
    switch (key) {
      case 'BarChart':  body = <BarChart {...ui.props} />; break
      case 'LineChart': body = <LineChart {...ui.props} />; break
      case 'AreaChart': body = <AreaChart {...ui.props} />; break
      case 'PieChart':  body = <PieChart {...ui.props} />; break
      case 'card-grid': body = <CardGrid {...ui.props} />; break
      default: return null
    }
    return (
      <div className="w-full">
        {ui.title && <h3 className="font-semibold mb-2">{ui.title}</h3>}
        {ui.description && <p className="text-sm text-muted-foreground mb-4">{ui.description}</p>}
        {body}
      </div>
    )
  }, [])

  const renderTool: RenderTool = byToolName({
    // Pattern A — REPLACE the default render.
    // When ask_user_question completes, show only the AnswerBubble
    // (no debug card stacked underneath it).
    ask_user_question: (tool) => {
      const answer = (tool.result ?? tool.content) as string | undefined
      if (!answer) return null
      return (
        <AnswerBubble
          question={(tool.tool_args.question ?? '') as string}
          answer={answer}
        />
      )
    },

    // Pattern B — PRETTY + DEFAULT side by side.
    // ShowAlertCard renders first; defaultRender() then emits whatever the lib
    // would normally render (only the ToolDebugCard when debug=true; nothing
    // otherwise). This is the "I want my own visual AND keep the debugger"
    // combination.
    show_alert: (tool, { defaultRender }) => (
      <div className="space-y-2">
        <ShowAlertCard tool={tool} />
        {defaultRender()}
      </div>
    ),

    // Generative UI tools — dispatch the persisted ui spec to a local component.
    render_revenue_chart:     renderUI,
    render_rental_cars:       renderUI,
    render_product_comparison: renderUI,
    render_dashboard:         renderUI,
    render_visualization:     renderUI,
  })

  return (
    <div className="flex h-full overflow-hidden">
      {/* ask_user_question modal — rendered outside AgnoChat so it overlays everything */}
      {pendingQuestion !== null && (
        <AskUserQuestionModal question={pendingQuestion} onSubmit={handleModalSubmit} />
      )}

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
          <AgnoChat
            skipToolsOnSessionLoad={['ask_user_question']}
            debug={false}
            toolHandlers={toolHandlers}
            renderTool={renderTool}
          >
            <AgnoChat.Messages
              avatars={{
                user: (
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-md">
                    <Cat className="h-4 w-4 text-white" />
                  </div>
                ),
                assistant: (
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md">
                    <Rocket className="h-4 w-4 text-white" />
                  </div>
                ),
              }}
              showReasoning={true}
              messageClassNames={{ assistant: { container: 'pl-3' } }}
              actions={{
                visibility: 'hover-last-visible',
                assistant: (message) => (
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
                      onClick={() => toast.info("Sorry to hear that. We'll improve!")}
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
                    Compound Components Chat
                  </h3>
                  <p className="text-muted-foreground text-sm max-w-sm">
                    This page uses the <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">AgnoChat</code> compound component with custom avatars, colors, and suggested prompts that actually work in custom empty states.
                  </p>
                </div>
                <AgnoChat.SuggestedPrompts prompts={SUGGESTED_PROMPTS} />
              </AgnoChat.EmptyState>
            </AgnoChat.Messages>

            <AgnoChat.ErrorBar className="bg-red-500/5 border-t-2 border-red-500/30" />
            <AgnoChat.Input
              className="bg-muted/30 border-t-2 border-primary/10"
              placeholder="Ask me anything..."
              allowCancelRun={true}
              audio={{
                enabled: true,
                mode: 'transcribe',
                endpoint: 'http://localhost:7777/transcribe',
              }}
              dropZoneProps={{
                className: "bg-gray-300/50 border-gray-200 !text-black/70",
                label: "Arraste documentos aqui para anexar em sua mensagem",
              }}
            />
          </AgnoChat>
        </div>
      </div>
    </div>
  )
}
