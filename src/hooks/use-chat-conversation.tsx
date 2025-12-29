import { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { OpenRouterApiKeyContext } from '@/context/OpenRouterApiKeyContext';
import { LanguageContext } from '@/context/LanguageContext';
import { useModel } from '@/context/ModelContext';
import { sendChatMessage, generateInitialMessage } from '@/ai/services/chat-service';
import type { ChatMessage } from '@/ai/types/chat';

interface UseChatConversationResult {
  messages: ChatMessage[];
  isTyping: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  resetConversation: () => void;
}

export function useChatConversation(): UseChatConversationResult {
  const { apiKey } = useContext(OpenRouterApiKeyContext);
  const { language } = useContext(LanguageContext);
  const { selectedModel } = useModel();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasInitializedRef = useRef(false);

  const lang = (language || 'en') as 'en' | 'fr';

  useEffect(() => {
    if (!hasInitializedRef.current) {
      const initialMessage: ChatMessage = {
        role: 'assistant',
        content: generateInitialMessage(lang),
        timestamp: new Date(),
      };
      setMessages([initialMessage]);
      hasInitializedRef.current = true;
    }
  }, [lang]);

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
      const response = await sendChatMessage({
        conversationHistory: updatedMessages.filter((msg) => msg.timestamp < userMessage.timestamp),
        userMessage: userMessage.content,
        apiKey,
        language: lang,
        model: selectedModel,
      });

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
  }, [apiKey, messages, lang, selectedModel]);

  const resetConversation = useCallback((): void => {
    setMessages([]);
    setError(null);
    setIsTyping(false);
    hasInitializedRef.current = false;
  }, []);

  return {
    messages,
    isTyping,
    error,
    sendMessage,
    resetConversation,
  };
}

