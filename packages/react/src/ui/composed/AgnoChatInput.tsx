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
} from '../components/prompt-input';
import { AudioRecorder } from '../components/audio-recorder';
import { cn } from '../lib/cn';
import type { ChatStatus, FileUploadConfig } from '../types';
import type { ReactNode } from 'react';

const DEFAULT_ACCEPTED_FILE_TYPES =
  'image/*,audio/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,.ppt,.pptx,.md,.json,.xml';

export interface AgnoChatInputProps {
  onSend: (message: string | FormData) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  /** File upload configuration */
  fileUpload?: FileUploadConfig;
  /** Show audio recorder button (default: true) */
  showAudioRecorder?: boolean;
  /** Show attachments button (default: true) */
  showAttachments?: boolean;
  /** Override chat status for submit button icon */
  status?: ChatStatus;
  /** Extra tools to add to the toolbar */
  extraTools?: ReactNode;
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] || 'application/octet-stream';
  const bytes = atob(base64);
  const buf = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    buf[i] = bytes.charCodeAt(i);
  }
  return new Blob([buf], { type: mime });
}

export function AgnoChatInput({
  onSend,
  disabled,
  placeholder,
  className,
  fileUpload,
  showAudioRecorder = true,
  showAttachments = true,
  status,
  extraTools,
}: AgnoChatInputProps) {
  const handleSubmit = (message: PromptInputMessage) => {
    const text = message.text?.trim() || '';
    const files = message.files || [];

    if (!text && files.length === 0) return;

    if (files.length === 0) {
      onSend(text);
      return;
    }

    const formData = new FormData();
    formData.append('message', text);

    for (const file of files) {
      if (!file.url) continue;
      const blob = file.url.startsWith('data:') ? dataUrlToBlob(file.url) : null;
      if (!blob) continue;
      const fileName = file.filename || 'file';
      formData.append('files', blob, fileName);
    }

    onSend(formData);
  };

  const handleAudioRecording = (blob: Blob) => {
    const formData = new FormData();
    formData.append('message', 'Audio message');
    formData.append('files', blob, `recording-${Date.now()}.wav`);
    onSend(formData);
  };

  const computedStatus = status ?? (disabled ? 'submitted' : undefined);

  return (
    <PromptInput
      onSubmit={handleSubmit}
      accept={fileUpload?.accept ?? DEFAULT_ACCEPTED_FILE_TYPES}
      multiple={fileUpload?.multiple ?? true}
      maxFiles={fileUpload?.maxFiles}
      maxFileSize={fileUpload?.maxFileSize}
      className={cn('w-full', className)}
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
          {showAttachments && (
            <PromptInputActionMenu>
              <PromptInputActionMenuTrigger />
              <PromptInputActionMenuContent>
                <PromptInputActionAddAttachments label="Add files" />
              </PromptInputActionMenuContent>
            </PromptInputActionMenu>
          )}
          {showAudioRecorder && (
            <AudioRecorder onRecordingComplete={handleAudioRecording} disabled={disabled} />
          )}
          {extraTools}
        </PromptInputTools>
        <PromptInputSubmit disabled={disabled} status={computedStatus} />
      </PromptInputFooter>
    </PromptInput>
  );
}
