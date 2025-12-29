import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useFirestore, useCollection, useDoc, applyMemoMarker } from '@/firebase';
import { useUser } from '@/firebase/auth/use-user';
import { collection, doc, query, where, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { useEntryOperations } from './use-entry-operations';
import { useSummaryOperations } from './use-summary-operations';
import { saveConversationDraft, deleteDraft, updateConversationEntry } from '@/app/handlers/journal-handlers';
import type { ChatMessage } from '@/ai/types/chat';

const DAYS_TO_LOOK_BACK = 7;
const MAX_RECENT_ENTRIES = 7;

function getTimestampMillis(value: string | Timestamp | unknown): number {
  if (value instanceof Timestamp) {
    return value.toMillis();
  }
  if (typeof value === 'string') {
    return new Date(value).getTime();
  }
  return 0;
}

export interface JournalEntryData extends Record<string, unknown> {
  content: string;
  title?: string;
  date: string;
  createdAt: string | Timestamp;
  updatedAt: string | Timestamp;
  moods?: string[];
  moodEmojis?: Record<string, string>;
  subjectEmoji?: string;
  themes?: string[];
  themeEmojis?: Record<string, string>;
  keyTakeaways?: string[];
  characters?: string[];
  places?: string[];
  aiProcessedAt?: Timestamp;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Timestamp | Date | string;
  }>;
  summaryGeneratedAt?: Timestamp;
  conversationMode?: boolean;
  isDraft?: boolean;
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
  saveEntry: (newContent: string) => Promise<void>;
  handleDelete: () => Promise<void>;
  handleSummarizeConversation: (
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>,
    draftId?: string | null
  ) => Promise<void>;
  isGeneratingSummary: boolean;
  recentEntries: Array<{ content: string; title?: string; date: string }>;
  draftForDate: (JournalEntryData & { id: string }) | null;
  handleSaveDraft: (messages: ChatMessage[], draftId: string | null, entryId?: string | null) => Promise<string | null>;
  handleDeleteDraft: (draftId: string) => Promise<void>;
  conversationEntryForDate: (JournalEntryData & { id: string }) | null;
}

export function useJournalEntries({ selectedDate }: UseJournalEntriesParams): UseJournalEntriesResult {
  const firestore = useFirestore();
  const { user } = useUser();

  const dateKey = format(selectedDate, 'yyyy-MM-dd');

  const entriesCollectionRef = useMemo(() => {
    if (!firestore || !user) return null;
    return collection(firestore, `users/${user.uid}/entries`);
  }, [firestore, user]);

  const entriesQuery = useMemo(() => {
    if (!entriesCollectionRef) return null;
    return applyMemoMarker(query(
      entriesCollectionRef,
      where('date', '==', dateKey)
    ));
  }, [entriesCollectionRef, dateKey]);

  const { data: entriesRaw, isLoading: entriesLoading } = useCollection<JournalEntryData>(
    entriesQuery
  );

  const entries = useMemo(() => {
    if (!entriesRaw) return null;
    return [...entriesRaw].sort((a, b) => {
      const aTime = getTimestampMillis(a.createdAt);
      const bTime = getTimestampMillis(b.createdAt);
      return bTime - aTime;
    });
  }, [entriesRaw]);

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
    hasInitializedRef.current = false;
  }, [selectedEntryId]);

  useEffect(() => {
    if (!hasInitializedRef.current && selectedEntryData !== undefined && !selectedEntryLoading) {
      if (selectedEntryData?.content !== undefined) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setContent(selectedEntryData.content || '');
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTitle(selectedEntryData.title || '');
      } else {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setContent('');
        // eslint-disable-next-line react-hooks/set-state-in-effect
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
  }, []);

  const { createNewEntry, saveEntry, handleDelete } = useEntryOperations({
    dateKey,
    selectedEntryDocRef,
    selectedEntryId,
    entries,
    updateEntryState,
    setIsSaving,
    setSaveError,
    setLastSavedAt,
    setSelectedEntryId,
    setContent,
    setTitle,
    hasInitializedRef,
  });

  const { handleSummarizeConversation } = useSummaryOperations({
    dateKey,
    updateEntryState,
    setIsGeneratingSummary,
    setSaveError,
  });

  const recentEntries = useMemo(() => {
    if (!entries) return [];
    
    const sevenDaysAgo = new Date(selectedDate);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - DAYS_TO_LOOK_BACK);
    const sevenDaysAgoKey = format(sevenDaysAgo, 'yyyy-MM-dd');
    
    return entries
      .filter((entry) => entry.date >= sevenDaysAgoKey && entry.id !== selectedEntryId)
      .slice(0, MAX_RECENT_ENTRIES)
      .map((entry) => ({
        content: entry.content,
        title: entry.title,
        date: entry.date,
      }));
  }, [entries, selectedEntryId, selectedDate]);

  const selectedEntry = entries?.find(e => e.id === selectedEntryId);

  const draftForDate = useMemo(() => {
    if (!entries) return null;
    return entries.find(e => e.isDraft === true) || null;
  }, [entries]);

  const conversationEntryForDate = useMemo(() => {
    if (!entries) return null;
    return entries.find(e => e.conversationMode === true && e.isDraft !== true) || null;
  }, [entries]);

  const handleSaveDraft = useCallback(async (
    messages: ChatMessage[],
    currentDraftId: string | null,
    entryId?: string | null
  ): Promise<string | null> => {
    if (!firestore || !user || !messages.length) {
      return null;
    }

    try {
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp instanceof Timestamp ? msg.timestamp.toDate() : msg.timestamp,
      }));

      if (entryId && !currentDraftId) {
        await updateConversationEntry({
          entryId,
          conversationHistory,
          firestore,
          user,
        });
        return entryId;
      }

      const savedDraftId = await saveConversationDraft({
        draftId: currentDraftId,
        entryDateKey: dateKey,
        conversationHistory,
        firestore,
        user,
      });

      return savedDraftId;
    } catch (error) {
      console.error('Failed to save draft:', error);
      return null;
    }
  }, [firestore, user, dateKey]);

  const handleDeleteDraft = useCallback(async (draftIdToDelete: string): Promise<void> => {
    if (!firestore || !user) {
      return;
    }

    try {
      await deleteDraft({
        draftId: draftIdToDelete,
        firestore,
        user,
      });
    } catch (error) {
      console.error('Failed to delete draft:', error);
    }
  }, [firestore, user]);

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
    draftForDate,
    handleSaveDraft,
    handleDeleteDraft,
    conversationEntryForDate,
  };
}

