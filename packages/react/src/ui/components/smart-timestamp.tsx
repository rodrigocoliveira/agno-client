import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../primitives/tooltip';
import { formatSmartTimestamp, formatFullTimestamp } from '../lib/format-timestamp';

export interface SmartTimestampProps {
  date: Date;
  /** Override the short display text (e.g. custom formatTimestamp prop) */
  formatShort?: (date: Date) => string;
  className?: string;
}

export function SmartTimestamp({ date, formatShort, className }: SmartTimestampProps) {
  const shortText = formatShort ? formatShort(date) : formatSmartTimestamp(date);
  const fullText = formatFullTimestamp(date);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={className}>{shortText}</span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{fullText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
