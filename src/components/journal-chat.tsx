'use client';

import { useEffect, useRef, memo, useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import { useChatConversation } from '@/hooks/use-chat-conversation';
import { ChatMessagesList } from '@/components/chat-messages-list';
import { ChatInputForm } from '@/components/chat-input-form';
import { DraftDeleteButton } from '@/components/draft-delete-button';
import { DraftDeleteDialog } from '@/components/draft-delete-dialog';
import { useTranslation } from '@/hooks/use-translation';
import type { ChatMessage } from '@/ai/types/chat';
import type { JournalEntryData } from '@/hooks/use-journal-entries';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface JournalChatProps {
  onSummarize?: (conversationHistory: ConversationMessage[], draftId?: string | null) => void;
  isLoadingSummary?: boolean;
  dateKey?: string;
  onDraftSave?: (messages: ChatMessage[], draftId: string | null) => Promise<string | null>;
  onDraftDelete?: (draftId: string) => Promise<void>;
  initialDraft?: { messages: ChatMessage[]; draftId: string | null; entryId: string | null } | null;
  draftData?: (JournalEntryData & { id: string }) | null;
}

const MIN_MESSAGES_FOR_SUMMARY = 2;

function JournalChatComponent({ 
  onSummarize, 
  isLoadingSummary = false,
  dateKey,
  onDraftSave,
  onDraftDelete,
  initialDraft,
  draftData,
}: JournalChatProps): React.JSX.Element {
  const { t } = useTranslation();
  const { messages, isTyping, error, sendMessage, loadConversation, draftId } = useChatConversation({
    dateKey,
    onDraftSave,
    onDraftDelete,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasLoadedDraftRef = useRef<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const currentDraftId = initialDraft?.draftId || initialDraft?.entryId || null;
  const isDraftActive = Boolean(currentDraftId && draftData?.isDraft);

  useEffect(() => {
    if (initialDraft && hasLoadedDraftRef.current !== currentDraftId) {
      const loadedMessages: ChatMessage[] = initialDraft.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp instanceof Timestamp ? msg.timestamp.toDate() : msg.timestamp,
      }));
      loadConversation(loadedMessages, initialDraft.draftId || initialDraft.entryId || null);
      hasLoadedDraftRef.current = currentDraftId;
    } else if (!initialDraft && hasLoadedDraftRef.current !== null) {
      loadConversation([], null);
      hasLoadedDraftRef.current = null;
    }
  }, [initialDraft, loadConversation, currentDraftId]);

  const handleSummarize = () => {
    if (onSummarize) {
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp instanceof Timestamp ? msg.timestamp.toDate() : msg.timestamp,
      }));
      const entryId = initialDraft?.entryId || null;
      const finalDraftId = draftId || entryId;
      onSummarize(conversationHistory, finalDraftId);
    }
  };

  const handleDeleteDraft = async () => {
    if (!currentDraftId || !onDraftDelete) return;
    
    setIsDeleting(true);
    try {
      await onDraftDelete(currentDraftId);
      setDeleteDialogOpen(false);
      loadConversation([], null);
    } catch (error) {
      console.error('Failed to delete draft:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const hasUserMessages = messages.some((msg) => msg.role === 'user');
  const canSummarize = messages.length >= MIN_MESSAGES_FOR_SUMMARY && hasUserMessages;

  return (
    <div className="flex flex-col h-full">
      {isDraftActive && onDraftDelete && (
        <div className="border-b border-border/60 bg-card/50 backdrop-blur-sm px-4 sm:px-6 py-3 flex items-center justify-end">
          <DraftDeleteButton
            onClick={() => setDeleteDialogOpen(true)}
            isLoading={isDeleting}
            disabled={isDeleting || isTyping}
            variant="ghost"
            size="sm"
            aria-label={t('deleteDraft')}
          />
        </div>
      )}
      <ChatMessagesList messages={messages} isTyping={isTyping} error={error} />
      <div ref={messagesEndRef} id="messages-end" />
      <ChatInputForm
        onSend={sendMessage}
        isTyping={isTyping}
        canSummarize={canSummarize}
        onSummarize={handleSummarize}
        isLoadingSummary={isLoadingSummary}
      />
      {draftData && (
        <DraftDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleDeleteDraft}
          draft={draftData}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}

export const JournalChat = memo(JournalChatComponent);
