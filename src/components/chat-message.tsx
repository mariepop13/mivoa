'use client';

import { memo, useState } from 'react';
import type { ChatMessage as ChatMessageType } from '@/ai/types/chat';
import { canEditMessage } from '@/utils/conversation-utils';
import { createMessageHandlers } from '@/components/chat-message-handlers';
import { ChatMessageContent } from '@/components/chat-message-content';
import { ChatMessageEditedIndicator } from '@/components/chat-message-edited-indicator';
import { ChatMessageActions } from '@/components/chat-message-actions';
import { ChatMessageDialogs } from '@/components/chat-message-dialogs';

interface ChatMessageProps {
  message: ChatMessageType;
  messageIndex: number;
  totalMessages: number;
  isTyping: boolean;
  onEdit?: (messageIndex: number, newContent: string) => Promise<void>;
  onDelete?: (messageIndex: number) => Promise<void>;
  onRegenerate?: (messageIndex: number) => Promise<void>;
  onUndoEdit?: (messageIndex: number) => Promise<void>;
}

const MAX_MESSAGE_WIDTH_PERCENT = 80;

function ChatMessageComponent({
  message,
  messageIndex,
  totalMessages,
  isTyping,
  onEdit,
  onDelete,
  onRegenerate,
  onUndoEdit,
}: ChatMessageProps): React.JSX.Element {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [showDeleteConfirmationDialog, setShowDeleteConfirmationDialog] = useState(false);
  const [showRegenerateConfirmationDialog, setShowRegenerateConfirmationDialog] = useState(false);
  const [showDiffDialog, setShowDiffDialog] = useState(false);

  const isUser = message.role === 'user';
  const isEdited = Boolean(message.editedAt);
  const canEdit = canEditMessage(message, isTyping) && Boolean(onEdit);
  const canUndo = Boolean(isEdited && message.originalContent && onUndoEdit && !isTyping);

  const handlers = createMessageHandlers({
    messageIndex,
    onEdit,
    onDelete,
    onRegenerate,
    onUndoEdit,
    onEditDialogClose: () => setShowEditDialog(false),
  });

  const handleEditClick = () => {
    setShowConfirmationDialog(true);
  };

  const handleConfirmationConfirm = () => {
    setShowConfirmationDialog(false);
    setShowEditDialog(true);
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirmationDialog(true);
  };

  const handleRegenerateClick = () => {
    setShowRegenerateConfirmationDialog(true);
  };

  return (
    <>
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 group`}>
      <div
        style={{ maxWidth: `${MAX_MESSAGE_WIDTH_PERCENT}%` }}
          className={`rounded-lg px-4 py-3 relative ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground border border-border'
        }`}
      >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <ChatMessageContent message={message} isUser={isUser} />
              {isEdited && (
                <ChatMessageEditedIndicator
                  isUser={isUser}
                  onViewDiff={() => setShowDiffDialog(true)}
                  onUndo={handlers.handleUndoEdit}
                  canUndo={canUndo}
                />
              )}
            </div>
            <ChatMessageActions
              message={message}
              isUser={isUser}
              canEdit={canEdit}
              isTyping={isTyping}
              onEditClick={handleEditClick}
              onDeleteClick={onDelete ? handleDeleteClick : undefined}
              onRegenerateClick={onRegenerate ? handleRegenerateClick : undefined}
            />
        </div>
        </div>
      </div>
      <ChatMessageDialogs
        message={message}
        messageIndex={messageIndex}
        totalMessages={totalMessages}
        showEditDialog={showEditDialog}
        showConfirmationDialog={showConfirmationDialog}
        showDeleteConfirmationDialog={showDeleteConfirmationDialog}
        showRegenerateConfirmationDialog={showRegenerateConfirmationDialog}
        showDiffDialog={showDiffDialog}
        onEditDialogChange={setShowEditDialog}
        onConfirmationDialogChange={setShowConfirmationDialog}
        onDeleteConfirmationDialogChange={setShowDeleteConfirmationDialog}
        onRegenerateConfirmationDialogChange={setShowRegenerateConfirmationDialog}
        onDiffDialogChange={setShowDiffDialog}
        onConfirmationConfirm={handleConfirmationConfirm}
        onEditSave={handlers.handleEditSave}
        onDeleteConfirm={handlers.handleDeleteConfirm}
        onRegenerateConfirm={handlers.handleRegenerateConfirm}
      />
    </>
  );
}

export const ChatMessage = memo(ChatMessageComponent);

