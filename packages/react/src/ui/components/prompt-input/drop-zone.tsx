import { Upload } from 'lucide-react';
import { cn } from '../../lib/cn';
import { usePromptInputDropZone } from './context';
import type { HTMLAttributes } from 'react';

export type PromptInputDropZoneProps = HTMLAttributes<HTMLDivElement> & {
  label?: string;
};

export const PromptInputDropZone = ({
  label = 'Drop files here',
  className,
  ...props
}: PromptInputDropZoneProps) => {
  const { isDraggingOver } = usePromptInputDropZone();

  return (
    <div
      className={cn(
        'absolute inset-0 z-10 pointer-events-none',
        'flex flex-col items-center justify-center gap-2',
        'border-2 border-dashed border-primary rounded-xl',
        'bg-primary/5 backdrop-blur-[2px]',
        'transition-opacity duration-200',
        isDraggingOver ? 'opacity-100' : 'opacity-0',
        className,
      )}
      aria-hidden={!isDraggingOver}
      {...props}
    >
      <Upload className="size-6 text-primary" />
      <span className="text-sm font-medium text-primary">{label}</span>
    </div>
  );
};
