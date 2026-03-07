import { useMemo } from 'react';
import { useAllEntries } from '@/repositories/storage-provider';

interface UseEntryDatesResult {
  dates: string[];
  isLoading: boolean;
}

export function useEntryDates(): UseEntryDatesResult {
  const { data: entriesRaw, isLoading } = useAllEntries();

  const dates = useMemo(() => {
    if (!entriesRaw) return [];

    const uniqueDates = new Set<string>();
    entriesRaw.forEach((entry) => {
      if (entry.date) {
        uniqueDates.add(entry.date);
      }
    });

    return Array.from(uniqueDates).sort((a, b) => b.localeCompare(a));
  }, [entriesRaw]);

  return {
    dates,
    isLoading,
  };
}
