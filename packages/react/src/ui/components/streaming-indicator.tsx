import { cn } from '../lib/cn';
import { Bot } from 'lucide-react';
import type { HTMLAttributes, ReactNode } from 'react';

export type StreamingIndicatorProps = HTMLAttributes<HTMLDivElement> & {
  icon?: ReactNode;
};

export function StreamingIndicator({ className, icon, ...props }: StreamingIndicatorProps) {
  return (
    <div className={cn('flex items-start gap-3 px-1', className)} {...props}>
      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
        {icon ?? <Bot className="h-4 w-4 text-primary" />}
      </div>
      <div className="flex items-center gap-1.5 pt-2.5">
        <span className="h-2 w-2 rounded-full bg-primary/60 animate-pulse" />
        <span className="h-2 w-2 rounded-full bg-primary/60 animate-pulse [animation-delay:150ms]" />
        <span className="h-2 w-2 rounded-full bg-primary/60 animate-pulse [animation-delay:300ms]" />
      </div>
    </div>
  );
}
