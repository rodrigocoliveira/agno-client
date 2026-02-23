import { useState, useEffect, useRef } from 'react';
import { useAgnoChatContext } from './context';
import { cn } from '../../lib/cn';

export interface AgnoChatErrorBarProps {
  className?: string;
  /** Override the displayed error message with a user-friendly string */
  text?: string;
  /** Auto-hide timeout in ms (default 8000). Set 0 to disable auto-hide. */
  timeout?: number;
}

export function AgnoChatErrorBar({ className, text, timeout = 8000 }: AgnoChatErrorBarProps) {
  const { error, executionError } = useAgnoChatContext();
  const [hidden, setHidden] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rawMessage = error || executionError;

  // Reset hidden state and start timer when the error changes
  useEffect(() => {
    if (!rawMessage) return;

    setHidden(false);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (timeout > 0) {
      timerRef.current = setTimeout(() => {
        setHidden(true);
      }, timeout);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [rawMessage, timeout]);

  if (!rawMessage || hidden) return null;

  const displayMessage = text ?? rawMessage;

  return (
    <div className={cn('px-4 py-2.5 bg-destructive/5 border-t border-destructive/20', className)}>
      <p className="text-sm text-destructive max-w-3xl mx-auto">{displayMessage}</p>
    </div>
  );
}
