import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle } from '../primitives/dialog';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/cn';

export interface LightboxImage {
  url: string;
  alt?: string;
}

export interface ImageLightboxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: LightboxImage[];
  initialIndex?: number;
}

export function ImageLightbox({ open, onOpenChange, images, initialIndex = 0 }: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const hasMultiple = images.length > 1;

  useEffect(() => {
    if (open) setCurrentIndex(initialIndex);
  }, [open, initialIndex]);

  const goNext = useCallback(() => {
    setCurrentIndex((i) => (i + 1) % images.length);
  }, [images.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (!open || !hasMultiple) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, hasMultiple, goNext, goPrev]);

  if (images.length === 0) return null;
  const current = images[currentIndex];
  if (!current) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent variant="lightbox" aria-describedby={undefined}>
        <DialogTitle className="sr-only">
          {current.alt || `Image ${currentIndex + 1} of ${images.length}`}
        </DialogTitle>
        <div className="relative flex items-center justify-center">
          <img
            src={current.url}
            alt={current.alt || 'Image preview'}
            className="max-h-[85vh] max-w-full object-contain rounded-md"
          />

          {hasMultiple && (
            <>
              <button
                type="button"
                onClick={goPrev}
                className={cn(
                  'absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white',
                  'hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors',
                )}
              >
                <ChevronLeft className="h-5 w-5" />
                <span className="sr-only">Previous image</span>
              </button>
              <button
                type="button"
                onClick={goNext}
                className={cn(
                  'absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white',
                  'hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors',
                )}
              >
                <ChevronRight className="h-5 w-5" />
                <span className="sr-only">Next image</span>
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white">
                {currentIndex + 1} / {images.length}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
