import { cn } from '../lib/cn';
import { getFilePreviewType, formatFileSize, getFileExtension } from '../lib/file-utils';
import { FileIcon, Search } from 'lucide-react';

export interface FilePreviewFile {
  name: string;
  type?: string;
  url?: string;
  size?: number;
}

export interface FilePreviewCardProps {
  file: FilePreviewFile;
  onClick?: () => void;
  className?: string;
}

/** Small corner badge for the file extension */
function ExtBadge({ ext }: { ext: string }) {
  if (!ext) return null;
  return (
    <span className="absolute bottom-1.5 left-1.5 rounded px-1 py-0.5 text-[9px] font-semibold uppercase leading-none bg-background/80 text-muted-foreground border border-border/50 backdrop-blur-sm">
      {ext}
    </span>
  );
}

export function FilePreviewCard({ file, onClick, className }: FilePreviewCardProps) {
  const previewType = getFilePreviewType(file.type);
  const isClickable = !!onClick;
  const ext = getFileExtension(file.name, file.type);

  const cardBase = cn(
    'group relative flex flex-col overflow-hidden rounded-xl border border-border bg-muted/20 w-28 h-28',
    isClickable && 'cursor-pointer hover:border-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors',
    className,
  );

  // Image thumbnail
  if (previewType === 'image' && file.url) {
    return (
      <button type="button" onClick={onClick} disabled={!isClickable} className={cardBase}>
        <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
        <ExtBadge ext={ext} />
        {isClickable && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
            <Search className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
      </button>
    );
  }

  // PDF thumbnail — render actual first page
  if (previewType === 'pdf' && file.url) {
    return (
      <button type="button" onClick={onClick} disabled={!isClickable} className={cardBase}>
        <div className="w-full h-full overflow-hidden pointer-events-none">
          <object
            data={`${file.url}#page=1&view=FitH`}
            type="application/pdf"
            className="w-[200%] h-[200%] origin-top-left scale-50"
            aria-label={file.name}
          >
            {/* Fallback if PDF can't render */}
            <div className="flex items-center justify-center w-full h-full">
              <FileIcon className="h-8 w-8 text-muted-foreground/40" />
            </div>
          </object>
        </div>
        <ExtBadge ext={ext} />
        {isClickable && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-colors">
            <Search className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
      </button>
    );
  }

  // Generic file — icon + extension badge in corner
  return (
    <button type="button" onClick={onClick} disabled={!isClickable} className={cardBase}>
      <div className="flex-1 flex items-center justify-center">
        <FileIcon className="h-8 w-8 text-muted-foreground/40" />
      </div>

      {/* Filename + size at bottom */}
      <div className="w-full text-center min-w-0 px-2 pb-2 space-y-0.5">
        <p className="text-[10px] text-foreground truncate leading-tight" title={file.name}>
          {file.name}
        </p>
        {file.size != null && file.size > 0 && (
          <p className="text-[9px] text-muted-foreground leading-tight">
            {formatFileSize(file.size)}
          </p>
        )}
      </div>

      <ExtBadge ext={ext} />
    </button>
  );
}
