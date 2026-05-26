import { Response } from '../../components/response';
import { useAgnoMessageContext } from './context';

export function AgnoMessageContent() {
  const { message } = useAgnoMessageContext();
  if (!message.content) return null;
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-muted prose-pre:border prose-pre:border-border">
      <Response>{message.content}</Response>
    </div>
  );
}
