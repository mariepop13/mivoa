import { parse } from 'date-fns';
import type { JournalEntryData } from '@/hooks/use-journal-entries';

export function parseEntryDate(dateString: string): Date {
  try {
    return parse(dateString, 'yyyy-MM-dd', new Date());
  } catch {
    return new Date(dateString);
  }
}

export function getEntryPreview(content: string, maxLength = 100): string {
  if (!content) return '';
  if (content.length <= maxLength) return content;
  return content.slice(0, maxLength).trim() + '...';
}

export function validateLink(
  fromEntryId: string,
  toEntryId: string,
  linkedEntryIds?: string[]
): { valid: boolean; error?: string } {
  if (fromEntryId === toEntryId) {
    return { valid: false, error: 'cannotLinkToSelf' };
  }

  if (linkedEntryIds?.includes(toEntryId)) {
    return { valid: false, error: 'entryAlreadyLinked' };
  }

  return { valid: true };
}

