import { Upload } from 'lucide-react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/cn';
import { usePromptInputDropZone } from './context';
import type { HTMLAttributes, RefObject } from 'react';

export type PromptInputDropZoneProps = HTMLAttributes<HTMLDivElement> & {
  label?: string;
  container?: RefObject<HTMLElement | null>;
};

export const PromptInputDropZone = ({
  label = 'Drop files here',
  className,
  container,
  ...props
}: PromptInputDropZoneProps) => {
  const { isDraggingOver } = usePromptInputDropZone();

  const overlay = (
    <div
      className={cn(
        'absolute inset-0 z-10 pointer-events-none',
        'flex flex-col items-center justify-center gap-2',
        'border-2 border-dashed border-primary rounded-xl',
        'bg-primary/5 backdrop-blur-[2px] text-primary',
        'transition-opacity duration-200',
        isDraggingOver ? 'opacity-100' : 'opacity-0',
        className,
      )}
      aria-hidden={!isDraggingOver}
      {...props}
    >
      <Upload className="size-14" />
      <span className="text-sm font-medium mt-2">{label}</span>
    </div>
  );

  if (container?.current) {
    return createPortal(overlay, container.current);
  }

  return overlay;
};
