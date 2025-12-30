'use client';

import { useCallback } from 'react';
import { format } from 'date-fns';
import { useContext } from 'react';
import { useFirestore } from '@/firebase';
import { useUser } from '@/firebase/auth/use-user';
import { OpenRouterApiKeyContext } from '@/context/OpenRouterApiKeyContext';
import { LanguageContext } from '@/context/LanguageContext';
import { useModel } from '@/context/ModelContext';
import { sendChatMessage, generateInitialMessage } from '@/ai/services/chat-service';
import { saveConversationDraft } from '@/app/handlers/journal-handlers';
import { convertTimestampToDate } from '@/utils/journal-utils';
import type { ChatMessage } from '@/ai/types/chat';

const MAX_PROMPT_LENGTH = 2000;
const MIN_PROMPT_LENGTH = 1;

function sanitizePrompt(prompt: string): string {
  return prompt.trim().slice(0, MAX_PROMPT_LENGTH);
}

function validatePrompt(prompt: string): { isValid: boolean; error?: string } {
  const sanitized = sanitizePrompt(prompt);
  if (sanitized.length < MIN_PROMPT_LENGTH) {
    return { isValid: false, error: 'Prompt is too short' };
  }
  if (sanitized.length > MAX_PROMPT_LENGTH) {
    return { isValid: false, error: 'Prompt is too long' };
  }
  return { isValid: true };
}

interface UseTemplateConversationParams {
  selectedDate: Date;
  onSuccess: (draftId: string) => void;
  onError?: (error: Error) => void;
}

export function useTemplateConversation({
  selectedDate,
  onSuccess,
  onError,
}: UseTemplateConversationParams) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { apiKey } = useContext(OpenRouterApiKeyContext);
  const { language } = useContext(LanguageContext);
  const { selectedModel } = useModel();

  const createConversationFromPrompt = useCallback(
    async (prompt: string) => {
      if (!firestore || !user || !apiKey) {
        const error = new Error('Cannot create conversation: missing firestore, user, or API key');
        if (process.env.NODE_ENV === 'development') {
          console.warn(error.message);
        }
        onError?.(error);
        return;
      }

      const validation = validatePrompt(prompt);
      if (!validation.isValid) {
        const error = new Error(validation.error || 'Invalid prompt');
        onError?.(error);
        return;
      }

      const sanitizedPrompt = sanitizePrompt(prompt);

      try {
        const dateKey = format(selectedDate, 'yyyy-MM-dd');
        const lang = (language || 'en') as 'en' | 'fr';

        const initialAssistantMessage: ChatMessage = {
          role: 'assistant',
          content: generateInitialMessage(lang),
          timestamp: new Date(),
        };

        const userMessage: ChatMessage = {
          role: 'user',
          content: sanitizedPrompt,
          timestamp: new Date(),
        };

        const conversationHistory: ChatMessage[] = [initialAssistantMessage];

        const aiResponse = await sendChatMessage({
          conversationHistory,
          userMessage: userMessage.content,
          apiKey,
          language: lang,
          model: selectedModel,
        });

        const assistantResponse: ChatMessage = {
          role: 'assistant',
          content: aiResponse,
          timestamp: new Date(),
        };

        const fullConversationHistory: ChatMessage[] = [
          initialAssistantMessage,
          userMessage,
          assistantResponse,
        ];

        const conversationHistoryForStorage = fullConversationHistory.map((msg) => ({
          role: msg.role,
          content: msg.content,
          timestamp: convertTimestampToDate(msg.timestamp),
        }));

        const draftId = await saveConversationDraft({
          draftId: null,
          entryDateKey: dateKey,
          conversationHistory: conversationHistoryForStorage,
          firestore,
          user,
        });

        onSuccess(draftId);
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to create conversation');
        console.error('Error creating conversation from template:', err);
        onError?.(err);
      }
    },
    [firestore, user, apiKey, language, selectedModel, selectedDate, onSuccess, onError]
  );

  return { createConversationFromPrompt };
}

