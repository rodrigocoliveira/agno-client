import { cn } from '../lib/cn';
import { getFilePreviewType, formatFileSize, getFileExtension } from '../lib/file-utils';
import { Search } from 'lucide-react';

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

const extColorMap: Record<string, string> = {
  pdf: 'bg-red-500/15 text-red-700 dark:text-red-400',
  doc: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  docx: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  xls: 'bg-green-500/15 text-green-700 dark:text-green-400',
  xlsx: 'bg-green-500/15 text-green-700 dark:text-green-400',
  csv: 'bg-green-500/15 text-green-700 dark:text-green-400',
  ppt: 'bg-orange-500/15 text-orange-700 dark:text-orange-400',
  pptx: 'bg-orange-500/15 text-orange-700 dark:text-orange-400',
  zip: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400',
  rar: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400',
  txt: 'bg-gray-500/15 text-gray-700 dark:text-gray-400',
  json: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  mp3: 'bg-purple-500/15 text-purple-700 dark:text-purple-400',
  mp4: 'bg-pink-500/15 text-pink-700 dark:text-pink-400',
  png: 'bg-teal-500/15 text-teal-700 dark:text-teal-400',
  jpg: 'bg-teal-500/15 text-teal-700 dark:text-teal-400',
  jpeg: 'bg-teal-500/15 text-teal-700 dark:text-teal-400',
  svg: 'bg-teal-500/15 text-teal-700 dark:text-teal-400',
};

function getExtColor(ext: string): string {
  return extColorMap[ext] || 'bg-muted text-muted-foreground';
}

export function FilePreviewCard({ file, onClick, className }: FilePreviewCardProps) {
  const previewType = getFilePreviewType(file.type);
  const isClickable = !!onClick;
  const ext = getFileExtension(file.name);

  // Image with thumbnail
  if (previewType === 'image' && file.url) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={!isClickable}
        className={cn(
          'group relative flex flex-col overflow-hidden rounded-xl border border-border bg-muted/30 w-28 h-28',
          isClickable && 'cursor-pointer hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors',
          className,
        )}
      >
        <img
          src={file.url}
          alt={file.name}
          className="w-full h-full object-cover"
        />
        {/* Extension badge */}
        {ext && (
          <span className={cn(
            'absolute bottom-1.5 left-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase leading-none',
            getExtColor(ext),
          )}>
            {ext}
          </span>
        )}
        {isClickable && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
            <Search className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
      </button>
    );
  }

  // Non-image file: uniform square card with extension badge
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isClickable}
      className={cn(
        'group relative flex flex-col items-center justify-between overflow-hidden rounded-xl border border-border bg-muted/30 w-28 h-28 p-2.5',
        isClickable && 'cursor-pointer hover:bg-muted/50 hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors',
        className,
      )}
    >
      {/* Extension badge — large, centered */}
      <div className="flex-1 flex items-center justify-center">
        <span className={cn(
          'rounded-lg px-2.5 py-1.5 text-sm font-bold uppercase leading-none',
          ext ? getExtColor(ext) : 'bg-muted text-muted-foreground',
        )}>
          {ext || 'FILE'}
        </span>
      </div>

      {/* Filename + size at bottom */}
      <div className="w-full text-center min-w-0 space-y-0.5">
        <p className="text-[10px] text-foreground truncate leading-tight" title={file.name}>
          {file.name}
        </p>
        {file.size != null && file.size > 0 && (
          <p className="text-[9px] text-muted-foreground leading-tight">
            {formatFileSize(file.size)}
          </p>
        )}
      </div>
    </button>
  );
}
