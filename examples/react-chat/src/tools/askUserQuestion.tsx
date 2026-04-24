import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { MessageSquare } from 'lucide-react'

// ─── Modal shown while the agent is waiting for the answer ───────────────────

interface AskUserQuestionModalProps {
  question: string
  onSubmit: (answer: string) => void
}

export function AskUserQuestionModal({ question, onSubmit }: AskUserQuestionModalProps) {
  const [answer, setAnswer] = useState('')

  const handleSubmit = () => {
    if (!answer.trim()) return
    onSubmit(answer.trim())
    setAnswer('')
  }

  return (
    <Dialog open>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4 text-primary" />
            The agent needs your input
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-foreground">{question}</p>

        <Textarea
          autoFocus
          placeholder="Type your answer…"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
          }}
          rows={3}
          className="resize-none"
        />

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!answer.trim()} className="w-full">
            Send answer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Inline bubble shown in chat history after the question is answered ───────

interface AnswerBubbleProps {
  question: string
  answer: string
}

export function AnswerBubble({ question, answer }: AnswerBubbleProps) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary text-primary-foreground px-4 py-3 space-y-1 text-sm shadow-sm">
        <p className="text-xs opacity-70 font-medium">{question}</p>
        <p>{answer}</p>
      </div>
    </div>
  )
}
