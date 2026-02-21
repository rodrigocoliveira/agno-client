import type { ReactNode } from 'react';
import { useAgnoChatContext } from './context';
import { AgnoChatInput } from '../AgnoChatInput';
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
}: AgnoChatInputAreaProps) {
  const { handleSend, inputDisabled, isStreaming, isPaused, cancelRun, dropZoneContainerRef } = useAgnoChatContext();

  return (
    <div className={cn('border-t border-border bg-background/80 backdrop-blur-sm', className)}>
      <div className="mx-auto px-4 py-2">
        {children ? (
          children({ onSend: handleSend, disabled: inputDisabled, isStreaming, isPaused })
        ) : (
          <AgnoChatInput
            onSend={handleSend}
            disabled={inputDisabled}
            isStreaming={isStreaming}
            onCancel={cancelRun}
            allowCancelRun={allowCancelRun}
            placeholder={placeholder ?? 'Message your agent...'}
            fileUpload={fileUpload}
            audio={audio}
            showAttachments={showAttachments}
            extraTools={extraTools}
            dropZoneContainerRef={dropZoneContainerRef}
            dropZoneProps={dropZoneProps}
          />
        )}
      </div>
    </div>
  );
}
