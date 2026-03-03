import { format } from 'date-fns';
import type { JournalEntryData } from '@/hooks/use-journal-entries';

export function formatEntryTime(entry: JournalEntryData & { id: string }): string {
  const { createdAt } = entry;
  if (!createdAt) return '';
  const date = new Date(createdAt);

  if (isNaN(date.getTime())) {
    return '';
  }

  return format(date, 'HH:mm:ss');
}

export function getEntryTitle(
  entry: (JournalEntryData & { id: string }) | undefined,
  allEntries: (JournalEntryData & { id: string })[] | null
): string {
  if (entry?.title) return entry.title;
  if (entry) return formatEntryTime(entry);
  if (allEntries?.[0]) return formatEntryTime(allEntries[0]);
  return '';
}

export function convertTimestampToDate(timestamp: Date | string | { toDate(): Date }): Date {
  if (timestamp instanceof Date) {
    return timestamp;
  }
  if (typeof timestamp === 'string') {
    return new Date(timestamp);
  }
  if (typeof timestamp === 'object' && 'toDate' in timestamp) {
    return timestamp.toDate();
  }
  return new Date();
}

