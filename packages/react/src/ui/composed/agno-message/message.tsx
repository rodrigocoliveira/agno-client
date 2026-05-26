import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { ChatMessage } from '@rodrigocoliveira/agno-types';
import { AlertCircle, FileIcon, Music } from 'lucide-react';
import { SmartTimestamp } from '../../components/smart-timestamp';
import { FilePreviewCard } from '../../components/file-preview-card';
import { FilePreviewModal } from '../../components/file-preview-modal';
import { ImageLightbox } from '../../components/image-lightbox';
import type { FilePreviewFile } from '../../components/file-preview-card';
import type { LightboxImage } from '../../components/image-lightbox';
import { formatSmartTimestamp } from '../../lib/format-timestamp';
import { cn } from '../../lib/cn';
import type {
  AgnoMessageClassNames,
  AgnoMessageActions,
  AgnoMessageAvatars,
} from '../../types';
import type { RenderTool } from '../agno-chat/render-tool';
import { AgnoMessageContext } from './context';
import type { AgnoMessageContextValue } from './context';
import { AgnoMessageReasoning } from './reasoning';
import { AgnoMessageMedia } from './media';
import { AgnoMessageTools } from './tools';
import { AgnoMessageContent } from './content';
import { AgnoMessageReferences } from './references';
import { AgnoMessageFooter } from './footer';

export interface AgnoMessageProps {
  message: ChatMessage;
  className?: string;
  classNames?: AgnoMessageClassNames;
  avatars?: AgnoMessageAvatars;
  actions?: AgnoMessageActions;
  isLastAssistantMessage?: boolean;
  showFilePreview?: boolean;
  showImageLightbox?: boolean;
  showTimestamp?: boolean;
  formatTimestamp?: (date: Date) => string;
  renderTool?: RenderTool;
  /**
   * Custom slot composition for assistant messages. If provided, replaces the
   * default ordering. Use `<AgnoMessage.Reasoning />`, `<AgnoMessage.Media />`,
   * `<AgnoMessage.Tools />`, `<AgnoMessage.Content />`, `<AgnoMessage.References />`,
   * `<AgnoMessage.Footer />` in any order. User messages ignore this — their layout
   * is fixed.
   */
  children?: ReactNode;
}

type PreviewState =
  | { type: 'image'; images: LightboxImage[]; initialIndex: number }
  | { type: 'file'; file: FilePreviewFile }
  | null;

function DefaultAssistantComposition({ showTimestamp }: { showTimestamp: boolean }) {
  return (
    <>
      <AgnoMessageReasoning />
      <AgnoMessageMedia />
      <AgnoMessageTools />
      <AgnoMessageContent />
      <AgnoMessageReferences />
      <AgnoMessageFooter showTimestamp={showTimestamp} />
    </>
  );
}

export function AgnoMessage({
  message,
  className,
  classNames,
  avatars,
  actions,
  isLastAssistantMessage = false,
  showFilePreview = true,
  showImageLightbox = true,
  showTimestamp = true,
  formatTimestamp,
  renderTool,
  children,
}: AgnoMessageProps) {
  const isUser = message.role === 'user';
  const hasError = message.streamingError;
  const [preview, setPreview] = useState<PreviewState>(null);

  const isCustomTimestamp = !!formatTimestamp;
  const resolvedFormatTimestamp = formatTimestamp ?? formatSmartTimestamp;

  const ctx = useMemo<AgnoMessageContextValue>(
    () => ({
      message,
      isLastAssistantMessage,
      classNames,
      actions,
      avatars,
      formatTimestamp,
      showFilePreview,
      showImageLightbox,
      openImageLightbox: (images, index) => {
        if (!showImageLightbox) return;
        setPreview({ type: 'image', images, initialIndex: index });
      },
      openFilePreview: (file) => {
        if (!showFilePreview) return;
        setPreview({ type: 'file', file });
      },
      renderTool,
    }),
    [
      message,
      isLastAssistantMessage,
      classNames,
      actions,
      avatars,
      formatTimestamp,
      showFilePreview,
      showImageLightbox,
      renderTool,
    ],
  );

  const closePreview = () => setPreview(null);

  return (
    <AgnoMessageContext.Provider value={ctx}>
      <div className={cn('py-5 first:pt-2', isUser ? 'flex justify-end' : '', classNames?.root, className)}>
        {isUser ? (
          <UserMessageLayout
            message={message}
            classNames={classNames}
            avatars={avatars}
            actions={actions}
            isCustomTimestamp={isCustomTimestamp}
            resolvedFormatTimestamp={resolvedFormatTimestamp}
            showTimestamp={showTimestamp}
            showImageLightbox={showImageLightbox}
            showFilePreview={showFilePreview}
            openImageLightbox={ctx.openImageLightbox}
            openFilePreview={ctx.openFilePreview}
            hasError={hasError}
          />
        ) : (
          <div className="flex items-start gap-3 group/message">
            {avatars?.assistant}
            <div className={cn('flex-1 min-w-0 space-y-3', classNames?.assistant?.container)}>
              {children ?? <DefaultAssistantComposition showTimestamp={showTimestamp} />}
            </div>
          </div>
        )}

        {preview?.type === 'image' && (
          <ImageLightbox
            open
            onOpenChange={(open) => { if (!open) closePreview(); }}
            images={preview.images}
            initialIndex={preview.initialIndex}
          />
        )}
        {preview?.type === 'file' && (
          <FilePreviewModal
            open
            onOpenChange={(open) => { if (!open) closePreview(); }}
            file={preview.file}
          />
        )}
      </div>
    </AgnoMessageContext.Provider>
  );
}

AgnoMessage.Reasoning = AgnoMessageReasoning;
AgnoMessage.Media = AgnoMessageMedia;
AgnoMessage.Tools = AgnoMessageTools;
AgnoMessage.Content = AgnoMessageContent;
AgnoMessage.References = AgnoMessageReferences;
AgnoMessage.Footer = AgnoMessageFooter;

interface UserMessageLayoutProps {
  message: ChatMessage;
  classNames?: AgnoMessageClassNames;
  avatars?: AgnoMessageAvatars;
  actions?: AgnoMessageActions;
  isCustomTimestamp: boolean;
  resolvedFormatTimestamp: (date: Date) => string;
  showTimestamp: boolean;
  showImageLightbox: boolean;
  showFilePreview: boolean;
  openImageLightbox: (images: LightboxImage[], idx: number) => void;
  openFilePreview: (file: FilePreviewFile) => void;
  hasError?: boolean;
}

function UserMessageLayout({
  message,
  classNames,
  avatars,
  actions,
  isCustomTimestamp,
  resolvedFormatTimestamp,
  showTimestamp,
  showImageLightbox,
  showFilePreview,
  openImageLightbox,
  openFilePreview,
  hasError,
}: UserMessageLayoutProps) {
  return (
    <div className="flex items-start gap-2.5 max-w-[80%] flex-row-reverse">
      {avatars?.user}
      <div className="space-y-1.5 flex flex-col items-end min-w-0">
        {((message.images && message.images.length > 0) ||
          (message.audio && message.audio.length > 0) ||
          (message.files && message.files.length > 0)) && (
          <div className="flex flex-wrap gap-2 justify-end">
            {message.images?.map((img, idx) => (
              <FilePreviewCard
                key={`img-${idx}`}
                file={{ name: img.revised_prompt || `Image ${idx + 1}`, type: 'image/png', url: img.url }}
                onClick={
                  showImageLightbox
                    ? () =>
                        openImageLightbox(
                          message.images!.map((i) => ({ url: i.url, alt: i.revised_prompt })),
                          idx,
                        )
                    : undefined
                }
              />
            ))}
            {message.audio?.map((audio, idx) => (
              <div
                key={`audio-${idx}`}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-2.5 py-1.5 text-xs text-foreground self-end"
              >
                <Music className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="truncate max-w-[150px]">{audio.id || `Audio ${idx + 1}`}</span>
              </div>
            ))}
            {message.files?.map((file, idx) =>
              showFilePreview ? (
                <FilePreviewCard
                  key={`file-${idx}`}
                  file={{ name: file.name, type: file.type, url: file.url, size: file.size }}
                  onClick={() =>
                    openFilePreview({ name: file.name, type: file.type, url: file.url, size: file.size })
                  }
                />
              ) : (
                <div
                  key={`file-${idx}`}
                  className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-2.5 py-1.5 text-xs text-foreground self-end"
                >
                  <FileIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="truncate max-w-[150px]">{file.name}</span>
                </div>
              ),
            )}
          </div>
        )}
        {message.content && (
          <div
            className={cn(
              'rounded-2xl rounded-br-md px-4 py-2.5',
              classNames?.user?.bubble ?? 'bg-primary text-primary-foreground',
              hasError && 'opacity-70',
            )}
          >
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          </div>
        )}
        {(showTimestamp || actions?.user) && (
          <div className="flex items-center justify-end gap-1.5 px-1">
            {actions?.user && (
              <div className="flex items-center gap-1">
                {actions.user(message)}
              </div>
            )}
            <SmartTimestamp
              date={new Date(message.created_at * 1000)}
              formatShort={isCustomTimestamp ? resolvedFormatTimestamp : undefined}
              className="text-[11px] text-muted-foreground"
            />
            {hasError && <AlertCircle className="h-3 w-3 text-destructive" />}
          </div>
        )}
      </div>
    </div>
  );
}

