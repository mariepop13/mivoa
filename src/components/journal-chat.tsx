'use client';

import { useEffect, useRef, memo } from 'react';
import { Timestamp } from 'firebase/firestore';
import { useChatConversation } from '@/hooks/use-chat-conversation';
import { useConversationLoader } from '@/hooks/use-conversation-loader';
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
  onViewModeChange?: (mode: 'chat' | 'summary') => void;
}

const MIN_MESSAGES_FOR_SUMMARY = 2;

function JournalChatComponent({ 
  onSummarize, 
  isLoadingSummary = false,
  dateKey,
  onDraftSave,
  onDraftDelete,
  initialDraft,
  onViewModeChange,
}: JournalChatProps): React.JSX.Element {
  const {
    messages,
    isTyping,
    error,
    sendMessage,
    loadConversation,
    editMessage,
    regenerateFrom,
    deleteMessage,
    undoEdit,
    isRegenerating,
    draftId,
  } = useChatConversation({
    dateKey,
    onDraftSave,
    onDraftDelete,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useConversationLoader({
    initialDraft,
    loadConversation,
  });

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
      if (onViewModeChange) {
        onViewModeChange('summary');
      }
    }
  };

  const hasUserMessages = messages.some((msg) => msg.role === 'user');
  const canSummarize = messages.length >= MIN_MESSAGES_FOR_SUMMARY && hasUserMessages;

  return (
    <div className="flex flex-col h-full">
      <ChatMessagesList
        messages={messages}
        isTyping={isTyping}
        isRegenerating={isRegenerating}
        error={error}
        onEdit={editMessage}
        onDelete={deleteMessage}
        onRegenerate={regenerateFrom}
        onUndoEdit={undoEdit}
      />
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
