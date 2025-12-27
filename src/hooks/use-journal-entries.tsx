import { useState, useRef, useCallback, useContext, useMemo, useEffect } from 'react';
import { useFirestore, useCollection, useDoc, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { useUser } from '@/firebase/auth/use-user';
import { collection, doc, query, where, serverTimestamp, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { useEntryAnalysis } from './use-entry-analysis';
import { generateEntryId, createEntryDocument, triggerEntryAnalysis, saveSummaryAsEntry } from '@/app/handlers/journal-handlers';
import { generateConversationSummary } from '@/ai/services/conversation-summary-service';
import { OpenRouterApiKeyContext } from '@/context/OpenRouterApiKeyContext';
import { LanguageContext } from '@/context/LanguageContext';
import type { ChatMessage } from '@/ai/types/chat';

export interface JournalEntryData extends Record<string, unknown> {
  content: string;
  title?: string;
  date: string;
  createdAt: string | Timestamp;
  updatedAt: string | Timestamp;
  mood?: string;
  themes?: string[];
  keyTakeaways?: string[];
  aiProcessedAt?: Timestamp;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Timestamp | Date | string;
  }>;
  summaryGeneratedAt?: Timestamp;
  conversationMode?: boolean;
}

interface UseJournalEntriesParams {
  selectedDate: Date;
}

interface UseJournalEntriesResult {
  entries: (JournalEntryData & { id: string })[] | null;
  selectedEntry: (JournalEntryData & { id: string }) | undefined;
  selectedEntryData: JournalEntryData | null;
  entriesLoading: boolean;
  selectedEntryLoading: boolean;
  selectedEntryId: string | null;
  setSelectedEntryId: (id: string | null) => void;
  content: string;
  setContent: (content: string) => void;
  title: string;
  setTitle: (title: string) => void;
  isSaving: boolean;
  lastSavedAt: Date | null;
  saveError: string | null;
  createNewEntry: (initialContent?: string, initialTitle?: string) => Promise<void>;
  saveEntry: (newContent: string, newTitle: string) => Promise<void>;
  handleDelete: () => Promise<void>;
  handleSummarizeConversation: (conversationHistory: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>) => Promise<void>;
  isGeneratingSummary: boolean;
  recentEntries: Array<{ content: string; title?: string; date: string }>;
}

export function useJournalEntries({ selectedDate }: UseJournalEntriesParams): UseJournalEntriesResult {
  const firestore = useFirestore();
  const { user } = useUser();
  const { language } = useContext(LanguageContext);
  const { analyze } = useEntryAnalysis();
  const { apiKey } = useContext(OpenRouterApiKeyContext);

  const dateKey = format(selectedDate, 'yyyy-MM-dd');

  const entriesCollectionRef = collection(firestore, `users/${user?.uid}/entries`);
  const entriesQuery = query(
    entriesCollectionRef,
    where('date', '==', dateKey)
  );

  const { data: entriesRaw, isLoading: entriesLoading } = useCollection<JournalEntryData>(
    user ? Object.assign(entriesQuery, { __memo: true }) : null
  );

  function getTimestampMillis(value: string | Timestamp | unknown): number {
    if (value instanceof Timestamp) {
      return value.toMillis();
    }
    if (typeof value === 'string') {
      return new Date(value).getTime();
    }
    return 0;
  }

  const entries = entriesRaw ? [...entriesRaw].sort((a, b) => {
    const aTime = getTimestampMillis(a.createdAt);
    const bTime = getTimestampMillis(b.createdAt);
    return bTime - aTime;
  }) : null;

  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const hasInitializedRef = useRef(false);

  const selectedEntryDocRef = useMemo(() => {
    if (!firestore || !user || !selectedEntryId) return null;
    return doc(firestore, `users/${user.uid}/entries/${selectedEntryId}`);
  }, [firestore, user, selectedEntryId]);

  const { data: selectedEntryData, isLoading: selectedEntryLoading } = useDoc<JournalEntryData>(selectedEntryDocRef);

  useEffect(() => {
    if (!hasInitializedRef.current && selectedEntryData !== undefined && !selectedEntryLoading) {
      if (selectedEntryData?.content !== undefined) {
        setContent(selectedEntryData.content || '');
        setTitle(selectedEntryData.title || '');
      } else {
        setContent('');
        setTitle('');
      }
      hasInitializedRef.current = true;
    }
  }, [selectedEntryData, selectedEntryLoading]);

  const updateEntryState = useCallback((entryId: string, newContent: string, newTitle: string): void => {
    hasInitializedRef.current = false;
    setSelectedEntryId(entryId);
    setContent(newContent);
    setTitle(newTitle);
    setLastSavedAt(new Date());
  }, [setSelectedEntryId, setContent, setTitle]);

  const createNewEntry = useCallback(async (initialContent: string = '', initialTitle: string = '') => {
    if (!user || !firestore) {
      console.warn('Cannot create entry: missing user or firestore');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const entryId = generateEntryId(dateKey);
      await createEntryDocument({
        entryId,
        content: initialContent,
        title: initialTitle,
        dateKey,
        firestore,
        user,
      });
      
      updateEntryState(entryId, initialContent, initialTitle);
      triggerEntryAnalysis({ content: initialContent, entryId, firestore, user, analyze });
    } catch (error) {
      console.error('setDoc error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error creating entry';
      setSaveError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  }, [user, firestore, dateKey, updateEntryState, analyze]);

  const saveEntry = useCallback(async (newContent: string, newTitle: string) => {
    if (!selectedEntryDocRef || !user) {
      console.warn('Cannot save: missing entryDocRef or user');
      setIsSaving(false);
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    
    try {
      const data: Record<string, unknown> = {
        content: newContent,
        updatedAt: serverTimestamp(),
      };

      if (newTitle) {
        data.title = newTitle;
      }

      await updateDocumentNonBlocking(selectedEntryDocRef, data);
      setLastSavedAt(new Date());
    } catch (error) {
      console.error('updateDoc error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error saving entry';
      setSaveError(errorMessage);
      setLastSavedAt(null);
    } finally {
      setIsSaving(false);
    }
  }, [selectedEntryDocRef, user]);

  const handleDelete = useCallback(async () => {
    if (!selectedEntryDocRef || !selectedEntryId || !entries) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      await deleteDocumentNonBlocking(selectedEntryDocRef);
      
      const currentIndex = entries.findIndex(e => e.id === selectedEntryId);
      const remainingEntries = entries.filter(e => e.id !== selectedEntryId);
      
      if (remainingEntries.length > 0) {
        const nextIndex = currentIndex < remainingEntries.length ? currentIndex : remainingEntries.length - 1;
        setSelectedEntryId(remainingEntries[nextIndex].id);
      } else {
        setSelectedEntryId(null);
        setContent('');
        setTitle('');
        setLastSavedAt(null);
      }
      
      hasInitializedRef.current = false;
    } catch (error) {
      console.error('deleteDoc error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error deleting entry';
      setSaveError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  }, [selectedEntryDocRef, selectedEntryId, entries, setSelectedEntryId, setContent, setTitle]);

  const handleSummarizeConversation = useCallback(async (
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>
  ) => {
    if (!apiKey || !user || !firestore) {
      setSaveError('API key not configured or services unavailable');
      return;
    }

    setIsGeneratingSummary(true);
    setSaveError(null);

    try {
      const lang = (language || 'en') as 'en' | 'fr';
      const chatMessages: ChatMessage[] = conversationHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
      }));

      const summary = await generateConversationSummary(chatMessages, apiKey, lang);
      const entryId = generateEntryId(dateKey);

      await saveSummaryAsEntry({
        entryId,
        entryDateKey: dateKey,
        summary,
        conversationHistory,
        firestore,
        user,
      });
      
      updateEntryState(entryId, summary.content, summary.title);
      triggerEntryAnalysis({ content: summary.content, entryId, firestore, user, analyze });
    } catch (error) {
      console.error('Failed to generate summary:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error generating summary';
      setSaveError(errorMessage);
    } finally {
      setIsGeneratingSummary(false);
    }
  }, [apiKey, user, firestore, language, dateKey, updateEntryState, analyze]);

  const recentEntries = useMemo(() => {
    if (!entries) return [];
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoKey = format(sevenDaysAgo, 'yyyy-MM-dd');
    
    return entries
      .filter((entry) => entry.date >= sevenDaysAgoKey && entry.id !== selectedEntryId)
      .slice(0, 7)
      .map((entry) => ({
        content: entry.content,
        title: entry.title,
        date: entry.date,
      }));
  }, [entries, selectedEntryId]);

  const selectedEntry = entries?.find(e => e.id === selectedEntryId);

  return {
    entries,
    selectedEntry,
    selectedEntryData: selectedEntryData || null,
    entriesLoading,
    selectedEntryLoading,
    selectedEntryId,
    setSelectedEntryId,
    content,
    setContent,
    title,
    setTitle,
    isSaving,
    lastSavedAt,
    saveError,
    createNewEntry,
    saveEntry,
    handleDelete,
    handleSummarizeConversation,
    isGeneratingSummary,
    recentEntries,
  };
}

