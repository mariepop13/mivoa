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
import { MessageActionsMenu } from '@/components/message-actions-menu';
import { useTranslation } from '@/hooks/use-translation';
import { canEditMessage } from '@/utils/conversation-utils';

interface ChatMessageProps {
  message: ChatMessageType;
  messageIndex: number;
  isTyping: boolean;
  onEdit?: (messageIndex: number, newContent: string) => Promise<void>;
  onDelete?: (messageIndex: number) => Promise<void>;
  onRegenerate?: (messageIndex: number) => Promise<void>;
}

const MAX_MESSAGE_WIDTH_PERCENT = 80;

function ChatMessageComponent({
  message,
  messageIndex,
  isTyping,
  onEdit,
  onDelete,
  onRegenerate,
}: ChatMessageProps): React.JSX.Element {
  const { language } = useContext(LanguageContext);
  const { t } = useTranslation();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);

  const dateLocale = language === 'fr' ? fr : enUS;
  const timestampDate = message.timestamp instanceof Timestamp 
    ? message.timestamp.toDate() 
    : message.timestamp;
  const formattedTime = format(timestampDate, 'HH:mm:ss', { locale: dateLocale });

  const isEdited = Boolean(message.editedAt);

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
      } catch (err) {
        console.error('Failed to edit message:', err);
      }
    }
  };

  const handleDelete = async () => {
    if (onDelete) {
      try {
        await onDelete(messageIndex);
      } catch (err) {
        console.error('Failed to delete message:', err);
      }
    }
  };

  const handleRegenerate = async () => {
    if (onRegenerate) {
      try {
        await onRegenerate(messageIndex);
      } catch (err) {
        console.error('Failed to regenerate:', err);
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
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded ${
                      isUser
                        ? 'bg-primary-foreground/20 text-primary-foreground/80'
                        : 'bg-muted-foreground/20 text-muted-foreground'
                    }`}
                  >
                    {t('edited')}
                  </span>
                )}
              </div>
            </div>
            {isUser && (
              <div className="flex items-start gap-1 ml-2">
                {canEdit && (
                  <MessageEditButton
                    onClick={handleEditClick}
                    disabled={isTyping}
                  />
                )}
                <MessageActionsMenu
                  messageRole={message.role}
                  onEdit={canEdit ? handleEditClick : undefined}
                  onDelete={onDelete ? handleDelete : undefined}
                  onRegenerate={onRegenerate ? handleRegenerate : undefined}
                  disabled={isTyping}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      <MessageEditConfirmationDialog
        open={showConfirmationDialog}
        onOpenChange={setShowConfirmationDialog}
        onConfirm={handleConfirmationConfirm}
      />
      <MessageEditDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        initialContent={message.content}
        onSave={handleEditSave}
      />
    </>
  );
}

export const ChatMessage = memo(ChatMessageComponent);

