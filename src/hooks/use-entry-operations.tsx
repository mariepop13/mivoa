import { useCallback } from 'react';
import { useFirestore, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { useUser } from '@/firebase/auth/use-user';
import { serverTimestamp } from 'firebase/firestore';
import { generateEntryId, createEntryDocument, triggerEntryAnalysis, changeEntryDate } from '@/app/handlers/journal-handlers';
import { useEntryAnalysis } from './use-entry-analysis';
import { useSubscriptionLimits } from './use-subscription-limits';
import { useSubscription } from './use-subscription';
import type { JournalEntryData } from './use-journal-entries';

function getNextEntryId(
  entries: (JournalEntryData & { id: string })[],
  currentEntryId: string
): string | null {
  const currentIndex = entries.findIndex(e => e.id === currentEntryId);
  const remainingEntries = entries.filter(e => e.id !== currentEntryId);
  
  if (remainingEntries.length === 0) {
    return null;
  }
  
  const nextIndex = currentIndex < remainingEntries.length ? currentIndex : remainingEntries.length - 1;
  return remainingEntries[nextIndex].id;
}

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
  onDateChange,
}: UseEntryOperationsParams): UseEntryOperationsResult {
  const firestore = useFirestore();
  const { user } = useUser();
  const { analyze } = useEntryAnalysis();
  const { checkBeforeCreate, canCreateEntry } = useSubscriptionLimits();
  const { plan } = useSubscription();

  const createNewEntry = useCallback(async (initialContent: string = '', initialTitle: string = '') => {
    if (!user || !firestore) {
      console.warn('Cannot create entry: missing user or firestore');
      return;
    }

    if (!canCreateEntry) {
      setSaveError('Entry limit reached. Please upgrade your plan to create more entries.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const canCreate = await checkBeforeCreate();
      if (!canCreate) {
        setSaveError('Entry limit reached. Please upgrade your plan to create more entries.');
        setIsSaving(false);
        return;
      }

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
      triggerEntryAnalysis({ content: initialContent, entryId, firestore, user, plan, analyze });
    } catch (error) {
      console.error('setDoc error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error creating entry';
      setSaveError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  }, [user, firestore, dateKey, updateEntryState, analyze, setIsSaving, setSaveError, canCreateEntry, checkBeforeCreate, plan]);

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
    selectedEntryDocRef,
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
    if (!selectedEntryDocRef || !selectedEntryId || !user || !firestore) {
      console.warn('Cannot change date: missing entryDocRef, entryId, user, or firestore');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      await changeEntryDate({
        entryId: selectedEntryId,
        newDate,
        firestore,
        user,
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
  }, [selectedEntryDocRef, selectedEntryId, user, firestore, setIsSaving, setSaveError, onDateChange]);

  return {
    createNewEntry,
    saveEntry,
    handleDelete,
    changeEntryDate: changeEntryDateHandler,
  } satisfies UseEntryOperationsResult;
}


