import { FileIcon, Image as ImageIcon, Music, Paperclip, Video } from 'lucide-react';
import { FilePreviewCard } from '../../components/file-preview-card';
import { cn } from '../../lib/cn';
import { useAgnoMessageContext } from './context';

export function AgnoMessageMedia() {
  const {
    message,
    classNames,
    showImageLightbox,
    showFilePreview,
    openImageLightbox,
    openFilePreview,
  } = useAgnoMessageContext();
  const mediaClassName = classNames?.assistant?.media;

  const hasImages = !!message.images && message.images.length > 0;
  const hasVideos = !!message.videos && message.videos.length > 0;
  const hasAudio = !!message.audio && message.audio.length > 0;
  const hasFiles = !!message.files && message.files.length > 0;
  const hasResponseAudio = !!message.response_audio;

  if (!hasImages && !hasVideos && !hasAudio && !hasFiles && !hasResponseAudio) return null;

  return (
    <>
      {hasImages && (
        <div className={cn('space-y-2 pt-1', mediaClassName)}>
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <ImageIcon className="h-3.5 w-3.5" />
            Images ({message.images!.length})
          </div>
          <div className="grid grid-cols-2 gap-2">
            {message.images!.map((img, idx) => (
              <div key={idx} className="space-y-1">
                {showImageLightbox ? (
                  <button
                    type="button"
                    onClick={() =>
                      openImageLightbox(
                        message.images!.map((i) => ({ url: i.url, alt: i.revised_prompt })),
                        idx,
                      )
                    }
                    className="group relative w-full overflow-hidden rounded-lg border border-border cursor-pointer hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
                  >
                    <img
                      src={img.url}
                      alt={img.revised_prompt || 'Generated image'}
                      className="w-full rounded-lg"
                    />
                  </button>
                ) : (
                  <img
                    src={img.url}
                    alt={img.revised_prompt || 'Generated image'}
                    className="w-full rounded-lg border border-border"
                  />
                )}
                {img.revised_prompt && (
                  <p className="text-[11px] text-muted-foreground italic px-0.5">
                    {img.revised_prompt}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {hasVideos && (
        <div className={cn('space-y-2 pt-1', mediaClassName)}>
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Video className="h-3.5 w-3.5" />
            Videos ({message.videos!.length})
          </div>
          <div className="space-y-2">
            {message.videos!.map((video, idx) => (
              <div key={idx}>
                {video.url ? (
                  <video src={video.url} controls className="w-full rounded-lg border border-border" />
                ) : (
                  <div className="bg-muted/50 border border-border p-2.5 rounded-lg text-xs text-muted-foreground">
                    Video ID: {video.id} (ETA: {video.eta}s)
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {hasAudio && (
        <div className={cn('space-y-2 pt-1', mediaClassName)}>
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Music className="h-3.5 w-3.5" />
            Audio ({message.audio!.length})
          </div>
          <div className="space-y-2">
            {message.audio!.map((audio, idx) => (
              <div key={idx}>
                {audio.url ? (
                  <audio src={audio.url} controls className="w-full" />
                ) : audio.base64_audio ? (
                  <audio
                    src={`data:${audio.mime_type || 'audio/wav'};base64,${audio.base64_audio}`}
                    controls
                    className="w-full"
                  />
                ) : (
                  <div className="bg-muted/50 border border-border p-2.5 rounded-lg text-xs text-muted-foreground">
                    Audio data unavailable
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {hasFiles && (
        <div className={cn('space-y-2 pt-1', mediaClassName)}>
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Paperclip className="h-3.5 w-3.5" />
            Files ({message.files!.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {message.files!.map((file, idx) =>
              showFilePreview ? (
                <FilePreviewCard
                  key={idx}
                  file={{ name: file.name, type: file.type, url: file.url, size: file.size }}
                  onClick={() =>
                    openFilePreview({ name: file.name, type: file.type, url: file.url, size: file.size })
                  }
                />
              ) : (
                <div
                  key={idx}
                  className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <FileIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate max-w-[180px]">{file.name}</span>
                  {file.size && (
                    <span className="text-muted-foreground/70">
                      ({(file.size / 1024).toFixed(1)}KB)
                    </span>
                  )}
                  {file.url && /^https?:\/\//i.test(file.url) && (
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-medium"
                    >
                      View
                    </a>
                  )}
                </div>
              ),
            )}
          </div>
        </div>
      )}

      {hasResponseAudio && message.response_audio && (
        <div className={cn('space-y-2 pt-1', mediaClassName)}>
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Music className="h-3.5 w-3.5" />
            Response Audio
          </div>
          {message.response_audio.transcript && (
            <div className="text-xs italic bg-muted/50 border border-border p-2.5 rounded-lg text-muted-foreground">
              "{message.response_audio.transcript}"
            </div>
          )}
          {message.response_audio.content && (
            <audio
              src={`data:audio/wav;base64,${message.response_audio.content}`}
              controls
              className="w-full"
            />
          )}
        </div>
      )}
    </>
  );
}
