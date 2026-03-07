import { useStorage } from '@/repositories/storage-provider';
import type { StorageBackend } from '@/repositories/storage-backend';
import type { EntryCreateData } from '@/repositories/types';
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
  return new Date(0).toISOString();
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

function getAllEntryIds(backend: StorageBackend): Promise<Set<string>> {
  return new Promise((resolve) => {
    let resolved = false;
    let unsubscribe: (() => void) | null = null;

    const handleEntries = (entries: Entry[]) => {
      if (resolved) return;
      resolved = true;
      resolve(new Set(entries.map((e) => e.id)));
      unsubscribe?.();
    };

    unsubscribe = backend.subscribeToAllEntries(handleEntries);
    if (resolved) unsubscribe();
  });
}

export function useImport() {
  const { backend } = useStorage();
  const [isImporting, setIsImporting] = useState(false);

  const parseFile = useCallback(async (file: File): Promise<ImportPreview | null> => {
    if (!backend) return null;

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

    const existingIds = await getAllEntryIds(backend);

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
  }, [backend]);

  const importEntries = useCallback(async (preview: ImportPreview): Promise<number> => {
    if (!backend) return 0;
    setIsImporting(true);
    try {
      await Promise.all(
        preview.entries.map(({ id, createdAt, updatedAt, ...data }) =>
          backend.createEntry(id, { ...data, createdAt, updatedAt } as EntryCreateData)
        )
      );
      return preview.newCount;
    } finally {
      setIsImporting(false);
    }
  }, [backend]);

  return { parseFile, importEntries, isImporting };
}
