import { useCallback, useContext } from 'react';
import { useFirestore } from '@/firebase';
import { useUser } from '@/firebase/auth/use-user';
import { generateEntryId, saveSummaryAsEntry, triggerEntryAnalysis } from '@/app/handlers/journal-handlers';
import { generateConversationSummary } from '@/ai/services/conversation-summary-service';
import { OpenRouterApiKeyContext } from '@/context/OpenRouterApiKeyContext';
import { LanguageContext } from '@/context/LanguageContext';
import { useModel } from '@/context/ModelContext';
import { useEntryAnalysis } from './use-entry-analysis';
import type { ChatMessage } from '@/ai/types/chat';
import type { User } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

interface UseSummaryOperationsParams {
  dateKey: string;
  updateEntryState: (entryId: string, newContent: string, newTitle: string) => void;
  setIsGeneratingSummary: (value: boolean) => void;
  setSaveError: (error: string | null) => void;
}

interface UseSummaryOperationsResult {
  handleSummarizeConversation: (
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>
  ) => Promise<void>;
}

function convertToChatMessages(
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>
): ChatMessage[] {
  return conversationHistory.map((msg) => ({
    role: msg.role,
    content: msg.content,
    timestamp: msg.timestamp,
  }));
}

async function performSummarization({
  conversationHistory,
  draftId,
  dateKey,
  apiKey,
  user,
  firestore,
  language,
  selectedModel,
  analyze,
  updateEntryState,
}: {
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>;
  draftId?: string | null;
  dateKey: string;
  apiKey: string;
  user: User;
  firestore: Firestore;
  language: string | null;
  selectedModel: string | undefined;
  analyze: ReturnType<typeof useEntryAnalysis>['analyze'];
  updateEntryState: (entryId: string, newContent: string, newTitle: string) => void;
}): Promise<void> {
  const lang = (language || 'en') as 'en' | 'fr';
  const chatMessages = convertToChatMessages(conversationHistory);
  const summary = await generateConversationSummary(chatMessages, apiKey, lang, selectedModel);
  const entryId = draftId || generateEntryId(dateKey);
  await saveSummaryAsEntry({
    entryId,
    entryDateKey: dateKey,
    summary,
    conversationHistory,
    firestore,
    user,
    draftId,
  });
  updateEntryState(entryId, summary.content, summary.title);
  triggerEntryAnalysis({ content: summary.content, entryId, firestore, user, analyze });
}

export function useSummaryOperations({
  dateKey,
  updateEntryState,
  setIsGeneratingSummary,
  setSaveError,
}: UseSummaryOperationsParams): UseSummaryOperationsResult {
  const firestore = useFirestore();
  const { user } = useUser();
  const { language } = useContext(LanguageContext);
  const { apiKey } = useContext(OpenRouterApiKeyContext);
  const { selectedModel } = useModel();
  const { analyze } = useEntryAnalysis();

  const handleSummarizeConversation = useCallback(async (
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>,
    draftId?: string | null
  ) => {
    if (!apiKey || !user || !firestore) {
      setSaveError('API key not configured or services unavailable');
      return;
    }
    setIsGeneratingSummary(true);
    setSaveError(null);
    try {
      await performSummarization({
        conversationHistory,
        draftId,
        dateKey,
        apiKey,
        user,
        firestore,
        language,
        selectedModel,
        analyze,
        updateEntryState,
      });
    } catch (error) {
      console.error('Failed to generate summary:', error);
      setSaveError(error instanceof Error ? error.message : 'Error generating summary');
    } finally {
      setIsGeneratingSummary(false);
    }
  }, [
    apiKey,
    user,
    firestore,
    language,
    dateKey,
    updateEntryState,
    analyze,
    selectedModel,
    setIsGeneratingSummary,
    setSaveError,
  ]);

  return { handleSummarizeConversation } satisfies UseSummaryOperationsResult;
}

