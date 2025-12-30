import { useMemo } from 'react';
import { useFirestore, useCollection, applyMemoMarker } from '@/firebase';
import { useUser } from '@/firebase/auth/use-user';
import { collection, query } from 'firebase/firestore';

interface UseEntryDatesResult {
  dates: string[];
  isLoading: boolean;
}

export function useEntryDates(): UseEntryDatesResult {
  const firestore = useFirestore();
  const { user } = useUser();

  const entriesCollectionRef = useMemo(() => {
    if (!firestore || !user) return null;
    return collection(firestore, `users/${user.uid}/entries`);
  }, [firestore, user]);

  const allEntriesQuery = useMemo(() => {
    if (!entriesCollectionRef) return null;
    return applyMemoMarker(query(entriesCollectionRef));
  }, [entriesCollectionRef]);

  const { data: entriesRaw, isLoading } = useCollection<{ date: string }>(
    allEntriesQuery
  );

  const dates = useMemo(() => {
    if (!entriesRaw) return [];
    
    const uniqueDates = new Set<string>();
    entriesRaw.forEach((entry) => {
      if (entry.date) {
        uniqueDates.add(entry.date);
      }
    });
    
    return Array.from(uniqueDates).sort((a, b) => {
      return b.localeCompare(a);
    });
  }, [entriesRaw]);

  return {
    dates,
    isLoading,
  };
}

