'use client';

import { useContext } from 'react';
import { Timestamp } from 'firebase/firestore';
import { ChatMessage } from '@/components/chat-message';
import { ChatEmptyState } from '@/components/chat-empty-state';
import { ChatTypingIndicator } from '@/components/chat-typing-indicator';
import { useTranslation } from '@/hooks/use-translation';
import { OpenRouterApiKeyContext } from '@/context/OpenRouterApiKeyContext';
import type { ChatMessage as ChatMessageType } from '@/ai/types/chat';

interface ChatMessagesListProps {
  messages: ChatMessageType[];
  isTyping: boolean;
  error: string | null;
}

export function ChatMessagesList({ messages, isTyping, error }: ChatMessagesListProps): React.JSX.Element {
  const { t } = useTranslation();
  const { apiKey, isLoading: isApiKeyLoading } = useContext(OpenRouterApiKeyContext);

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 sm:py-6 lg:py-8">
      <div className="max-w-3xl mx-auto space-y-5">
        {!isApiKeyLoading && !apiKey && (
          <div role="status" aria-live="polite" className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded-lg px-4 py-3 text-sm">
            <p className="font-medium mb-1">{t('openRouterApiKeyRequired')}</p>
            <p className="text-xs opacity-90">{t('openRouterApiKeyRequiredDescription')}</p>
          </div>
        )}
        {messages.length === 0 && <ChatEmptyState />}
        {messages.map((message, index) => {
          const timestampMs = message.timestamp instanceof Timestamp 
            ? message.timestamp.toMillis() 
            : message.timestamp.getTime();
          return <ChatMessage key={`${timestampMs}-${index}`} message={message} />;
        })}
        {isTyping && <ChatTypingIndicator />}
        {error && (
          <div className="bg-destructive/10 text-destructive rounded-lg px-4 py-3 text-sm">
            {t('error')}: {error}
          </div>
        )}
      </div>
    </div>
  );
}

