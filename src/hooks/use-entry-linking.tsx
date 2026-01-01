import { useState, useCallback } from 'react';
import { useFirestore } from '@/firebase';
import { useUser } from '@/firebase/auth/use-user';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { createEntryLink, deleteEntryLink } from '@/app/handlers/journal-handlers';
import { validateLink } from '@/utils/entry-linking-utils';
import type { JournalEntryData } from './use-journal-entries';

interface UseEntryLinkingResult {
  linkEntry: (fromEntryId: string, toEntryId: string) => Promise<void>;
  unlinkEntry: (fromEntryId: string, toEntryId: string) => Promise<void>;
  getLinkedEntries: (entryId: string, linkedEntryIds?: string[]) => Promise<Array<JournalEntryData & { id: string }>>;
  isLoading: boolean;
  error: string | null;
}

export function useEntryLinking(): UseEntryLinkingResult {
  const firestore = useFirestore();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const linkEntry = useCallback(async (fromEntryId: string, toEntryId: string): Promise<void> => {
    if (!firestore || !user) {
      setError('User not authenticated');
      return;
    }

    if (fromEntryId === toEntryId) {
      setError('cannotLinkToSelf');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const fromEntryRef = doc(firestore, `users/${user.uid}/entries/${fromEntryId}`);
      const fromEntryDoc = await getDoc(fromEntryRef);
      
      if (!fromEntryDoc.exists()) {
        throw new Error('Source entry not found');
      }

      const fromEntryData = fromEntryDoc.data() as JournalEntryData;
      const validation = validateLink(fromEntryId, toEntryId, fromEntryData.linkedEntryIds);

      if (!validation.valid) {
        setError(validation.error || 'Invalid link');
        setIsLoading(false);
        return;
      }

      await createEntryLink({
        fromEntryId,
        toEntryId,
        firestore,
        user,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create link';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [firestore, user]);

  const unlinkEntry = useCallback(async (fromEntryId: string, toEntryId: string): Promise<void> => {
    if (!firestore || !user) {
      setError('User not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await deleteEntryLink({
        fromEntryId,
        toEntryId,
        firestore,
        user,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove link';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [firestore, user]);

  const getLinkedEntries = useCallback(async (
    entryId: string,
    linkedEntryIds?: string[]
  ): Promise<Array<JournalEntryData & { id: string }>> => {
    if (!firestore || !user || !linkedEntryIds || linkedEntryIds.length === 0) {
      return [];
    }

    try {
      const entriesCollectionRef = collection(firestore, `users/${user.uid}/entries`);
      const linkedEntries: Array<JournalEntryData & { id: string }> = [];

      for (const linkedId of linkedEntryIds) {
        const entryDocRef = doc(entriesCollectionRef, linkedId);
        const entryDoc = await getDoc(entryDocRef);
        
        if (entryDoc.exists()) {
          const entryData = entryDoc.data() as JournalEntryData;
          linkedEntries.push({ ...entryData, id: linkedId });
        }
      }

      return linkedEntries;
    } catch (err) {
      console.error('Failed to fetch linked entries:', err);
      return [];
    }
  }, [firestore, user]);

  return {
    linkEntry,
    unlinkEntry,
    getLinkedEntries,
    isLoading,
    error,
  };
}

