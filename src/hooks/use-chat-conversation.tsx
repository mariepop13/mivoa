import { useState, useEffect, useCallback, useContext } from 'react';
import { OpenRouterApiKeyContext } from '@/context/OpenRouterApiKeyContext';
import { LanguageContext } from '@/context/LanguageContext';
import { sendChatMessage, generateInitialMessage } from '@/ai/services/chat-service';
import type { ChatMessage } from '@/ai/types/chat';

export function useChatConversation() {
  const { apiKey } = useContext(OpenRouterApiKeyContext);
  const { language } = useContext(LanguageContext);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lang = (language || 'en') as 'en' | 'fr';

  useEffect(() => {
    if (messages.length === 0 && apiKey) {
      const initialMessage: ChatMessage = {
        role: 'assistant',
        content: generateInitialMessage(lang),
        timestamp: new Date(),
      };
      setMessages([initialMessage]);
    }
  }, [apiKey, lang]);

  const sendMessage = useCallback(async (content: string) => {
    if (!apiKey) {
      setError('API key not configured');
      return;
    }

    if (!content.trim()) {
      return;
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsTyping(true);
    setError(null);

    try {
      const response = await sendChatMessage(
        updatedMessages.filter((msg) => msg.timestamp < userMessage.timestamp),
        userMessage.content,
        apiKey,
        lang
      );

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages([...updatedMessages, assistantMessage]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send message';
      setError(message);
      console.error('Failed to send chat message:', err);
    } finally {
      setIsTyping(false);
    }
  }, [apiKey, messages, lang]);

  const resetConversation = useCallback(() => {
    setMessages([]);
    setError(null);
    setIsTyping(false);
  }, []);

  return {
    messages,
    isTyping,
    error,
    sendMessage,
    resetConversation,
  };
}

