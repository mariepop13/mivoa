import { useState, useCallback, useContext } from 'react';
import { OpenRouterApiKeyContext } from '@/context/OpenRouterApiKeyContext';
import { LanguageContext } from '@/context/LanguageContext';
import { useModel } from '@/context/ModelContext';
import { regenerateFromMessage } from '@/ai/services/chat-service';
import { truncateConversation } from '@/utils/conversation-utils';
import type { ChatMessage } from '@/ai/types/chat';

interface UseMessageEditingParams {
  messages: ChatMessage[];
  onMessagesUpdate: (messages: ChatMessage[]) => void;
  onDraftSave?: (messages: ChatMessage[]) => Promise<void>;
}

interface UseMessageEditingResult {
  editMessage: (messageIndex: number, newContent: string) => Promise<void>;
  regenerateFrom: (messageIndex: number) => Promise<void>;
  deleteMessage: (messageIndex: number) => Promise<void>;
  isEditing: boolean;
  isRegenerating: boolean;
  error: string | null;
}

export function useMessageEditing({
  messages,
  onMessagesUpdate,
  onDraftSave,
}: UseMessageEditingParams): UseMessageEditingResult {
  const { apiKey } = useContext(OpenRouterApiKeyContext);
  const { language } = useContext(LanguageContext);
  const { selectedModel } = useModel();
  const [isEditing, setIsEditing] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lang = (language || 'en') as 'en' | 'fr';

  const regenerateResponse = useCallback(
    async (messageIndex: number, updatedMessages: ChatMessage[]) => {
      if (!apiKey) {
        throw new Error('API key not configured');
      }

      setIsRegenerating(true);
      setError(null);

      try {
        const response = await regenerateFromMessage({
          conversationHistory: updatedMessages,
          messageIndex,
          apiKey,
          language: lang,
          model: selectedModel,
        });

        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: response,
          timestamp: new Date(),
        };

        const finalMessages = [...updatedMessages, assistantMessage];
        onMessagesUpdate(finalMessages);

        if (onDraftSave) {
          await onDraftSave(finalMessages);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to regenerate response';
        setError(message);
        throw err;
      } finally {
        setIsRegenerating(false);
      }
    },
    [apiKey, lang, selectedModel, onMessagesUpdate, onDraftSave]
  );

  const editMessage = useCallback(
    async (messageIndex: number, newContent: string): Promise<void> => {
      if (messageIndex < 0 || messageIndex >= messages.length) {
        throw new Error('Invalid message index');
      }

      const message = messages[messageIndex];
      if (message.role !== 'user') {
        throw new Error('Can only edit user messages');
      }

      setIsEditing(true);
      setError(null);

      try {
        const updatedMessage: ChatMessage = {
          ...message,
          content: newContent,
          editedAt: new Date(),
        };

        const messagesBeforeEdit = messages.slice(0, messageIndex);
        const updatedMessages = [...messagesBeforeEdit, updatedMessage];

        await regenerateResponse(messageIndex, updatedMessages);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to edit message';
        setError(message);
        throw err;
      } finally {
        setIsEditing(false);
      }
    },
    [messages, regenerateResponse]
  );

  const regenerateFrom = useCallback(
    async (messageIndex: number): Promise<void> => {
      if (messageIndex < 0 || messageIndex >= messages.length) {
        throw new Error('Invalid message index');
      }

      setIsRegenerating(true);
      setError(null);

      try {
        const truncatedMessages = truncateConversation(messages, messageIndex);
        await regenerateResponse(messageIndex, truncatedMessages);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to regenerate';
        setError(message);
        throw err;
      } finally {
        setIsRegenerating(false);
      }
    },
    [messages, regenerateResponse]
  );

  const deleteMessage = useCallback(
    async (messageIndex: number): Promise<void> => {
      if (messageIndex < 0 || messageIndex >= messages.length) {
        throw new Error('Invalid message index');
      }

      const message = messages[messageIndex];
      if (message.role !== 'user') {
        throw new Error('Can only delete user messages');
      }

      setIsEditing(true);
      setError(null);

      try {
        const messagesBeforeDelete = messages.slice(0, messageIndex);
        const truncatedMessages = truncateConversation(messagesBeforeDelete, messageIndex - 1);

        if (truncatedMessages.length > 0 && truncatedMessages[truncatedMessages.length - 1].role === 'user') {
          await regenerateResponse(truncatedMessages.length - 1, truncatedMessages);
        } else {
          onMessagesUpdate(truncatedMessages);
          if (onDraftSave) {
            await onDraftSave(truncatedMessages);
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete message';
        setError(message);
        throw err;
      } finally {
        setIsEditing(false);
      }
    },
    [messages, onMessagesUpdate, onDraftSave, regenerateResponse]
  );

  return {
    editMessage,
    regenerateFrom,
    deleteMessage,
    isEditing,
    isRegenerating,
    error,
  };
}

