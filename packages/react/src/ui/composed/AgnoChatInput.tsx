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
import type { AudioConfig, ChatStatus, FileUploadConfig } from '../types';
import type { ReactNode, RefObject } from 'react';

const DEFAULT_ACCEPTED_FILE_TYPES =
  'image/*,audio/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,.ppt,.pptx,.md,.json,.xml';

/** Normalize `audio` prop: `true` → default config, `false`/`undefined` → undefined */
function normalizeAudio(audio: AudioConfig | boolean | undefined): AudioConfig | undefined {
  if (audio === true) return { enabled: true };
  if (!audio) return undefined;
  return audio;
}

export interface AgnoChatInputProps {
  onSend: (message: string | FormData) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  /** File upload configuration */
  fileUpload?: FileUploadConfig;
  /**
   * Audio recording/transcription configuration.
   * Pass `true` for send-mode defaults, or an `AudioConfig` object.
   *
   * @example
   * audio={true}
   * audio={{ enabled: true, mode: 'transcribe', endpoint: 'http://...' }}
   */
  audio?: AudioConfig | boolean;
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
  audio,
  showAttachments = true,
  status,
  isStreaming,
  onCancel,
  allowCancelRun = false,
  extraTools,
  dropZoneContainerRef,
  dropZoneProps,
}: AgnoChatInputProps) {
  const resolvedAudio = normalizeAudio(audio);
  const audioEnabled = resolvedAudio?.enabled ?? false;
  const audioMode = resolvedAudio?.mode ?? 'send';

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
            {audioEnabled &&
              (audioMode === 'transcribe' && resolvedAudio?.endpoint ? (
                <TranscribeAudioRecorder
                  endpoint={resolvedAudio.endpoint}
                  headers={resolvedAudio.headers}
                  disabled={disabled}
                  parseResponse={resolvedAudio.parseResponse}
                  onRequestPermission={resolvedAudio.requestPermission}
                  labels={resolvedAudio.labels as AudioRecorderLabels | undefined}
                />
              ) : (
                <AudioRecorder
                  onRecordingComplete={handleAudioRecording}
                  disabled={disabled}
                  onRequestPermission={resolvedAudio?.requestPermission}
                  labels={resolvedAudio?.labels as AudioRecorderLabels | undefined}
                />
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
