'use client';

import { useEffect, useRef, memo } from 'react';
import { Timestamp } from 'firebase/firestore';
import { useChatConversation } from '@/hooks/use-chat-conversation';
import { ChatMessagesList } from '@/components/chat-messages-list';
import { ChatInputForm } from '@/components/chat-input-form';
import type { ChatMessage } from '@/ai/types/chat';

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
}

const MIN_MESSAGES_FOR_SUMMARY = 2;

function JournalChatComponent({ 
  onSummarize, 
  isLoadingSummary = false,
  dateKey,
  onDraftSave,
  onDraftDelete,
  initialDraft,
}: JournalChatProps): React.JSX.Element {
  const { messages, isTyping, error, sendMessage, loadConversation, draftId } = useChatConversation({
    dateKey,
    onDraftSave,
    onDraftDelete,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasLoadedDraftRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (initialDraft && !hasLoadedDraftRef.current) {
      const loadedMessages: ChatMessage[] = initialDraft.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp instanceof Timestamp ? msg.timestamp.toDate() : msg.timestamp,
      }));
      loadConversation(loadedMessages, initialDraft.draftId || initialDraft.entryId || null);
      hasLoadedDraftRef.current = true;
    }
  }, [initialDraft, loadConversation]);

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

  const hasUserMessages = messages.some((msg) => msg.role === 'user');
  const canSummarize = messages.length >= MIN_MESSAGES_FOR_SUMMARY && hasUserMessages;

  return (
    <div className="flex flex-col h-full">
      <ChatMessagesList messages={messages} isTyping={isTyping} error={error} />
      <div ref={messagesEndRef} id="messages-end" />
      <ChatInputForm
        onSend={sendMessage}
        isTyping={isTyping}
        canSummarize={canSummarize}
        onSummarize={handleSummarize}
        isLoadingSummary={isLoadingSummary}
      />
    </div>
  );
}

export const JournalChat = memo(JournalChatComponent);
