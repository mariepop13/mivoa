import { useState, useCallback, useRef } from 'react';
import { useFirestore } from '@/firebase';
import { useUser } from '@/firebase/auth/use-user';
import { collection, doc, getDoc, type DocumentSnapshot } from 'firebase/firestore';
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

type CachedEntries = Array<JournalEntryData & { id: string }>;
type CacheMap = Map<string, CachedEntries>;

const WHERE_IN_LIMIT = 10;

function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

function createCacheKey(linkedEntryIds: string[]): string {
  return linkedEntryIds.sort().join(',');
}

export function useEntryLinking(): UseEntryLinkingResult {
  const firestore = useFirestore();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef<Map<string, CacheMap>>(new Map());

  const invalidateCache = useCallback((entryId: string) => {
    const entryCache = cacheRef.current.get(entryId);
    if (entryCache) {
      entryCache.clear();
    }
  }, []);

  const getLinkedEntries = useCallback(async (
    entryId: string,
    linkedEntryIds?: string[]
  ): Promise<Array<JournalEntryData & { id: string }>> => {
    if (!firestore || !user || !linkedEntryIds || linkedEntryIds.length === 0) {
      return [];
    }

    const cacheKey = createCacheKey(linkedEntryIds);
    const entryCache = cacheRef.current.get(entryId);
    
    if (entryCache?.has(cacheKey)) {
      return entryCache.get(cacheKey)!;
    }

    try {
      const entriesCollectionRef = collection(firestore, `users/${user.uid}/entries`);
      const linkedEntriesMap = new Map<string, JournalEntryData & { id: string }>();
      
      const chunks = chunkArray(linkedEntryIds, WHERE_IN_LIMIT);
      
      for (const chunk of chunks) {
        const docPromises = chunk.map((entryId) => {
          const entryDocRef = doc(entriesCollectionRef, entryId);
          return getDoc(entryDocRef);
        });
        
        const docResults = await Promise.all(docPromises);
        
        docResults.forEach((docSnapshot: DocumentSnapshot) => {
          if (docSnapshot.exists()) {
            const entryData = docSnapshot.data() as JournalEntryData;
            linkedEntriesMap.set(docSnapshot.id, { ...entryData, id: docSnapshot.id });
          }
        });
      }

      const linkedEntries = linkedEntryIds
        .map((id) => linkedEntriesMap.get(id))
        .filter((entry): entry is JournalEntryData & { id: string } => entry !== undefined);

      if (!entryCache) {
        cacheRef.current.set(entryId, new Map());
      }
      cacheRef.current.get(entryId)!.set(cacheKey, linkedEntries);

      return linkedEntries;
    } catch (err) {
      console.error('Failed to fetch linked entries:', err);
      return [];
    }
  }, [firestore, user]);

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

    let previousFromCacheState: CachedEntries | null = null;
    let previousToCacheState: CachedEntries | null = null;

    try {
      const fromEntryRef = doc(firestore, `users/${user.uid}/entries/${fromEntryId}`);
      const fromEntryDoc = await getDoc(fromEntryRef);
      
      if (!fromEntryDoc.exists()) {
        throw new Error('Source entry not found');
      }

      const fromEntryData = fromEntryDoc.data() as JournalEntryData;
      const fromLinkedIds = fromEntryData.linkedEntryIds || [];

      const toEntryRef = doc(firestore, `users/${user.uid}/entries/${toEntryId}`);
      const toEntryDoc = await getDoc(toEntryRef);
      
      if (!toEntryDoc.exists()) {
        throw new Error('Target entry not found');
      }

      const toEntryData = toEntryDoc.data() as JournalEntryData;
      const toLinkedIds = toEntryData.linkedEntryIds || [];

      const validation = validateLink(fromEntryId, toEntryId, fromLinkedIds, toLinkedIds);

      if (!validation.valid) {
        setError(validation.error || 'Invalid link');
        setIsLoading(false);
        return;
      }

      const fromOptimisticEntry = { ...toEntryData, id: toEntryId };
      const toOptimisticEntry = { ...fromEntryData, id: fromEntryId };

      const fromCurrentCacheKey = createCacheKey(fromLinkedIds);
      const fromNewLinkedIds = [...fromLinkedIds, toEntryId];
      const fromNewCacheKey = createCacheKey(fromNewLinkedIds);
      
      const fromEntryCache = cacheRef.current.get(fromEntryId);
      if (fromEntryCache?.has(fromCurrentCacheKey)) {
        previousFromCacheState = fromEntryCache.get(fromCurrentCacheKey)!;
        const optimisticEntries = [...previousFromCacheState, fromOptimisticEntry];
        fromEntryCache.set(fromNewCacheKey, optimisticEntries);
      }

      const toCurrentCacheKey = createCacheKey(toLinkedIds);
      const toNewLinkedIds = [...toLinkedIds, fromEntryId];
      const toNewCacheKey = createCacheKey(toNewLinkedIds);
      
      const toEntryCache = cacheRef.current.get(toEntryId);
      if (toEntryCache?.has(toCurrentCacheKey)) {
        previousToCacheState = toEntryCache.get(toCurrentCacheKey)!;
        const optimisticEntries = [...previousToCacheState, toOptimisticEntry];
        toEntryCache.set(toNewCacheKey, optimisticEntries);
      }

      invalidateCache(fromEntryId);
      invalidateCache(toEntryId);

      await createEntryLink({
        fromEntryId,
        toEntryId,
        firestore,
        user,
      });
    } catch (err) {
      const fromEntryCache = cacheRef.current.get(fromEntryId);
      if (previousFromCacheState && fromEntryCache) {
        const fromEntryRef = doc(firestore, `users/${user.uid}/entries/${fromEntryId}`);
        const fromEntryDoc = await getDoc(fromEntryRef);
        const currentLinkedIds = fromEntryDoc.data()?.linkedEntryIds || [];
        const oldCacheKey = createCacheKey(currentLinkedIds);
        fromEntryCache.set(oldCacheKey, previousFromCacheState);
      }

      const toEntryCache = cacheRef.current.get(toEntryId);
      if (previousToCacheState && toEntryCache) {
        const toEntryRef = doc(firestore, `users/${user.uid}/entries/${toEntryId}`);
        const toEntryDoc = await getDoc(toEntryRef);
        const currentLinkedIds = toEntryDoc.data()?.linkedEntryIds || [];
        const oldCacheKey = createCacheKey(currentLinkedIds);
        toEntryCache.set(oldCacheKey, previousToCacheState);
      }

      const errorMessage = err instanceof Error ? err.message : 'Failed to create link';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [firestore, user, invalidateCache]);

  const unlinkEntry = useCallback(async (fromEntryId: string, toEntryId: string): Promise<void> => {
    if (!firestore || !user) {
      setError('User not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);

    let previousFromCacheState: CachedEntries | null = null;
    let previousToCacheState: CachedEntries | null = null;

    try {
      const fromEntryRef = doc(firestore, `users/${user.uid}/entries/${fromEntryId}`);
      const fromEntryDoc = await getDoc(fromEntryRef);
      
      if (!fromEntryDoc.exists()) {
        throw new Error('Source entry not found');
      }

      const fromEntryData = fromEntryDoc.data() as JournalEntryData;
      const fromLinkedIds = fromEntryData.linkedEntryIds || [];
      
      if (!fromLinkedIds.includes(toEntryId)) {
        setError('Link does not exist');
        setIsLoading(false);
        return;
      }

      const toEntryRef = doc(firestore, `users/${user.uid}/entries/${toEntryId}`);
      const toEntryDoc = await getDoc(toEntryRef);
      
      if (!toEntryDoc.exists()) {
        throw new Error('Target entry not found');
      }

      const toEntryData = toEntryDoc.data() as JournalEntryData;
      const toLinkedIds = toEntryData.linkedEntryIds || [];

      const fromCurrentCacheKey = createCacheKey(fromLinkedIds);
      const fromNewLinkedIds = fromLinkedIds.filter((id) => id !== toEntryId);
      const fromNewCacheKey = createCacheKey(fromNewLinkedIds);
      
      const fromEntryCache = cacheRef.current.get(fromEntryId);
      if (fromEntryCache?.has(fromCurrentCacheKey)) {
        previousFromCacheState = fromEntryCache.get(fromCurrentCacheKey)!;
        const optimisticEntries = previousFromCacheState.filter((entry) => entry.id !== toEntryId);
        fromEntryCache.set(fromNewCacheKey, optimisticEntries);
      }

      const toCurrentCacheKey = createCacheKey(toLinkedIds);
      const toNewLinkedIds = toLinkedIds.filter((id) => id !== fromEntryId);
      const toNewCacheKey = createCacheKey(toNewLinkedIds);
      
      const toEntryCache = cacheRef.current.get(toEntryId);
      if (toEntryCache?.has(toCurrentCacheKey)) {
        previousToCacheState = toEntryCache.get(toCurrentCacheKey)!;
        const optimisticEntries = previousToCacheState.filter((entry) => entry.id !== fromEntryId);
        toEntryCache.set(toNewCacheKey, optimisticEntries);
      }

      invalidateCache(fromEntryId);
      invalidateCache(toEntryId);

      await deleteEntryLink({
        fromEntryId,
        toEntryId,
        firestore,
        user,
      });
    } catch (err) {
      const fromEntryCache = cacheRef.current.get(fromEntryId);
      if (previousFromCacheState && fromEntryCache) {
        const fromEntryRef = doc(firestore, `users/${user.uid}/entries/${fromEntryId}`);
        const fromEntryDoc = await getDoc(fromEntryRef);
        const currentLinkedIds = fromEntryDoc.data()?.linkedEntryIds || [];
        const oldCacheKey = createCacheKey(currentLinkedIds);
        fromEntryCache.set(oldCacheKey, previousFromCacheState);
      }

      const toEntryCache = cacheRef.current.get(toEntryId);
      if (previousToCacheState && toEntryCache) {
        const toEntryRef = doc(firestore, `users/${user.uid}/entries/${toEntryId}`);
        const toEntryDoc = await getDoc(toEntryRef);
        const currentLinkedIds = toEntryDoc.data()?.linkedEntryIds || [];
        const oldCacheKey = createCacheKey(currentLinkedIds);
        toEntryCache.set(oldCacheKey, previousToCacheState);
      }

      const errorMessage = err instanceof Error ? err.message : 'Failed to remove link';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [firestore, user, invalidateCache]);

  return {
    linkEntry,
    unlinkEntry,
    getLinkedEntries,
    isLoading,
    error,
  };
}

