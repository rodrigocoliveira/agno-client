import { cn } from '../lib/cn';
import { getFilePreviewType, formatFileSize } from '../lib/file-utils';
import { FileIcon, FileText, Search } from 'lucide-react';

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

export function FilePreviewCard({ file, onClick, className }: FilePreviewCardProps) {
  const previewType = getFilePreviewType(file.type);
  const isClickable = !!onClick;

  if (previewType === 'image' && file.url) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={!isClickable}
        className={cn(
          'group relative overflow-hidden rounded-lg border border-border bg-muted/30',
          isClickable && 'cursor-pointer hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors',
          className,
        )}
      >
        <img
          src={file.url}
          alt={file.name}
          className="h-24 w-full object-cover"
        />
        {isClickable && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
            <Search className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
      </button>
    );
  }

  const Icon = previewType === 'pdf' ? FileText : FileIcon;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isClickable}
      className={cn(
        'flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs bg-muted/30',
        isClickable && 'cursor-pointer hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors',
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className="truncate max-w-[180px] text-foreground">{file.name}</span>
      {file.size != null && file.size > 0 && (
        <span className="text-muted-foreground/70 whitespace-nowrap">
          ({formatFileSize(file.size)})
        </span>
      )}
    </button>
  );
}
