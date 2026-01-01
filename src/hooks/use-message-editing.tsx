import { useState, useCallback, useContext } from 'react';
import { OpenRouterApiKeyContext } from '@/context/OpenRouterApiKeyContext';
import { LanguageContext } from '@/context/LanguageContext';
import { useModel } from '@/context/ModelContext';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/use-translation';
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
  undoEdit: (messageIndex: number) => Promise<void>;
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
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lang = (language || 'en') as 'en' | 'fr';

  const regenerateResponse = useCallback(
    async (messageIndex: number, updatedMessages: ChatMessage[]) => {
      if (!apiKey) {
        const error = new Error('API key not configured');
        toast({
          variant: 'destructive',
          title: t('apiKeyNotConfiguredError'),
          description: t('apiKeyNotConfiguredErrorDescription'),
        });
        throw error;
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
        const errorMessage = err instanceof Error ? err.message : 'Failed to regenerate response';
        setError(errorMessage);
        toast({
          variant: 'destructive',
          title: t('regenerateError'),
          description: t('regenerateErrorDescription'),
        });
        throw err;
      } finally {
        setIsRegenerating(false);
      }
    },
    [apiKey, lang, selectedModel, onMessagesUpdate, onDraftSave, toast, t]
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
          originalContent: message.originalContent || message.content,
        };

        const messagesBeforeEdit = messages.slice(0, messageIndex);
        const updatedMessages = [...messagesBeforeEdit, updatedMessage];

        await regenerateResponse(messageIndex, updatedMessages);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to edit message';
        setError(errorMessage);
        toast({
          variant: 'destructive',
          title: t('editMessageError'),
          description: t('editMessageErrorDescription'),
        });
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
        const errorMessage = err instanceof Error ? err.message : 'Failed to regenerate';
        setError(errorMessage);
        toast({
          variant: 'destructive',
          title: t('regenerateError'),
          description: t('regenerateErrorDescription'),
        });
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
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete message';
        setError(errorMessage);
        toast({
          variant: 'destructive',
          title: t('deleteMessageError'),
          description: t('deleteMessageErrorDescription'),
        });
        throw err;
      } finally {
        setIsEditing(false);
      }
    },
    [messages, onMessagesUpdate, onDraftSave, regenerateResponse]
  );

  const undoEdit = useCallback(
    async (messageIndex: number): Promise<void> => {
      if (messageIndex < 0 || messageIndex >= messages.length) {
        throw new Error('Invalid message index');
      }

      const message = messages[messageIndex];
      if (message.role !== 'user') {
        throw new Error('Can only undo edit for user messages');
      }

      if (!message.originalContent) {
        toast({
          variant: 'destructive',
          title: t('undoEditError', 'Cannot undo edit'),
          description: t('undoEditErrorDescription', 'No original content available for this message.'),
        });
        return;
      }

      setIsEditing(true);
      setError(null);

      try {
        const restoredMessage: ChatMessage = {
          ...message,
          content: message.originalContent,
          editedAt: undefined,
          originalContent: undefined,
        };

        const messagesBeforeEdit = messages.slice(0, messageIndex);
        const updatedMessages = [...messagesBeforeEdit, restoredMessage];

        await regenerateResponse(messageIndex, updatedMessages);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to undo edit';
        setError(errorMessage);
        toast({
          variant: 'destructive',
          title: t('undoEditError', 'Failed to undo edit'),
          description: t('undoEditErrorDescription', 'An error occurred while undoing the edit. Please try again.'),
        });
        throw err;
      } finally {
        setIsEditing(false);
      }
    },
    [messages, regenerateResponse, toast, t]
  );

  return {
    editMessage,
    regenerateFrom,
    deleteMessage,
    undoEdit,
    isEditing,
    isRegenerating,
    error,
  };
}

