import { Bot } from 'lucide-react'

export function StreamingIndicator() {
  return (
    <div className="flex items-start gap-3 px-1">
      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Bot className="h-4 w-4 text-primary" />
      </div>
      <div className="flex items-center gap-1.5 pt-2.5">
        <span className="h-2 w-2 rounded-full bg-primary/60 animate-typing-dot" />
        <span className="h-2 w-2 rounded-full bg-primary/60 animate-typing-dot-delay-1" />
        <span className="h-2 w-2 rounded-full bg-primary/60 animate-typing-dot-delay-2" />
      </div>
    </div>
  )
}
