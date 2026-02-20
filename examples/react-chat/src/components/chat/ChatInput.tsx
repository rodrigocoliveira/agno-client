import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  PromptInputSubmit,
  PromptInputHeader,
  PromptInputAttachments,
  PromptInputAttachment,
  PromptInputActionMenu,
  PromptInputActionMenuTrigger,
  PromptInputActionMenuContent,
  PromptInputActionAddAttachments,
  usePromptInputAttachments,
  usePromptInputController,
  PromptInputProvider,
  type PromptInputMessage,
} from '@/components/ai-elements/prompt-input'
import { Button } from '@/components/ui/button'
import { AudioRecorder } from './AudioRecorder'
import { CircleStop, Upload } from 'lucide-react'
import { type RefObject, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const ACCEPTED_FILE_TYPES =
  'image/*,audio/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,.ppt,.pptx,.md,.json,.xml'

interface ChatInputProps {
  onSend: (message: string | FormData) => void
  disabled?: boolean
  placeholder?: string
  isStreaming?: boolean
  onCancel?: () => void
  allowCancelRun?: boolean
  containerRef?: RefObject<HTMLElement | null>
}

/**
 * Convert a data URL string to a Blob
 */
function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)?.[1] || 'application/octet-stream'
  const bytes = atob(base64)
  const buf = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) {
    buf[i] = bytes.charCodeAt(i)
  }
  return new Blob([buf], { type: mime })
}

function AttachmentHeader() {
  const { files } = usePromptInputAttachments()
  if (files.length === 0) return null
  return (
    <PromptInputHeader>
      <PromptInputAttachments>
        {(attachment) => <PromptInputAttachment data={attachment} />}
      </PromptInputAttachments>
    </PromptInputHeader>
  )
}

/** Submit button disabled until text exists */
function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { textInput } = usePromptInputController()
  const hasText = textInput.value.trim().length > 0
  const status = disabled ? 'submitted' as const : undefined
  return <PromptInputSubmit disabled={disabled || !hasText} status={status} />
}

/** Cancel button shown during streaming */
function CancelButton({ onCancel }: { onCancel: () => void }) {
  return (
    <Button
      type="button"
      variant="destructive"
      size="icon"
      className="h-8 w-8 rounded-lg"
      onClick={onCancel}
      aria-label="Stop"
    >
      <CircleStop className="size-4" />
    </Button>
  )
}

/** Drop zone overlay that tracks drag state on a container element */
function DropZoneOverlay({ containerRef }: { containerRef: RefObject<HTMLElement | null> }) {
  const [isDragging, setIsDragging] = useState(false)
  const dragCounterRef = useRef(0)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onDragEnter = (e: DragEvent) => {
      if (e.dataTransfer?.types?.includes('Files')) {
        e.preventDefault()
        dragCounterRef.current++
        setIsDragging(true)
      }
    }
    const onDragLeave = () => {
      dragCounterRef.current--
      if (dragCounterRef.current <= 0) {
        dragCounterRef.current = 0
        setIsDragging(false)
      }
    }
    const onDragOver = (e: DragEvent) => {
      if (e.dataTransfer?.types?.includes('Files')) {
        e.preventDefault()
      }
    }
    const onDrop = () => {
      dragCounterRef.current = 0
      setIsDragging(false)
    }

    el.addEventListener('dragenter', onDragEnter)
    el.addEventListener('dragleave', onDragLeave)
    el.addEventListener('dragover', onDragOver)
    el.addEventListener('drop', onDrop)
    return () => {
      el.removeEventListener('dragenter', onDragEnter)
      el.removeEventListener('dragleave', onDragLeave)
      el.removeEventListener('dragover', onDragOver)
      el.removeEventListener('drop', onDrop)
    }
  }, [containerRef])

  if (!containerRef.current) return null

  return createPortal(
    <div
      className={`absolute inset-0 z-10 pointer-events-none flex flex-col items-center justify-center gap-2 border-2 border-dashed border-primary rounded-xl bg-primary/5 backdrop-blur-[2px] text-primary transition-opacity duration-200 ${isDragging ? 'opacity-100' : 'opacity-0'}`}
      aria-hidden={!isDragging}
    >
      <Upload className="size-6" />
      <span className="text-sm font-medium">Drop files here</span>
    </div>,
    containerRef.current,
  )
}

export function ChatInput({ onSend, disabled, placeholder, isStreaming, onCancel, allowCancelRun, containerRef }: ChatInputProps) {
  const handleSubmit = (message: PromptInputMessage) => {
    const text = message.text?.trim() || ''
    const files = message.files || []

    // No content at all
    if (!text && files.length === 0) return

    // Text only, no attachments
    if (files.length === 0) {
      onSend(text)
      return
    }

    // Build FormData with attachments
    const formData = new FormData()
    formData.append('message', text)

    for (const file of files) {
      if (!file.url) continue

      const blob = file.url.startsWith('data:')
        ? dataUrlToBlob(file.url)
        : null

      if (!blob) continue

      const fileName = file.filename || 'file'

      // Agno API expects all files under a single "files" field
      formData.append('files', blob, fileName)
    }

    onSend(formData)
  }

  const handleAudioRecording = (blob: Blob) => {
    // Convert blob to a File-like object and add via PromptInput's attachment system
    // We use a custom approach: wrap in FormData and send directly
    const formData = new FormData()
    formData.append('message', 'Audio message')
    formData.append('files', blob, `recording-${Date.now()}.wav`)
    onSend(formData)
  }

  const showCancelButton = allowCancelRun && isStreaming && onCancel

  return (
    <PromptInputProvider>
      <PromptInput
        onSubmit={handleSubmit}
        accept={ACCEPTED_FILE_TYPES}
        multiple
        className="w-full"
        globalDrop={!!containerRef}
      >
        <AttachmentHeader />
        <PromptInputBody>
          <PromptInputTextarea
            placeholder={placeholder || 'Type your message... (Enter to send, Shift+Enter for new line)'}
            disabled={disabled}
          />
        </PromptInputBody>
        <PromptInputFooter>
          <PromptInputTools>
            <PromptInputActionMenu>
              <PromptInputActionMenuTrigger />
              <PromptInputActionMenuContent>
                <PromptInputActionAddAttachments label="Add files" />
              </PromptInputActionMenuContent>
            </PromptInputActionMenu>
            <AudioRecorder onRecordingComplete={handleAudioRecording} disabled={disabled} />
          </PromptInputTools>
          {showCancelButton ? (
            <CancelButton onCancel={onCancel} />
          ) : (
            <SubmitButton disabled={disabled} />
          )}
        </PromptInputFooter>
      </PromptInput>
      {containerRef && <DropZoneOverlay containerRef={containerRef} />}
    </PromptInputProvider>
  )
}
