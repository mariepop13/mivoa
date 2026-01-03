'use client';

import { useCallback } from 'react';
import { format } from 'date-fns';
import { useContext } from 'react';
import { useFirestore } from '@/firebase';
import { useUser } from '@/firebase/auth/use-user';
import { OpenRouterApiKeyContext } from '@/context/OpenRouterApiKeyContext';
import { saveConversationDraft } from '@/app/handlers/journal-handlers';
import { convertTimestampToDate } from '@/utils/journal-utils';
import type { ChatMessage } from '@/ai/types/chat';
import type { Firestore } from 'firebase/firestore';
import type { User } from 'firebase/auth';

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

function validateDependencies(
  firestore: Firestore | null,
  user: User | null,
  apiKey: string | null
): { isValid: boolean; error?: Error } {
  if (!firestore || !user || !apiKey) {
    const error = new Error('Cannot create conversation: missing firestore, user, or API key');
    if (process.env.NODE_ENV === 'development') {
      console.warn(error.message);
    }
    return { isValid: false, error };
  }
  return { isValid: true };
}

function buildConversationMessages(
  sanitizedPrompt: string
): ChatMessage {
  return {
    role: 'assistant',
    content: sanitizedPrompt,
    timestamp: new Date(),
  };
}

function prepareMessagesForStorage(messages: ChatMessage[]): Array<{
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}> {
  return messages.map((msg) => ({
    role: msg.role,
    content: msg.content,
    timestamp: convertTimestampToDate(msg.timestamp),
  }));
}

interface UseTemplateConversationParams {
  selectedDate: Date;
  onSuccess: (draftId: string) => void;
  onError?: (error: Error) => void;
}

interface UseTemplateConversationResult {
  createConversationFromPrompt: (prompt: string) => Promise<void>;
}

export function useTemplateConversation({
  selectedDate,
  onSuccess,
  onError,
}: UseTemplateConversationParams): UseTemplateConversationResult {
  const firestore = useFirestore();
  const { user } = useUser();
  const { apiKey } = useContext(OpenRouterApiKeyContext);

  const createConversationFromPrompt = useCallback(
    async (prompt: string) => {
      const dependencyValidation = validateDependencies(firestore, user, apiKey);
      if (!dependencyValidation.isValid) {
        onError?.(dependencyValidation.error!);
        return;
      }

      const promptValidation = validatePrompt(prompt);
      if (!promptValidation.isValid) {
        const error = new Error(promptValidation.error || 'Invalid prompt');
        onError?.(error);
        return;
      }

      const sanitizedPrompt = sanitizePrompt(prompt);
      const dateKey = format(selectedDate, 'yyyy-MM-dd');

      const assistantMessage = buildConversationMessages(sanitizedPrompt);

      try {
        const conversationHistoryForStorage = prepareMessagesForStorage([assistantMessage]);

        const draftId = await saveConversationDraft({
          draftId: null,
          entryDateKey: dateKey,
          conversationHistory: conversationHistoryForStorage,
          firestore: firestore!,
          user: user!,
        });

        onSuccess(draftId);
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to create conversation');
        console.error('Error creating conversation from template:', err);
        onError?.(err);
      }
    },
    [firestore, user, apiKey, selectedDate, onSuccess, onError]
  );

  return { createConversationFromPrompt };
}

