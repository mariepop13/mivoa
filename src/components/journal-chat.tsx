'use client';

import { useEffect, useRef, memo } from 'react';
import { Timestamp } from 'firebase/firestore';
import { useChatConversation } from '@/hooks/use-chat-conversation';
import { ChatMessagesList } from '@/components/chat-messages-list';
import { ChatInputForm } from '@/components/chat-input-form';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface JournalChatProps {
  onSummarize?: (conversationHistory: ConversationMessage[]) => void;
  isLoadingSummary?: boolean;
}

const MIN_MESSAGES_FOR_SUMMARY = 2;

function JournalChatComponent({ onSummarize, isLoadingSummary = false }: JournalChatProps): React.JSX.Element {
  const { messages, isTyping, error, sendMessage } = useChatConversation();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSummarize = () => {
    if (onSummarize) {
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp instanceof Timestamp ? msg.timestamp.toDate() : msg.timestamp,
      }));
      onSummarize(conversationHistory);
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
