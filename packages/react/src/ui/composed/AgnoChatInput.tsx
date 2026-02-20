import {
  PromptInput,
  PromptInputProvider,
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
  PromptInputDropZone,
  usePromptInputController,
  usePromptInputAttachments,
  type PromptInputMessage,
} from '../components/prompt-input';
import type { PromptInputDropZoneProps } from '../components/prompt-input/drop-zone';
import { AudioRecorder } from '../components/audio-recorder';
import type { AudioRecorderLabels } from '../components/audio-recorder';
import { Button } from '../primitives/button';
import { CircleStop } from 'lucide-react';
import { cn } from '../lib/cn';
import type { ChatStatus, FileUploadConfig } from '../types';
import type { ReactNode, RefObject } from 'react';

const DEFAULT_ACCEPTED_FILE_TYPES =
  'image/*,audio/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,.ppt,.pptx,.md,.json,.xml';

export interface AgnoChatInputProps {
  onSend: (message: string | FormData) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  /** File upload configuration */
  fileUpload?: FileUploadConfig;
  /** Show audio recorder button (default: false) */
  showAudioRecorder?: boolean;
  /** Show attachments button (default: true) */
  showAttachments?: boolean;
  /** Override chat status for submit button icon */
  status?: ChatStatus;
  /** Whether a run is currently streaming */
  isStreaming?: boolean;
  /** Called when the user clicks stop during streaming */
  onCancel?: () => void;
  /** Show a stop button that cancels the run while streaming (default: false) */
  allowCancelRun?: boolean;
  /** Extra tools to add to the toolbar */
  extraTools?: ReactNode;
  /** Audio mode: 'send' sends blob immediately, 'transcribe' transcribes and adds text to input */
  audioMode?: 'send' | 'transcribe';
  /** Transcription endpoint URL (required when audioMode='transcribe') */
  transcriptionEndpoint?: string;
  /** Extra headers for transcription request */
  transcriptionHeaders?: Record<string, string>;
  /** Custom parser for the transcription response — receives the parsed JSON and returns the text */
  parseTranscriptionResponse?: (data: unknown) => string;
  /** Async callback to request microphone permission before recording (e.g., for WebView bridges) */
  onRequestPermission?: () => Promise<boolean>;
  /** Custom labels for the audio recorder button (useful for i18n) */
  audioRecorderLabels?: AudioRecorderLabels;
  /** Ref to a container element for rendering the drop zone overlay via portal */
  dropZoneContainerRef?: RefObject<HTMLElement | null>;
  /** Props forwarded to PromptInputDropZone (className, label) */
  dropZoneProps?: Partial<Pick<PromptInputDropZoneProps, 'label' | 'className'>>;
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

/** Stop button shown during streaming when allowCancelRun is enabled */
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
  );
}

/** Submit button disabled until text exists */
function SubmitButton({ disabled, status }: { disabled?: boolean; status?: ChatStatus }) {
  const { textInput } = usePromptInputController();
  const hasText = textInput.value.trim().length > 0;
  return <PromptInputSubmit disabled={disabled || !hasText} status={status} />;
}

/** Only renders the attachment header when files are present */
function AttachmentHeader() {
  const { files } = usePromptInputAttachments();
  if (files.length === 0) return null;
  return (
    <PromptInputHeader>
      <PromptInputAttachments>
        {(attachment) => <PromptInputAttachment data={attachment} />}
      </PromptInputAttachments>
    </PromptInputHeader>
  );
}

/** Internal wrapper that accesses PromptInput context to set transcribed text */
function TranscribeAudioRecorder({
  endpoint,
  headers,
  disabled,
  parseResponse,
  onRequestPermission,
  labels,
}: {
  endpoint: string;
  headers?: Record<string, string>;
  disabled?: boolean;
  parseResponse?: (data: unknown) => string;
  onRequestPermission?: () => Promise<boolean>;
  labels?: AudioRecorderLabels;
}) {
  const { textInput } = usePromptInputController();
  return (
    <AudioRecorder
      mode="transcribe"
      transcriptionEndpoint={endpoint}
      transcriptionHeaders={headers}
      parseTranscriptionResponse={parseResponse}
      onRequestPermission={onRequestPermission}
      onRecordingComplete={() => {}}
      onTranscriptionComplete={(text) => {
        const current = textInput.value;
        textInput.setInput(current + (current ? ' ' : '') + text);
      }}
      disabled={disabled}
      labels={labels}
    />
  );
}

export function AgnoChatInput({
  onSend,
  disabled,
  placeholder,
  className,
  fileUpload,
  showAudioRecorder = false,
  showAttachments = true,
  status,
  isStreaming,
  onCancel,
  allowCancelRun = false,
  extraTools,
  audioMode = 'send',
  transcriptionEndpoint,
  transcriptionHeaders,
  parseTranscriptionResponse,
  onRequestPermission,
  audioRecorderLabels,
  dropZoneContainerRef,
  dropZoneProps,
}: AgnoChatInputProps) {
  const handleSubmit = (message: PromptInputMessage) => {
    const text = message.text?.trim() || '';
    const files = message.files || [];

    if (!text) return;

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
  const showCancelButton = allowCancelRun && isStreaming && onCancel;

  return (
    <PromptInputProvider>
      <PromptInput
        onSubmit={handleSubmit}
        accept={fileUpload?.accept ?? DEFAULT_ACCEPTED_FILE_TYPES}
        multiple={fileUpload?.multiple ?? true}
        maxFiles={fileUpload?.maxFiles}
        maxFileSize={fileUpload?.maxFileSize}
        globalDrop={!!dropZoneContainerRef}
        dragListenerTarget={dropZoneContainerRef}
        className={cn('w-full', className)}
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
            {showAttachments && (
              <PromptInputActionMenu>
                <PromptInputActionMenuTrigger />
                <PromptInputActionMenuContent>
                  <PromptInputActionAddAttachments label="Add files" />
                </PromptInputActionMenuContent>
              </PromptInputActionMenu>
            )}
            {showAudioRecorder &&
              (audioMode === 'transcribe' && transcriptionEndpoint ? (
                <TranscribeAudioRecorder
                  endpoint={transcriptionEndpoint}
                  headers={transcriptionHeaders}
                  disabled={disabled}
                  parseResponse={parseTranscriptionResponse}
                  onRequestPermission={onRequestPermission}
                  labels={audioRecorderLabels}
                />
              ) : (
                <AudioRecorder onRecordingComplete={handleAudioRecording} disabled={disabled} onRequestPermission={onRequestPermission} labels={audioRecorderLabels} />
              ))}
            {extraTools}
          </PromptInputTools>
          {showCancelButton ? (
            <CancelButton onCancel={onCancel} />
          ) : (
            <SubmitButton disabled={disabled} status={computedStatus} />
          )}
        </PromptInputFooter>
        {showAttachments && <PromptInputDropZone {...dropZoneProps} container={dropZoneContainerRef} />}
      </PromptInput>
    </PromptInputProvider>
  );
}
