import { useCallback } from 'react';
import { useStorage } from '@/repositories/storage-provider';
import { generateEntryId, createEntryDocument, triggerEntryAnalysis, changeEntryDate } from '@/app/handlers/journal-handlers';
import { useEntryAnalysis } from './use-entry-analysis';
import type { JournalEntryData } from './use-journal-entries';

function getNextEntryId(
  entries: (JournalEntryData & { id: string })[],
  currentEntryId: string
): string | null {
  const currentIndex = entries.findIndex((entry) => entry.id === currentEntryId);
  if (currentIndex === -1) {
    return entries[0]?.id ?? null;
  }
  const remainingEntries = entries.filter((entry) => entry.id !== currentEntryId);

  if (remainingEntries.length === 0) {
    return null;
  }

  const nextIndex = Math.min(currentIndex, remainingEntries.length - 1);
  return remainingEntries[nextIndex]?.id ?? null;
}

interface UseEntryOperationsParams {
  dateKey: string;
  selectedEntryId: string | null;
  entries: (JournalEntryData & { id: string })[] | null;
  updateEntryState: (entryId: string, newContent: string, newTitle: string) => void;
  setIsSaving: (value: boolean) => void;
  setSaveError: (error: string | null) => void;
  setLastSavedAt: (date: Date | null) => void;
  setSelectedEntryId: (id: string | null) => void;
  setContent: (content: string) => void;
  setTitle: (title: string) => void;
  hasInitializedRef: React.MutableRefObject<boolean>;
  onDateChange?: (date: Date) => void;
}

interface UseEntryOperationsResult {
  createNewEntry: (initialContent?: string, initialTitle?: string) => Promise<void>;
  saveEntry: (newContent: string) => Promise<void>;
  handleDelete: () => Promise<void>;
  changeEntryDate: (newDate: Date) => Promise<void>;
}

// eslint-disable-next-line max-lines-per-function
export function useEntryOperations({
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
}: UseEntryOperationsParams): UseEntryOperationsResult {
  const { backend } = useStorage();
  const { analyze } = useEntryAnalysis();

  const createNewEntry = useCallback(async (initialContent: string = '', initialTitle: string = '') => {
    if (!backend) {
      console.warn('Cannot create entry: missing backend');
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
        backend,
      });

      updateEntryState(entryId, initialContent, initialTitle);
      triggerEntryAnalysis({ content: initialContent, entryId, backend, analyze });
    } catch (error) {
      console.error('setDoc error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error creating entry';
      setSaveError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  }, [backend, dateKey, updateEntryState, analyze, setIsSaving, setSaveError]);

  const saveEntry = useCallback(async (newContent: string) => {
    if (!backend || !selectedEntryId) {
      console.warn('Cannot save: missing backend or selectedEntryId');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      await backend.updateEntry(selectedEntryId, { content: newContent });
      setLastSavedAt(new Date());
    } catch (error) {
      console.error('updateDoc error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error saving entry';
      setSaveError(errorMessage);
      setLastSavedAt(null);
    } finally {
      setIsSaving(false);
    }
  }, [backend, selectedEntryId, setIsSaving, setSaveError, setLastSavedAt]);

  const handleDelete = useCallback(async () => {
    if (!backend || !selectedEntryId || !entries) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      await backend.deleteEntry(selectedEntryId);

      const nextEntryId = getNextEntryId(entries, selectedEntryId);

      if (nextEntryId) {
        setSelectedEntryId(nextEntryId);
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
  }, [
    backend,
    selectedEntryId,
    entries,
    setSelectedEntryId,
    setContent,
    setTitle,
    setLastSavedAt,
    setIsSaving,
    setSaveError,
    hasInitializedRef,
  ]);

  const changeEntryDateHandler = useCallback(async (newDate: Date) => {
    if (!backend || !selectedEntryId) {
      console.warn('Cannot change date: missing backend or selectedEntryId');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      await changeEntryDate({
        entryId: selectedEntryId,
        newDate,
        backend,
      });

      if (onDateChange) {
        onDateChange(newDate);
      }
    } catch (error) {
      console.error('changeEntryDate error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error changing entry date';
      setSaveError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  }, [backend, selectedEntryId, setIsSaving, setSaveError, onDateChange]);

  return {
    createNewEntry,
    saveEntry,
    handleDelete,
    changeEntryDate: changeEntryDateHandler,
  } satisfies UseEntryOperationsResult;
}
