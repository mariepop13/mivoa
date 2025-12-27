'use client';

import { useState, useEffect, useRef } from 'react';
import { Timestamp } from 'firebase/firestore';
import { useChatConversation } from '@/hooks/use-chat-conversation';
import { ChatMessage } from '@/components/chat-message';
import { useTranslation } from '@/hooks/use-translation';
import { Button } from '@/components/ui/button';
import { Send, Sparkles } from 'lucide-react';
import type { ChatMessage as ChatMessageType } from '@/ai/types/chat';

interface JournalChatProps {
  onSummarize?: (conversationHistory: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>) => void;
  isLoadingSummary?: boolean;
}

const MIN_MESSAGES_FOR_SUMMARY = 2;

export function JournalChat({ onSummarize, isLoadingSummary = false }: JournalChatProps) {
  const { t } = useTranslation();
  const { messages, isTyping, error, sendMessage } = useChatConversation();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!inputValue.trim() || isTyping) return;

    const messageToSend = inputValue;
    setInputValue('');
    await sendMessage(messageToSend);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

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

  const canSummarize = messages.length >= MIN_MESSAGES_FOR_SUMMARY && messages.some((msg) => msg.role === 'user');

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <Sparkles className="h-8 w-8 mx-auto mb-4 text-primary" />
              <p className="text-sm">{t('chatInitializing')}</p>
            </div>
          )}

          {messages.map((message, index) => {
            const timestampMs = message.timestamp instanceof Timestamp 
              ? message.timestamp.toMillis() 
              : message.timestamp.getTime();
            return <ChatMessage key={`${timestampMs}-${index}`} message={message} />;
          })}

          {isTyping && (
            <div className="flex justify-start mb-4">
              <div className="bg-muted text-foreground border border-border rounded-lg px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-primary rounded-full animate-pulse" />
                  <span className="inline-block w-2 h-2 bg-primary rounded-full animate-pulse delay-75" />
                  <span className="inline-block w-2 h-2 bg-primary rounded-full animate-pulse delay-150" />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 text-destructive rounded-lg px-4 py-3 text-sm">
              {t('error')}: {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-border bg-card px-4 sm:px-6 py-4">
        <div className="max-w-3xl mx-auto space-y-3">
          {canSummarize && (
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={handleSummarize}
                disabled={isLoadingSummary}
                className="w-full sm:w-auto"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {isLoadingSummary ? t('generatingSummary') : t('summarizeConversation')}
              </Button>
            </div>
          )}

          <div className="flex gap-2">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('typeMessage')}
              className="flex-1 min-h-[60px] max-h-[200px] resize-none rounded-lg border border-input bg-background px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isTyping}
            />
            <Button
              type="button"
              onClick={handleSend}
              disabled={!inputValue.trim() || isTyping}
              className="self-end"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
