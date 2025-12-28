import { format } from 'date-fns';
import type { JournalEntryData } from '@/hooks/use-journal-entries';

export function formatEntryTime(entry: JournalEntryData & { id: string }): string {
  const { createdAt } = entry;
  let date: Date;
  
  if (createdAt instanceof Date) {
    date = createdAt;
  } else if (typeof createdAt === 'string') {
    date = new Date(createdAt);
  } else {
    return '';
  }
  
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

