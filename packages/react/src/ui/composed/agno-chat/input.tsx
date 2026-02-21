import type { ReactNode } from 'react';
import { useAgnoChatContext } from './context';
import { AgnoChatInput } from '../AgnoChatInput';
import type { AgnoChatInputProps } from '../AgnoChatInput';
import type { PromptInputDropZoneProps } from '../../components/prompt-input/drop-zone';
import { cn } from '../../lib/cn';
import type { AudioConfig, FileUploadConfig } from '../../types';

export interface AgnoChatInputRenderProps {
  onSend: (message: string | FormData) => Promise<void>;
  disabled: boolean;
  isStreaming: boolean;
  isPaused: boolean;
}

export interface AgnoChatInputAreaProps {
  className?: string;
  children?: (props: AgnoChatInputRenderProps) => ReactNode;
  placeholder?: string;
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
  /** Extra tools to add to the toolbar */
  extraTools?: ReactNode;
  /** Show a stop button that cancels the run while streaming (default: false) */
  allowCancelRun?: boolean;
  /** Props forwarded to PromptInputDropZone (className, label) */
  dropZoneProps?: Partial<Pick<PromptInputDropZoneProps, 'label' | 'className'>>;

  // ── Legacy props (deprecated — use `audio` instead) ──────────────
  /** @deprecated Use `audio={{ enabled: true }}` instead */
  showAudioRecorder?: boolean;
  /** @deprecated Use `audio={{ mode: '...' }}` instead */
  audioMode?: 'send' | 'transcribe';
  /** @deprecated Use `audio={{ endpoint: '...' }}` instead */
  transcriptionEndpoint?: string;
  /** @deprecated Use `audio={{ headers: { ... } }}` instead */
  transcriptionHeaders?: Record<string, string>;
  /** @deprecated Use `audio={{ parseResponse: fn }}` instead */
  parseTranscriptionResponse?: (data: unknown) => string;
  /** @deprecated Use `audio={{ requestPermission: fn }}` instead */
  onRequestPermission?: () => Promise<boolean>;
  /** @deprecated Use `audio={{ labels: { ... } }}` instead */
  audioRecorderLabels?: Record<string, string>;
  /**
   * @deprecated Pass props directly to `<AgnoChat.Input>` instead.
   * All common AgnoChatInput props are available as direct props.
   */
  chatInputProps?: Partial<Omit<AgnoChatInputProps, 'onSend'>>;
}

export function AgnoChatInputArea({
  className,
  children,
  placeholder,
  fileUpload,
  audio,
  showAttachments,
  extraTools,
  allowCancelRun = false,
  dropZoneProps,
  // Legacy props
  showAudioRecorder,
  audioMode,
  transcriptionEndpoint,
  transcriptionHeaders,
  parseTranscriptionResponse,
  onRequestPermission,
  audioRecorderLabels,
  chatInputProps,
}: AgnoChatInputAreaProps) {
  const { handleSend, inputDisabled, isStreaming, isPaused, cancelRun, dropZoneContainerRef } = useAgnoChatContext();

  return (
    <div className={cn('border-t border-border bg-background/80 backdrop-blur-sm', className)}>
      <div className="mx-auto px-4 py-2">
        {children ? (
          children({ onSend: handleSend, disabled: inputDisabled, isStreaming, isPaused })
        ) : (
          <AgnoChatInput
            {...chatInputProps}
            onSend={handleSend}
            disabled={inputDisabled}
            isStreaming={isStreaming}
            onCancel={cancelRun}
            allowCancelRun={allowCancelRun}
            placeholder={placeholder ?? chatInputProps?.placeholder ?? 'Message your agent...'}
            fileUpload={fileUpload ?? chatInputProps?.fileUpload}
            audio={audio}
            showAudioRecorder={showAudioRecorder ?? chatInputProps?.showAudioRecorder}
            audioMode={audioMode ?? chatInputProps?.audioMode}
            transcriptionEndpoint={transcriptionEndpoint ?? chatInputProps?.transcriptionEndpoint}
            transcriptionHeaders={transcriptionHeaders ?? chatInputProps?.transcriptionHeaders}
            parseTranscriptionResponse={parseTranscriptionResponse ?? chatInputProps?.parseTranscriptionResponse}
            onRequestPermission={onRequestPermission ?? chatInputProps?.onRequestPermission}
            audioRecorderLabels={audioRecorderLabels ?? chatInputProps?.audioRecorderLabels}
            showAttachments={showAttachments ?? chatInputProps?.showAttachments}
            extraTools={extraTools ?? chatInputProps?.extraTools}
            dropZoneContainerRef={dropZoneContainerRef}
            dropZoneProps={dropZoneProps ?? chatInputProps?.dropZoneProps}
          />
        )}
      </div>
    </div>
  );
}
