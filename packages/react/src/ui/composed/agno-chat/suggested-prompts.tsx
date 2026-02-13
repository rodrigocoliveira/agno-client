import { useAgnoChatContext } from './context';
import { cn } from '../../lib/cn';
import type { SuggestedPrompt } from '../../types';

export interface AgnoChatSuggestedPromptsProps {
  className?: string;
  prompts: SuggestedPrompt[];
}

export function AgnoChatSuggestedPrompts({ className, prompts }: AgnoChatSuggestedPromptsProps) {
  const { handleSend } = useAgnoChatContext();

  if (prompts.length === 0) return null;

  return (
    <div className={cn('grid grid-cols-2 gap-2 w-full max-w-md', className)}>
      {prompts.map((prompt, idx) => (
        <button
          key={idx}
          onClick={() => handleSend(prompt.text)}
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-card hover:bg-accent/50 hover:border-primary/20 transition-all duration-200 text-left text-sm group"
        >
          {prompt.icon && (
            <span className="text-muted-foreground group-hover:text-primary transition-colors">
              {prompt.icon}
            </span>
          )}
          <span className="text-muted-foreground group-hover:text-foreground transition-colors text-xs leading-snug">
            {prompt.text}
          </span>
        </button>
      ))}
    </div>
  );
}
