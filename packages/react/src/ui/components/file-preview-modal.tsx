import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../primitives/dialog';
import { formatFileSize, isPreviewable, getFilePreviewType } from '../lib/file-utils';
import { Download, FileIcon } from 'lucide-react';
import type { FilePreviewFile } from './file-preview-card';

export interface FilePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: FilePreviewFile | null;
}

export function FilePreviewModal({ open, onOpenChange, file }: FilePreviewModalProps) {
  if (!file) return null;

  const previewType = getFilePreviewType(file.type);
  const canPreview = isPreviewable(file.type) && !!file.url;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {previewType === 'image' && file.url ? (
        <DialogContent variant="lightbox" aria-describedby={undefined}>
          <DialogTitle className="sr-only">{file.name}</DialogTitle>
          <img
            src={file.url}
            alt={file.name}
            className="max-h-[85vh] max-w-full object-contain rounded-md"
          />
        </DialogContent>
      ) : previewType === 'pdf' && file.url ? (
        <DialogContent variant="lightbox" className="w-[80vw] h-[85vh]" aria-describedby={undefined}>
          <DialogTitle className="sr-only">{file.name}</DialogTitle>
          <object
            data={file.url}
            type="application/pdf"
            className="w-full h-full rounded-md"
          >
            <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
              <p className="text-sm">Unable to display PDF</p>
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <Download className="h-4 w-4" />
                Download {file.name}
              </a>
            </div>
          </object>
        </DialogContent>
      ) : (
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileIcon className="h-5 w-5 text-muted-foreground" />
              {file.name}
            </DialogTitle>
            <DialogDescription>
              {file.size != null && file.size > 0 && <span>{formatFileSize(file.size)}</span>}
              {!canPreview && <span> &middot; Preview not available for this file type</span>}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-3">
            <FileIcon className="h-12 w-12" />
            <p className="text-sm">Preview not available</p>
            {file.url && /^https?:\/\//i.test(file.url) && (
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <Download className="h-4 w-4" />
                Download file
              </a>
            )}
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}
