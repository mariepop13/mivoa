import { useState, useCallback, useRef } from 'react';
import { useFirestore } from '@/firebase';
import { useUser } from '@/firebase/auth/use-user';
import { collection, doc, getDoc, type DocumentSnapshot, type Firestore } from 'firebase/firestore';
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
  return [...linkedEntryIds].sort().join(',');
}

interface EntryData {
  data: JournalEntryData;
  linkedIds: string[];
}

async function fetchEntryData(
  firestore: Firestore,
  userId: string,
  entryId: string,
  errorMessage = 'Entry not found'
): Promise<EntryData> {
  const entryRef = doc(firestore, `users/${userId}/entries/${entryId}`);
  const entryDoc = await getDoc(entryRef);
  
  if (!entryDoc.exists()) {
    throw new Error(errorMessage);
  }

  const entryData = entryDoc.data() as JournalEntryData;
  return {
    data: entryData,
    linkedIds: entryData.linkedEntryIds || [],
  };
}

interface OptimisticCacheState {
  previousFromCacheState: CachedEntries | null;
  previousToCacheState: CachedEntries | null;
  fromCurrentCacheKey: string;
  toCurrentCacheKey: string;
}

function applyOptimisticLinkUpdate(
  cacheRef: React.MutableRefObject<Map<string, CacheMap>>,
  fromEntryId: string,
  toEntryId: string,
  fromLinkedIds: string[],
  toLinkedIds: string[],
  fromEntryData: JournalEntryData,
  toEntryData: JournalEntryData
): OptimisticCacheState {
  let previousFromCacheState: CachedEntries | null = null;
  let previousToCacheState: CachedEntries | null = null;

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

  return {
    previousFromCacheState,
    previousToCacheState,
    fromCurrentCacheKey,
    toCurrentCacheKey,
  };
}

function applyOptimisticUnlinkUpdate(
  cacheRef: React.MutableRefObject<Map<string, CacheMap>>,
  fromEntryId: string,
  toEntryId: string,
  fromLinkedIds: string[],
  toLinkedIds: string[]
): OptimisticCacheState {
  let previousFromCacheState: CachedEntries | null = null;
  let previousToCacheState: CachedEntries | null = null;

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

  return {
    previousFromCacheState,
    previousToCacheState,
    fromCurrentCacheKey,
    toCurrentCacheKey,
  };
}

async function rollbackCacheState(
  firestore: Firestore,
  userId: string,
  entryId: string,
  cacheRef: React.MutableRefObject<Map<string, CacheMap>>,
  previousState: CachedEntries | null
): Promise<void> {
  if (!previousState) return;

  const entryCache = cacheRef.current.get(entryId);
  if (!entryCache) return;

  try {
    const entryRef = doc(firestore, `users/${userId}/entries/${entryId}`);
    const entryDoc = await getDoc(entryRef);
    const currentLinkedIds = entryDoc.data()?.linkedEntryIds || [];
    const oldCacheKey = createCacheKey(currentLinkedIds);
    entryCache.set(oldCacheKey, previousState);
  } catch (fetchError) {
    console.error('Failed to fetch entry for cache rollback:', {
      entryId,
      error: fetchError instanceof Error ? fetchError.message : String(fetchError),
    });
    
    const fallbackLinkedIds = previousState.map((entry) => entry.id);
    const fallbackCacheKey = createCacheKey(fallbackLinkedIds);
    entryCache.set(fallbackCacheKey, previousState);
  }
}

async function fetchLinkedEntriesFromFirestore(
  firestore: Firestore,
  userId: string,
  linkedEntryIds: string[]
): Promise<Map<string, JournalEntryData & { id: string }>> {
  const entriesCollectionRef = collection(firestore, `users/${userId}/entries`);
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

  return linkedEntriesMap;
}

export function useEntryLinking(): UseEntryLinkingResult {
  const firestore = useFirestore();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef<Map<string, CacheMap>>(new Map());

  const invalidateCacheKey = useCallback((entryId: string, cacheKey: string) => {
    const entryCache = cacheRef.current.get(entryId);
    if (entryCache) {
      entryCache.delete(cacheKey);
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
      const linkedEntriesMap = await fetchLinkedEntriesFromFirestore(firestore, user.uid, linkedEntryIds);

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
    let fromCurrentCacheKey = '';
    let toCurrentCacheKey = '';

    try {
      const fromEntry = await fetchEntryData(firestore, user.uid, fromEntryId, 'Source entry not found');
      const toEntry = await fetchEntryData(firestore, user.uid, toEntryId, 'Target entry not found');

      const validation = validateLink(fromEntryId, toEntryId, fromEntry.linkedIds, toEntry.linkedIds);

      if (!validation.valid) {
        setError(validation.error || 'Invalid link');
        setIsLoading(false);
        return;
      }

      const optimisticState = applyOptimisticLinkUpdate(
        cacheRef,
        fromEntryId,
        toEntryId,
        fromEntry.linkedIds,
        toEntry.linkedIds,
        fromEntry.data,
        toEntry.data
      );
      previousFromCacheState = optimisticState.previousFromCacheState;
      previousToCacheState = optimisticState.previousToCacheState;
      fromCurrentCacheKey = optimisticState.fromCurrentCacheKey;
      toCurrentCacheKey = optimisticState.toCurrentCacheKey;

      await createEntryLink({
        fromEntryId,
        toEntryId,
        firestore,
        user,
      });

      invalidateCacheKey(fromEntryId, fromCurrentCacheKey);
      invalidateCacheKey(toEntryId, toCurrentCacheKey);
    } catch (err) {
      if (previousFromCacheState) {
        try {
          await rollbackCacheState(firestore, user.uid, fromEntryId, cacheRef, previousFromCacheState);
        } catch (rollbackError) {
          console.error('Failed to rollback cache for fromEntry:', {
            entryId: fromEntryId,
            error: rollbackError instanceof Error ? rollbackError.message : String(rollbackError),
          });
        }
      }

      if (previousToCacheState) {
        try {
          await rollbackCacheState(firestore, user.uid, toEntryId, cacheRef, previousToCacheState);
        } catch (rollbackError) {
          console.error('Failed to rollback cache for toEntry:', {
            entryId: toEntryId,
            error: rollbackError instanceof Error ? rollbackError.message : String(rollbackError),
          });
        }
      }

      const errorMessage = err instanceof Error ? err.message : 'Failed to create link';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [firestore, user, invalidateCacheKey]);

  const unlinkEntry = useCallback(async (fromEntryId: string, toEntryId: string): Promise<void> => {
    if (!firestore || !user) {
      setError('User not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);

    let previousFromCacheState: CachedEntries | null = null;
    let previousToCacheState: CachedEntries | null = null;
    let fromCurrentCacheKey = '';
    let toCurrentCacheKey = '';

    try {
      const fromEntry = await fetchEntryData(firestore, user.uid, fromEntryId, 'Source entry not found');
      
      if (!fromEntry.linkedIds.includes(toEntryId)) {
        setError('Link does not exist');
        setIsLoading(false);
        return;
      }

      const toEntry = await fetchEntryData(firestore, user.uid, toEntryId, 'Target entry not found');

      const optimisticState = applyOptimisticUnlinkUpdate(
        cacheRef,
        fromEntryId,
        toEntryId,
        fromEntry.linkedIds,
        toEntry.linkedIds
      );
      previousFromCacheState = optimisticState.previousFromCacheState;
      previousToCacheState = optimisticState.previousToCacheState;
      fromCurrentCacheKey = optimisticState.fromCurrentCacheKey;
      toCurrentCacheKey = optimisticState.toCurrentCacheKey;

      await deleteEntryLink({
        fromEntryId,
        toEntryId,
        firestore,
        user,
      });

      invalidateCacheKey(fromEntryId, fromCurrentCacheKey);
      invalidateCacheKey(toEntryId, toCurrentCacheKey);
    } catch (err) {
      if (previousFromCacheState) {
        try {
          await rollbackCacheState(firestore, user.uid, fromEntryId, cacheRef, previousFromCacheState);
        } catch (rollbackError) {
          console.error('Failed to rollback cache for fromEntry:', {
            entryId: fromEntryId,
            error: rollbackError instanceof Error ? rollbackError.message : String(rollbackError),
          });
        }
      }

      if (previousToCacheState) {
        try {
          await rollbackCacheState(firestore, user.uid, toEntryId, cacheRef, previousToCacheState);
        } catch (rollbackError) {
          console.error('Failed to rollback cache for toEntry:', {
            entryId: toEntryId,
            error: rollbackError instanceof Error ? rollbackError.message : String(rollbackError),
          });
        }
      }

      const errorMessage = err instanceof Error ? err.message : 'Failed to remove link';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [firestore, user, invalidateCacheKey]);

  return {
    linkEntry,
    unlinkEntry,
    getLinkedEntries,
    isLoading,
    error,
  };
}
