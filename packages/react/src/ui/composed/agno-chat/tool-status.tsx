import { useAgnoChatContext } from './context';
import { cn } from '../../lib/cn';
import { Loader2, Wrench } from 'lucide-react';

export interface AgnoChatToolStatusProps {
  className?: string;
}

export function AgnoChatToolStatus({ className }: AgnoChatToolStatusProps) {
  const { isPaused, isExecuting, pendingTools } = useAgnoChatContext();

  if (!isPaused && !isExecuting) return null;

  return (
    <div className={cn('px-4 py-2.5 border-t border-border bg-primary/5', className)}>
      <div className="flex items-center gap-2.5 text-sm max-w-3xl mx-auto">
        {isExecuting ? (
          <>
            <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
              <Loader2 className="h-3 w-3 animate-spin text-primary" />
            </div>
            <span className="text-muted-foreground">
              Executing{' '}
              <span className="font-medium text-foreground">{pendingTools.length}</span> tool
              {pendingTools.length !== 1 ? 's' : ''}...
            </span>
          </>
        ) : (
          <>
            <div className="h-5 w-5 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Wrench className="h-3 w-3 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-muted-foreground">
              Preparing{' '}
              <span className="font-medium text-foreground">{pendingTools.length}</span> tool
              {pendingTools.length !== 1 ? 's' : ''}...
            </span>
          </>
        )}
      </div>
    </div>
  );
}
