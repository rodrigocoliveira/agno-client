import { Bell, CheckCircle2 } from 'lucide-react'
import type { ToolCall } from '@rodrigocoliveira/agno-react'

/**
 * Pretty card for the `show_alert` tool — gives a user-facing summary of the
 * alert that was delivered instead of leaving an empty space in the transcript.
 *
 * Designed to render alongside the default debug card. Use it like:
 *
 *   byToolName({
 *     show_alert: (tool, { defaultRender }) => (
 *       <>
 *         <ShowAlertCard tool={tool} />
 *         {defaultRender()}   // keeps the debug card visible when debug=true
 *       </>
 *     ),
 *   })
 */
export function ShowAlertCard({ tool }: { tool: ToolCall }) {
  const content = (tool.tool_args.content ?? '') as string
  const isError = tool.tool_call_error

  return (
    <div
      className={
        'flex items-center gap-3 rounded-xl border p-3 shadow-sm ' +
        (isError
          ? 'border-red-200 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 dark:border-red-900'
          : 'border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 dark:border-blue-900')
      }
    >
      <div
        className={
          'h-9 w-9 shrink-0 rounded-full flex items-center justify-center ' +
          (isError ? 'bg-red-500' : 'bg-gradient-to-br from-blue-500 to-cyan-500')
        }
      >
        {isError ? (
          <Bell className="h-4 w-4 text-white" />
        ) : (
          <CheckCircle2 className="h-4 w-4 text-white" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300">
          {isError ? 'Alert failed' : 'Alert delivered'}
        </div>
        <div className="text-sm font-medium text-foreground/90 truncate">
          {content || '(no content)'}
        </div>
      </div>
    </div>
  )
}
