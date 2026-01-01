'use client';

import { useContext, memo, useState } from 'react';
import { format } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';
import ReactMarkdown from 'react-markdown';
import type { ChatMessage as ChatMessageType } from '@/ai/types/chat';
import { LanguageContext } from '@/context/LanguageContext';
import { MessageEditButton } from '@/components/message-edit-button';
import { MessageEditDialog } from '@/components/message-edit-dialog';
import { MessageEditConfirmationDialog } from '@/components/message-edit-confirmation-dialog';
import { MessageDeleteConfirmationDialog } from '@/components/message-delete-confirmation-dialog';
import { MessageRegenerateConfirmationDialog } from '@/components/message-regenerate-confirmation-dialog';
import { MessageDiffDialog } from '@/components/message-diff-dialog';
import { MessageActionsMenu } from '@/components/message-actions-menu';
import { useTranslation } from '@/hooks/use-translation';
import { canEditMessage } from '@/utils/conversation-utils';

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
  const { language } = useContext(LanguageContext);
  const { t } = useTranslation();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [showDeleteConfirmationDialog, setShowDeleteConfirmationDialog] = useState(false);
  const [showRegenerateConfirmationDialog, setShowRegenerateConfirmationDialog] = useState(false);
  const [showDiffDialog, setShowDiffDialog] = useState(false);

  const dateLocale = language === 'fr' ? fr : enUS;
  const timestampDate = message.timestamp instanceof Timestamp 
    ? message.timestamp.toDate() 
    : message.timestamp;
  const formattedTime = format(timestampDate, 'HH:mm:ss', { locale: dateLocale });

  const isEdited = Boolean(message.editedAt);
  const canUndo = isEdited && message.originalContent && !!onUndoEdit && !isTyping;

  const isUser = message.role === 'user';
  const canEdit = canEditMessage(message, isTyping) && !!onEdit;

  const handleEditClick = () => {
    setShowConfirmationDialog(true);
  };

  const handleConfirmationConfirm = () => {
    setShowConfirmationDialog(false);
    setShowEditDialog(true);
  };

  const handleEditSave = async (newContent: string) => {
    if (onEdit) {
      try {
        await onEdit(messageIndex, newContent);
        setShowEditDialog(false);
      } catch (err) {
        console.error('Failed to edit message:', err);
      }
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirmationDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (onDelete) {
      try {
        await onDelete(messageIndex);
      } catch (err) {
        console.error('Failed to delete message:', err);
      }
    }
  };

  const handleRegenerateClick = () => {
    setShowRegenerateConfirmationDialog(true);
  };

  const handleRegenerateConfirm = async () => {
    if (onRegenerate) {
      try {
        await onRegenerate(messageIndex);
      } catch (err) {
        console.error('Failed to regenerate:', err);
      }
    }
  };

  const handleUndoEdit = async () => {
    if (onUndoEdit) {
      try {
        await onUndoEdit(messageIndex);
      } catch (err) {
        console.error('Failed to undo edit:', err);
      }
    }
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
        <div className="text-sm break-words">
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0 whitespace-pre-wrap">{children}</p>,
              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
              em: ({ children }) => <em className="italic">{children}</em>,
              ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
              li: ({ children }) => <li className="ml-2">{children}</li>,
              code: ({ children, className }) => {
                const isInline = !className;
                return isInline ? (
                  <code className="bg-muted/50 px-1 py-0.5 rounded text-xs font-mono">{children}</code>
                ) : (
                  <code className="block bg-muted/50 p-2 rounded text-xs font-mono overflow-x-auto">{children}</code>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
              <div className="flex items-center gap-2 mt-2">
        <div
                  className={`text-xs ${
            isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
          }`}
        >
          {formattedTime}
                </div>
                {isEdited && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setShowDiffDialog(true)}
                      className={`text-xs px-1.5 py-0.5 rounded ${
                        isUser
                          ? 'bg-primary-foreground/20 text-primary-foreground/80 hover:bg-primary-foreground/30'
                          : 'bg-muted-foreground/20 text-muted-foreground hover:bg-muted-foreground/30'
                      } cursor-pointer`}
                      title={t('viewChanges', 'View changes')}
                    >
                      {t('edited')}
                    </button>
                    {canUndo && (
                      <button
                        onClick={handleUndoEdit}
                        className={`text-xs px-1.5 py-0.5 rounded underline ${
                          isUser
                            ? 'text-primary-foreground/80 hover:text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                        title={t('undoEdit', 'Undo edit')}
                      >
                        {t('undo', 'Undo')}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-start gap-1 ml-2">
              {isUser && canEdit && (
                <MessageEditButton
                  onClick={handleEditClick}
                  disabled={isTyping}
                />
              )}
              <MessageActionsMenu
                messageRole={message.role}
                onEdit={isUser && canEdit ? handleEditClick : undefined}
                onDelete={isUser && onDelete ? handleDeleteClick : undefined}
                onRegenerate={onRegenerate ? handleRegenerateClick : undefined}
                disabled={isTyping}
              />
            </div>
          </div>
        </div>
      </div>
      <MessageEditConfirmationDialog
        open={showConfirmationDialog}
        onOpenChange={setShowConfirmationDialog}
        onConfirm={handleConfirmationConfirm}
        messagesToDeleteCount={Math.max(0, totalMessages - messageIndex - 1)}
      />
      <MessageEditDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        initialContent={message.content}
        onSave={handleEditSave}
      />
      <MessageDeleteConfirmationDialog
        open={showDeleteConfirmationDialog}
        onOpenChange={setShowDeleteConfirmationDialog}
        onConfirm={handleDeleteConfirm}
        messagesToDeleteCount={Math.max(0, totalMessages - messageIndex - 1)}
      />
      <MessageRegenerateConfirmationDialog
        open={showRegenerateConfirmationDialog}
        onOpenChange={setShowRegenerateConfirmationDialog}
        onConfirm={handleRegenerateConfirm}
        messagesToDeleteCount={Math.max(0, totalMessages - messageIndex - 1)}
      />
      {message.originalContent && (
        <MessageDiffDialog
          open={showDiffDialog}
          onOpenChange={setShowDiffDialog}
          originalContent={message.originalContent}
          editedContent={message.content}
        />
      )}
    </>
  );
}

export const ChatMessage = memo(ChatMessageComponent);

