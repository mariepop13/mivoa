import { useEffect, useRef } from 'react';
import type { ChatMessage } from '@/ai/types/chat';

interface UseConversationLoaderParams {
  initialDraft: { messages: ChatMessage[]; draftId: string | null; entryId: string | null } | null | undefined;
  loadConversation: (messages: ChatMessage[], draftId: string | null) => void;
}

export function useConversationLoader({
  initialDraft,
  loadConversation,
}: UseConversationLoaderParams): void {
  const hasLoadedDraftRef = useRef<string | null>(null);
  const currentDraftId = initialDraft?.draftId || initialDraft?.entryId || null;

  useEffect(() => {
    if (initialDraft && hasLoadedDraftRef.current !== currentDraftId) {
      const loadedMessages: ChatMessage[] = initialDraft.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp instanceof Date ? msg.timestamp : msg.timestamp.toDate(),
      }));
      loadConversation(loadedMessages, currentDraftId);
      hasLoadedDraftRef.current = currentDraftId;
    } else if (!initialDraft && hasLoadedDraftRef.current !== null) {
      loadConversation([], null);
      hasLoadedDraftRef.current = null;
    }
  }, [initialDraft, loadConversation, currentDraftId]);
}

