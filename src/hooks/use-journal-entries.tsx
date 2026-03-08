import { useState, useRef, useCallback, useMemo, useEffect, startTransition } from 'react';
import { useStorage, useEntriesByDate, useEntry, useAllEntries } from '@/repositories/storage-provider';
import { getEntryKind } from '@/utils/entry-kind';
import { format } from 'date-fns';
import { useEntryOperations } from './use-entry-operations';
import { useSummaryOperations } from './use-summary-operations';
import { saveConversationDraft, deleteDraft, updateConversationEntry } from '@/app/handlers/journal-handlers';
import type { ChatMessage } from '@/ai/types/chat';
import type { Entry } from '@/repositories/types';
const DAYS_TO_LOOK_BACK = 7;
const MAX_RECENT_ENTRIES = 7;

function getTimestampMillis(value: string): number {
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? 0 : ms;
}

function toDate(value: Date | { toDate(): Date } | string): Date {
  if (typeof (value as { toDate?: unknown }).toDate === 'function') {
    return (value as { toDate(): Date }).toDate();
  }
  if (value instanceof Date) return value;
  return new Date(value as string);
}

export interface JournalEntryData {
  content: string;
  title?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
  moods?: string[];
  moodEmojis?: Record<string, string>;
  subjectEmoji?: string;
  themes?: string[];
  themeEmojis?: Record<string, string>;
  keyTakeaways?: string[];
  characters?: string[];
  places?: string[];
  aiProcessedAt?: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
  summaryGeneratedAt?: string;
  conversationMode?: boolean;
  isDraft?: boolean;
  linkedEntryIds?: string[];
}

interface UseJournalEntriesParams {
  selectedDate: Date;
  onDateChange?: (date: Date) => void;
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
  recentEntries: Array<{ content: string; title?: string; date: string; moods?: string[]; themes?: string[] }>;
  draftForDate: (JournalEntryData & { id: string }) | null;
  handleSaveDraft: (messages: ChatMessage[], draftId: string | null, entryId?: string | null) => Promise<string | null>;
  handleDeleteDraft: (draftId: string) => Promise<void>;
  conversationEntryForDate: (JournalEntryData & { id: string }) | null;
  changeEntryDate: (newDate: Date) => Promise<void>;
}

// eslint-disable-next-line max-lines-per-function
export function useJournalEntries({ selectedDate, onDateChange }: UseJournalEntriesParams): UseJournalEntriesResult {
  const { backend } = useStorage();

  const dateKey = format(selectedDate, 'yyyy-MM-dd');

  const { data: entriesRaw, isLoading: entriesLoading } = useEntriesByDate(dateKey);
  const { data: allEntriesRaw } = useAllEntries();

  const entries = useMemo(() => {
    if (!entriesRaw) return null;
    const cast = entriesRaw as unknown as (JournalEntryData & { id: string })[];
    return [...cast].sort((a, b) => {
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

  const { data: selectedEntryData, isLoading: selectedEntryLoading } = useEntry(selectedEntryId);

  const prevEntryIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (prevEntryIdRef.current !== selectedEntryId) {
      hasInitializedRef.current = false;
      prevEntryIdRef.current = selectedEntryId;
    }
  }, [selectedEntryId]);

  const initialContent = useMemo(() => {
    if (selectedEntryData?.content !== undefined) {
      return selectedEntryData.content || '';
    }
    return '';
  }, [selectedEntryData]);

  const initialTitle = useMemo(() => {
    if ((selectedEntryData as Entry | null)?.title !== undefined) {
      return (selectedEntryData as Entry | null)?.title || '';
    }
    return '';
  }, [selectedEntryData]);

  useEffect(() => {
    if (!hasInitializedRef.current && selectedEntryData !== undefined && !selectedEntryLoading) {
      if (content !== initialContent || title !== initialTitle) {
        startTransition(() => {
          setContent(initialContent);
          setTitle(initialTitle);
        });
      }
      hasInitializedRef.current = true;
    }
  }, [selectedEntryData, selectedEntryLoading, content, title, initialContent, initialTitle]);

  const updateEntryState = useCallback((entryId: string, newContent: string, newTitle: string): void => {
    hasInitializedRef.current = false;
    setSelectedEntryId(entryId);
    setContent(newContent);
    setTitle(newTitle);
    setLastSavedAt(new Date());
  }, []);

  const { createNewEntry, saveEntry, handleDelete, changeEntryDate } = useEntryOperations({
    dateKey,
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
    onDateChange,
  });

  const { handleSummarizeConversation } = useSummaryOperations({
    dateKey,
    updateEntryState,
    setIsGeneratingSummary,
    setSaveError,
  });

  const recentEntries = useMemo(() => {
    if (!allEntriesRaw) return [];

    const sevenDaysAgo = new Date(selectedDate);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - DAYS_TO_LOOK_BACK);
    const sevenDaysAgoKey = format(sevenDaysAgo, 'yyyy-MM-dd');

    return (allEntriesRaw as unknown as (JournalEntryData & { id: string })[])
      .filter((entry) => entry.date >= sevenDaysAgoKey && entry.date <= dateKey && entry.id !== selectedEntryId && !entry.isDraft)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, MAX_RECENT_ENTRIES)
      .map((entry) => ({
        content: entry.content,
        title: entry.title,
        date: entry.date,
        moods: entry.moods,
        themes: entry.themes,
      }));
  }, [allEntriesRaw, selectedEntryId, selectedDate, dateKey]);

  const selectedEntry = entries?.find(e => e.id === selectedEntryId);

  const draftForDate = useMemo(() => {
    if (!entries) return null;
    return entries.find(e => getEntryKind(e) === 'draft') || null;
  }, [entries]);

  const conversationEntryForDate = useMemo(() => {
    if (!entries) return null;
    return entries.find(e => getEntryKind(e) === 'conversation') || null;
  }, [entries]);

  const handleSaveDraft = useCallback(async (
    messages: ChatMessage[],
    currentDraftId: string | null,
    entryId?: string | null
  ): Promise<string | null> => {
    if (!backend || !messages.length) {
      return null;
    }

    try {
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
        timestamp: toDate(msg.timestamp),
      }));

      if (entryId && !currentDraftId) {
        await updateConversationEntry({
          entryId,
          conversationHistory,
          backend,
        });
        return entryId;
      }

      const savedDraftId = await saveConversationDraft({
        draftId: currentDraftId,
        entryDateKey: dateKey,
        conversationHistory,
        backend,
      });

      return savedDraftId;
    } catch (error) {
      console.error('Failed to save draft:', error);
      return null;
    }
  }, [backend, dateKey]);

  const handleDeleteDraft = useCallback(async (draftIdToDelete: string): Promise<void> => {
    if (!backend) {
      return;
    }

    try {
      await deleteDraft({
        draftId: draftIdToDelete,
        backend,
      });
    } catch (error) {
      console.error('Failed to delete draft:', error);
    }
  }, [backend]);

  return {
    entries,
    selectedEntry,
    selectedEntryData: selectedEntryData ? (selectedEntryData as unknown as JournalEntryData) : null,
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
    changeEntryDate,
  };
}
