import { Lightbulb } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../primitives/accordion';
import { cn } from '../../lib/cn';
import { useAgnoMessageContext } from './context';

export function AgnoMessageReasoning() {
  const { message, classNames } = useAgnoMessageContext();
  const steps = message.extra_data?.reasoning_steps;
  if (!steps || steps.length === 0) return null;

  return (
    <div className={cn('space-y-2 pt-1', classNames?.assistant?.reasoning)}>
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Lightbulb className="h-3.5 w-3.5" />
        Reasoning ({steps.length} steps)
      </div>
      <Accordion type="multiple" className="w-full">
        {steps.map((step, idx) => (
          <AccordionItem key={idx} value={`reasoning-${idx}`} className="border-muted">
            <AccordionTrigger className="text-xs py-1.5 hover:no-underline">
              {step.title || `Step ${idx + 1}`}
            </AccordionTrigger>
            <AccordionContent className="space-y-1.5 text-xs text-muted-foreground">
              {step.action && (
                <div>
                  <span className="font-medium text-foreground">Action:</span> {step.action}
                </div>
              )}
              {step.reasoning && (
                <div>
                  <span className="font-medium text-foreground">Reasoning:</span> {step.reasoning}
                </div>
              )}
              {step.result && (
                <div>
                  <span className="font-medium text-foreground">Result:</span> {step.result}
                </div>
              )}
              {step.confidence !== undefined && (
                <div>
                  <span className="font-medium text-foreground">Confidence:</span>{' '}
                  {(step.confidence * 100).toFixed(1)}%
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
