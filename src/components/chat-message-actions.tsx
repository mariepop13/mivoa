'use client';

import { MessageEditButton } from '@/components/message-edit-button';
import { MessageActionsMenu } from '@/components/message-actions-menu';
import type { ChatMessage } from '@/ai/types/chat';

interface ChatMessageActionsProps {
  message: ChatMessage;
  isUser: boolean;
  canEdit: boolean;
  isTyping: boolean;
  onEditClick: () => void;
  onDeleteClick?: () => void;
  onRegenerateClick?: () => void;
}

export function ChatMessageActions({
  message,
  isUser,
  canEdit,
  isTyping,
  onEditClick,
  onDeleteClick,
  onRegenerateClick,
}: ChatMessageActionsProps): React.JSX.Element {
  return (
    <div className="flex items-start gap-1 ml-2">
      {isUser && canEdit && (
        <MessageEditButton
          onClick={onEditClick}
          disabled={isTyping}
        />
      )}
      <MessageActionsMenu
        messageRole={message.role}
        onEdit={isUser && canEdit ? onEditClick : undefined}
        onDelete={isUser && onDeleteClick ? onDeleteClick : undefined}
        onRegenerate={onRegenerateClick ? onRegenerateClick : undefined}
        disabled={isTyping}
      />
    </div>
  );
}

