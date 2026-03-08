export type EntryKind = 'text' | 'draft' | 'conversation';

export function getEntryKind(entry: {
  isDraft?: boolean;
  conversationMode?: boolean;
}): EntryKind {
  if (entry.isDraft) return 'draft';
  if (entry.conversationMode) return 'conversation';
  return 'text';
}
