import { collection, getDocs, doc } from 'firebase/firestore';
import { useFirestore, setDocumentNonBlocking } from '@/firebase';
import { useUser } from '@/firebase/auth/use-user';
import { useCallback, useState } from 'react';
import type { JournalEntryData } from './use-journal-entries';

export interface ImportPreview {
  total: number;
  newCount: number;
  skippedCount: number;
  entries: (JournalEntryData & { id: string })[];
}

const ENTRY_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function validateRawEntry(raw: Record<string, unknown>): void {
  if (typeof raw.id !== 'string' || raw.id.trim() === '') {
    throw new Error('invalid_file');
  }
  if (typeof raw.date !== 'string' || !ENTRY_DATE_PATTERN.test(raw.date)) {
    throw new Error('invalid_file');
  }
}

function isoToString(value: unknown): string {
  if (typeof value === 'string') return value;
  return new Date().toISOString();
}

function deserializeEntry(raw: Record<string, unknown>): JournalEntryData & { id: string } {
  const history = raw.conversationHistory as Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }> | undefined;

  return {
    id: raw.id as string,
    content: (raw.content as string) ?? '',
    title: raw.title as string | undefined,
    date: raw.date as string,
    createdAt: isoToString(raw.createdAt),
    updatedAt: isoToString(raw.updatedAt),
    moods: raw.moods as string[] | undefined,
    moodEmojis: raw.moodEmojis as Record<string, string> | undefined,
    subjectEmoji: raw.subjectEmoji as string | undefined,
    themes: raw.themes as string[] | undefined,
    themeEmojis: raw.themeEmojis as Record<string, string> | undefined,
    keyTakeaways: raw.keyTakeaways as string[] | undefined,
    places: raw.places as string[] | undefined,
    characters: raw.characters as string[] | undefined,
    linkedEntryIds: raw.linkedEntryIds as string[] | undefined,
    conversationHistory: history?.map((msg) => ({
      role: msg.role,
      content: msg.content,
      timestamp: isoToString(msg.timestamp),
    })),
  };
}

export function useImport() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [isImporting, setIsImporting] = useState(false);

  const parseFile = useCallback(async (file: File): Promise<ImportPreview | null> => {
    if (!firestore || !user) return null;

    const text = await file.text();
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(text) as Record<string, unknown>;
    } catch {
      throw new Error('invalid_json');
    }

    if (parsed.version !== 1) throw new Error('unsupported_version');

    if (!Array.isArray(parsed.entries)) throw new Error('invalid_file');
    const rawEntries = parsed.entries as Array<Record<string, unknown>>;
    rawEntries.forEach(validateRawEntry);

    const col = collection(firestore, `users/${user.uid}/entries`);
    const snapshot = await getDocs(col);
    const existingIds = new Set(snapshot.docs.map((d) => d.id));

    const entriesById = new Map<string, JournalEntryData & { id: string }>();
    rawEntries.forEach((raw) => {
      const entry = deserializeEntry(raw);
      entriesById.set(entry.id, entry);
    });
    const entries = [...entriesById.values()];
    const newEntries = entries.filter((e) => !existingIds.has(e.id));

    return {
      total: entries.length,
      newCount: newEntries.length,
      skippedCount: entries.length - newEntries.length,
      entries: newEntries,
    };
  }, [firestore, user]);

  const importEntries = useCallback(async (preview: ImportPreview): Promise<number> => {
    if (!firestore || !user) return 0;
    setIsImporting(true);
    try {
      await Promise.all(
        preview.entries.map((entry) => {
          const { id, ...data } = entry;
          const ref = doc(firestore, `users/${user.uid}/entries/${id}`);
          return setDocumentNonBlocking(ref, data, {});
        })
      );
      return preview.newCount;
    } finally {
      setIsImporting(false);
    }
  }, [firestore, user]);

  return { parseFile, importEntries, isImporting };
}
