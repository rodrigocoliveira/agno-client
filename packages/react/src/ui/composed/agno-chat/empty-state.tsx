import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

export interface AgnoChatEmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function AgnoChatEmptyState({ children, className, ...props }: AgnoChatEmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center gap-6', className)} {...props}>
      {children}
    </div>
  );
}
