import { useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useAgnoChatContext } from './context';
import { cn } from '../../lib/cn';

export interface AgnoChatErrorBarProps {
  className?: string;
  /** Override the displayed error message with a user-friendly string */
  text?: string;
  /** Icon element rendered before the message */
  icon?: ReactNode;
  /** Show a dismiss button to manually close the bar */
  dismissible?: boolean;
  /** Auto-hide timeout in ms (default 10000). Set 0 to disable auto-hide. */
  timeout?: number;
  /** Fully custom content — when provided, replaces the default icon + text layout */
  children?: ReactNode | ((error: string) => ReactNode);
}

export function AgnoChatErrorBar({
  className,
  text,
  icon,
  dismissible = false,
  timeout = 10000,
  children,
}: AgnoChatErrorBarProps) {
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

  // Render function children or ReactNode children
  const renderContent = () => {
    if (children) {
      return typeof children === 'function' ? children(rawMessage) : children;
    }

    return (
      <div className="flex items-center gap-2 max-w-3xl mx-auto">
        {icon && <span className="shrink-0">{icon}</span>}
        <p className="text-sm text-destructive flex-1">{displayMessage}</p>
        {dismissible && (
          <button
            type="button"
            onClick={() => setHidden(true)}
            className="shrink-0 text-destructive/60 hover:text-destructive transition-colors"
            aria-label="Dismiss error"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        )}
      </div>
    );
  };

  return (
    <div
      className={cn(
        'px-4 py-2.5 bg-destructive/5 border-t border-destructive/20',
        className,
      )}
    >
      {renderContent()}
    </div>
  );
}
