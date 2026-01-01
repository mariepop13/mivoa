import { parse } from 'date-fns';

export function parseEntryDate(dateString: string): Date {
  try {
    return parse(dateString, 'yyyy-MM-dd', new Date());
  } catch (err) {
    console.error('Failed to parse entry date:', {
      dateString,
      error: err instanceof Error ? err.message : String(err),
    });
    return new Date(dateString);
  }
}

export function getEntryPreview(content: string, maxLength = 100): string {
  if (!content) return '';
  if (content.length <= maxLength) return content;
  return `${content.slice(0, maxLength).trim()}...`;
}

export function validateLink(
  fromEntryId: string,
  toEntryId: string,
  fromLinkedEntryIds?: string[],
  toLinkedEntryIds?: string[]
): { valid: boolean; error?: string } {
  if (fromEntryId === toEntryId) {
    return { valid: false, error: 'cannotLinkToSelf' };
  }

  if (fromLinkedEntryIds?.includes(toEntryId) || toLinkedEntryIds?.includes(fromEntryId)) {
    return { valid: false, error: 'entryAlreadyLinked' };
  }

  return { valid: true };
}

export function areEntriesLinked(
  entryId1: string,
  entryId2: string,
  entry1LinkedIds?: string[],
  entry2LinkedIds?: string[]
): boolean {
  return (
    entry1LinkedIds?.includes(entryId2) === true ||
    entry2LinkedIds?.includes(entryId1) === true
  );
}

