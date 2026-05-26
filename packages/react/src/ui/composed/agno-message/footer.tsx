import { AlertCircle } from 'lucide-react';
import { SmartTimestamp } from '../../components/smart-timestamp';
import { formatSmartTimestamp } from '../../lib/format-timestamp';
import { cn } from '../../lib/cn';
import { useAgnoMessageContext } from './context';

export interface AgnoMessageFooterProps {
  /** Show timestamp (default: true) */
  showTimestamp?: boolean;
}

export function AgnoMessageFooter({ showTimestamp = true }: AgnoMessageFooterProps = {}) {
  const { message, classNames, actions, isLastAssistantMessage, formatTimestamp } =
    useAgnoMessageContext();
  const hasError = message.streamingError;
  const isCustomTimestamp = !!formatTimestamp;
  const resolvedFormatTimestamp = formatTimestamp ?? formatSmartTimestamp;

  if (!actions?.assistant && !showTimestamp && !hasError) return null;

  return (
    <div className="flex items-center gap-2 pt-1">
      {actions?.assistant && (() => {
        const visibility = actions.visibility ?? 'visible';
        if (visibility === 'last-assistant' && !isLastAssistantMessage) return null;

        const useHover =
          visibility === 'hover' ||
          (visibility === 'hover-last-visible' && !isLastAssistantMessage);

        return (
          <div
            className={cn(
              'flex items-center gap-1 transition-opacity',
              useHover && 'opacity-0 group-hover/message:opacity-100',
              classNames?.assistant?.actions,
            )}
          >
            {actions.assistant(message)}
          </div>
        );
      })()}
      {hasError && (
        <span className="flex items-center gap-1 text-[11px] text-destructive">
          <AlertCircle className="h-3 w-3" />
          Error
        </span>
      )}
      {showTimestamp && (
        <SmartTimestamp
          date={new Date(message.created_at * 1000)}
          formatShort={isCustomTimestamp ? resolvedFormatTimestamp : undefined}
          className="text-[11px] text-muted-foreground"
        />
      )}
    </div>
  );
}
