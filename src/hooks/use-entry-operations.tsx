import { useCallback } from 'react';
import { useFirestore, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { useUser } from '@/firebase/auth/use-user';
import { serverTimestamp } from 'firebase/firestore';
import { generateEntryId, createEntryDocument, triggerEntryAnalysis } from '@/app/handlers/journal-handlers';
import { useEntryAnalysis } from './use-entry-analysis';
import type { JournalEntryData } from './use-journal-entries';

interface UseEntryOperationsParams {
  dateKey: string;
  selectedEntryDocRef: ReturnType<typeof import('firebase/firestore').doc> | null;
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
}

interface UseEntryOperationsResult {
  createNewEntry: (initialContent?: string, initialTitle?: string) => Promise<void>;
  saveEntry: (newContent: string) => Promise<void>;
  handleDelete: () => Promise<void>;
}

export function useEntryOperations({
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
}: UseEntryOperationsParams) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { analyze } = useEntryAnalysis();

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
  }, [user, firestore, dateKey, updateEntryState, analyze, setIsSaving, setSaveError]);

  const saveEntry = useCallback(async (newContent: string) => {
    if (!selectedEntryDocRef || !user) {
      console.warn('Cannot save: missing entryDocRef or user');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    
    try {
      const data: Record<string, unknown> = {
        content: newContent,
        updatedAt: serverTimestamp(),
      };

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
  }, [selectedEntryDocRef, user, setIsSaving, setSaveError, setLastSavedAt]);

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
  }, [selectedEntryDocRef, selectedEntryId, entries, setSelectedEntryId, setContent, setTitle, setLastSavedAt, setIsSaving, setSaveError, hasInitializedRef]);

  return {
    createNewEntry,
    saveEntry,
    handleDelete,
  } satisfies UseEntryOperationsResult;
}


