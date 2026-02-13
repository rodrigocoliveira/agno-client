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
}

export function AgnoChatInputArea({
  className,
  children,
  placeholder,
  fileUpload,
  showAudioRecorder = true,
  showAttachments,
  extraTools,
  chatInputProps,
}: AgnoChatInputAreaProps) {
  const { handleSend, inputDisabled, isStreaming, isPaused } = useAgnoChatContext();

  return (
    <div className={cn('border-t border-border bg-background/80 backdrop-blur-sm', className)}>
      <div className="max-w-3xl mx-auto px-4 py-3">
        {children ? (
          children({ onSend: handleSend, disabled: inputDisabled, isStreaming, isPaused })
        ) : (
          <AgnoChatInput
            onSend={handleSend}
            disabled={inputDisabled}
            placeholder={placeholder ?? 'Message your agent...'}
            fileUpload={fileUpload}
            showAudioRecorder={showAudioRecorder}
            showAttachments={showAttachments}
            extraTools={extraTools}
            {...chatInputProps}
          />
        )}
      </div>
    </div>
  );
}
