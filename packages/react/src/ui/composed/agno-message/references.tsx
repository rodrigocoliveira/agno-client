import { FileText } from 'lucide-react';
import { cn } from '../../lib/cn';
import { useAgnoMessageContext } from './context';

export function AgnoMessageReferences() {
  const { message, classNames } = useAgnoMessageContext();
  const references = message.extra_data?.references;
  if (!references || references.length === 0) return null;

  return (
    <div className={cn('space-y-2 pt-1', classNames?.assistant?.references)}>
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <FileText className="h-3.5 w-3.5" />
        References ({references.length})
      </div>
      <div className="space-y-2">
        {references.map((refData, idx) => (
          <div key={idx} className="text-xs space-y-1.5">
            {refData.query && (
              <div className="font-medium text-foreground">Query: {refData.query}</div>
            )}
            {refData.references.map((ref, refIdx) => (
              <div key={refIdx} className="bg-muted/50 border border-border p-2.5 rounded-lg">
                <div className="italic text-muted-foreground mb-1">"{ref.content}"</div>
                <div className="text-muted-foreground/70">
                  Source: {ref.name} (chunk {ref.meta_data.chunk}/{ref.meta_data.chunk_size})
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
