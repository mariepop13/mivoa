'use client';

import { useEffect, useRef, memo, useState, useCallback } from 'react';
import { Timestamp } from 'firebase/firestore';
import { useChatConversation } from '@/hooks/use-chat-conversation';
import { ChatMessagesList } from '@/components/chat-messages-list';
import { ChatInputForm } from '@/components/chat-input-form';
import { DraftDeleteButton } from '@/components/draft-delete-button';
import { DraftDeleteDialog } from '@/components/draft-delete-dialog';
import { useTranslation } from '@/hooks/use-translation';
import type { ChatMessage } from '@/ai/types/chat';
import type { JournalEntryData } from '@/hooks/use-journal-entries';

const MIN_MESSAGES_FOR_SUMMARY = 2;

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

function convertTimestamp(timestamp: Date | Timestamp): Date {
  return timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;
}

function useConversationLoader(
  initialDraft: { messages: ChatMessage[]; draftId: string | null; entryId: string | null } | null | undefined,
  loadConversation: (messages: ChatMessage[], draftId: string | null) => void
): void {
  const hasLoadedDraftRef = useRef<string | null>(null);
  const currentDraftId = initialDraft?.draftId || initialDraft?.entryId || null;

  useEffect(() => {
    if (initialDraft && hasLoadedDraftRef.current !== currentDraftId) {
      const loadedMessages: ChatMessage[] = initialDraft.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
        timestamp: convertTimestamp(msg.timestamp),
      }));
      loadConversation(loadedMessages, currentDraftId);
      hasLoadedDraftRef.current = currentDraftId;
      return;
    }
    if (!initialDraft && hasLoadedDraftRef.current !== null) {
      loadConversation([], null);
      hasLoadedDraftRef.current = null;
    }
  }, [initialDraft, loadConversation, currentDraftId]);
}

function useDraftDeletionHandler(
  currentDraftId: string | null,
  onDraftDelete?: (draftId: string) => Promise<void>,
  loadConversation?: (messages: ChatMessage[], draftId: string | null) => void
) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteDraft = useCallback(async () => {
    if (!currentDraftId || !onDraftDelete) return;
    
    setIsDeleting(true);
    try {
      await onDraftDelete(currentDraftId);
      setDeleteDialogOpen(false);
      loadConversation?.([], null);
    } catch (error) {
      console.error('Failed to delete draft:', error);
    } finally {
      setIsDeleting(false);
    }
  }, [currentDraftId, onDraftDelete, loadConversation]);

  return {
    deleteDialogOpen,
    setDeleteDialogOpen,
    isDeleting,
    handleDeleteDraft,
  };
}

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
  const currentDraftId = initialDraft?.draftId || initialDraft?.entryId || null;
  const isDraftActive = Boolean(currentDraftId && draftData?.isDraft);

  const { deleteDialogOpen, setDeleteDialogOpen, isDeleting, handleDeleteDraft } = useDraftDeletionHandler(
    currentDraftId,
    onDraftDelete,
    loadConversation
  );

  useConversationLoader(initialDraft, loadConversation);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSummarize = () => {
    if (!onSummarize) return;
    const conversationHistory = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
      timestamp: convertTimestamp(msg.timestamp),
    }));
    const entryId = initialDraft?.entryId || null;
    const finalDraftId = draftId || entryId;
    onSummarize(conversationHistory, finalDraftId);
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
