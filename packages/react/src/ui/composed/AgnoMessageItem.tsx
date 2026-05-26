import type { ChatMessage } from '@rodrigocoliveira/agno-types';
import type { AgnoMessageClassNames, AgnoMessageAvatars, AgnoMessageActions } from '../types';
import type { RenderTool } from './agno-chat/render-tool';
import { AgnoMessage } from './agno-message/message';

export interface AgnoMessageItemProps {
  message: ChatMessage;
  className?: string;
  classNames?: AgnoMessageClassNames;
  avatars?: AgnoMessageAvatars;
  actions?: AgnoMessageActions;
  isLastAssistantMessage?: boolean;
  /** Show reasoning steps (default: true). Omit `<AgnoMessage.Reasoning />` in custom compositions for finer control. */
  showReasoning?: boolean;
  /** Show references (default: true). Omit `<AgnoMessage.References />` in custom compositions for finer control. */
  showReferences?: boolean;
  showTimestamp?: boolean;
  showFilePreview?: boolean;
  showImageLightbox?: boolean;
  formatTimestamp?: (date: Date) => string;
  renderTool?: RenderTool;
}

/**
 * Default message renderer used by `<AgnoChat.Messages>`. Renders the standard
 * slot order: Reasoning → Media → Tools → Content → References → Footer.
 *
 * For custom orderings or omissions, use `<AgnoMessage>` directly with the
 * sub-components: `<AgnoMessage.Content />`, `<AgnoMessage.Tools />`, etc.
 */
export function AgnoMessageItem({
  message,
  className,
  classNames,
  avatars,
  actions,
  isLastAssistantMessage = false,
  showReasoning = true,
  showReferences = true,
  showTimestamp = true,
  showFilePreview = true,
  showImageLightbox = true,
  formatTimestamp,
  renderTool,
}: AgnoMessageItemProps) {
  return (
    <AgnoMessage
      message={message}
      className={className}
      classNames={classNames}
      avatars={avatars}
      actions={actions}
      isLastAssistantMessage={isLastAssistantMessage}
      showTimestamp={showTimestamp}
      showFilePreview={showFilePreview}
      showImageLightbox={showImageLightbox}
      formatTimestamp={formatTimestamp}
      renderTool={renderTool}
    >
      {showReasoning && <AgnoMessage.Reasoning />}
      <AgnoMessage.Media />
      <AgnoMessage.Tools />
      <AgnoMessage.Content />
      {showReferences && <AgnoMessage.References />}
      <AgnoMessage.Footer showTimestamp={showTimestamp} />
    </AgnoMessage>
  );
}
