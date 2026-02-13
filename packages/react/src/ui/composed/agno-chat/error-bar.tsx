import { useAgnoChatContext } from './context';
import { cn } from '../../lib/cn';

export interface AgnoChatErrorBarProps {
  className?: string;
}

export function AgnoChatErrorBar({ className }: AgnoChatErrorBarProps) {
  const { error, executionError } = useAgnoChatContext();

  const message = error || executionError;
  if (!message) return null;

  return (
    <div className={cn('px-4 py-2.5 bg-destructive/5 border-t border-destructive/20', className)}>
      <p className="text-sm text-destructive max-w-3xl mx-auto">{message}</p>
    </div>
  );
}
