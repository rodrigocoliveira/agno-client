import type { ReactNode } from 'react';
import { useAgnoChatContext } from './context';
import { AgnoChatInput } from '../AgnoChatInput';
import type { AgnoChatInputProps } from '../AgnoChatInput';
import { cn } from '../../lib/cn';
import type { FileUploadConfig } from '../../types';

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
  showAudioRecorder?: boolean;
  showAttachments?: boolean;
  extraTools?: ReactNode;
  chatInputProps?: Partial<Omit<AgnoChatInputProps, 'onSend'>>;
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
}

export function AgnoChatInputArea({
  className,
  children,
  placeholder,
  fileUpload,
  showAudioRecorder = false,
  showAttachments,
  extraTools,
  chatInputProps,
  audioMode,
  transcriptionEndpoint,
  transcriptionHeaders,
  parseTranscriptionResponse,
  onRequestPermission,
}: AgnoChatInputAreaProps) {
  const { handleSend, inputDisabled, isStreaming, isPaused } = useAgnoChatContext();

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
            placeholder={placeholder ?? chatInputProps?.placeholder ?? 'Message your agent...'}
            fileUpload={fileUpload}
            showAudioRecorder={showAudioRecorder}
            showAttachments={showAttachments}
            extraTools={extraTools}
            audioMode={audioMode}
            transcriptionEndpoint={transcriptionEndpoint}
            transcriptionHeaders={transcriptionHeaders}
            parseTranscriptionResponse={parseTranscriptionResponse}
            onRequestPermission={onRequestPermission}
          />
        )}
      </div>
    </div>
  );
}
