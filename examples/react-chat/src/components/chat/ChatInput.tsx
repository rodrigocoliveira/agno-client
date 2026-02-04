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
  type PromptInputMessage,
} from '@/components/ai-elements/prompt-input'
import { AudioRecorder } from './AudioRecorder'

const ACCEPTED_FILE_TYPES =
  'image/*,audio/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,.ppt,.pptx,.md,.json,.xml'

interface ChatInputProps {
  onSend: (message: string | FormData) => void
  disabled?: boolean
  placeholder?: string
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

export function ChatInput({ onSend, disabled, placeholder }: ChatInputProps) {
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
    formData.append('message', '')
    formData.append('files', blob, `recording-${Date.now()}.webm`)
    onSend(formData)
  }

  const status = disabled ? 'submitted' : undefined

  return (
    <PromptInput
      onSubmit={handleSubmit}
      accept={ACCEPTED_FILE_TYPES}
      multiple
      className="w-full"
    >
      <PromptInputHeader>
        <PromptInputAttachments>
          {(attachment) => <PromptInputAttachment data={attachment} />}
        </PromptInputAttachments>
      </PromptInputHeader>
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
        <PromptInputSubmit disabled={disabled} status={status} />
      </PromptInputFooter>
    </PromptInput>
  )
}
