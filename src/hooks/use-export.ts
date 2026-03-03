import { collection, getDocs } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useUser } from '@/firebase/auth/use-user';
import { useCallback, useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { JournalEntryData } from './use-journal-entries';

function isTimestampLike(value: unknown): value is { toDate(): Date } {
  return value !== null && typeof value === 'object' && typeof (value as { toDate?: unknown }).toDate === 'function';
}

function timestampToISO(value: unknown): string {
  if (isTimestampLike(value)) return value.toDate().toISOString();
  if (typeof value === 'string') return value;
  return new Date().toISOString();
}

function serializeEntry(entry: JournalEntryData & { id: string }): Record<string, unknown> {
  return {
    id: entry.id,
    content: entry.content,
    title: entry.title,
    date: entry.date,
    createdAt: timestampToISO(entry.createdAt),
    updatedAt: timestampToISO(entry.updatedAt),
    moods: entry.moods ?? [],
    moodEmojis: entry.moodEmojis ?? {},
    subjectEmoji: entry.subjectEmoji,
    themes: entry.themes ?? [],
    themeEmojis: entry.themeEmojis ?? {},
    keyTakeaways: entry.keyTakeaways ?? [],
    places: entry.places ?? [],
    characters: entry.characters ?? [],
    linkedEntryIds: entry.linkedEntryIds ?? [],
    conversationHistory: (entry.conversationHistory ?? []).map((msg) => ({
      role: msg.role,
      content: msg.content,
      timestamp: timestampToISO(msg.timestamp),
    })),
  };
}

function toSafeZipFileName(entryId: string): string {
  const sanitized = entryId
    .replace(/[/\\]/g, '_')
    .replace(/\.\./g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${sanitized || 'entry'}.md`;
}

function entryToMarkdown(entry: JournalEntryData & { id: string }): string {
  const lines: string[] = ['---'];
  if (entry.title) lines.push(`title: ${entry.title}`);
  lines.push(`date: ${entry.date}`);
  if (entry.moods?.length) lines.push(`moods: ${entry.moods.join(', ')}`);
  if (entry.themes?.length) lines.push(`themes: ${entry.themes.join(', ')}`);
  if (entry.places?.length) lines.push(`places: ${entry.places.join(', ')}`);
  if (entry.characters?.length) lines.push(`characters: ${entry.characters.join(', ')}`);
  if (entry.keyTakeaways?.length) {
    lines.push('keyTakeaways:');
    entry.keyTakeaways.forEach((k) => lines.push(`  - ${k}`));
  }
  lines.push('---', '', entry.content);
  return lines.join('\n');
}

export function useExport() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [isExporting, setIsExporting] = useState(false);

  const fetchAllEntries = useCallback(async (): Promise<(JournalEntryData & { id: string })[]> => {
    if (!firestore || !user) return [];
    const col = collection(firestore, `users/${user.uid}/entries`);
    const snapshot = await getDocs(col);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as JournalEntryData & { id: string }));
  }, [firestore, user]);

  const exportJSON = useCallback(async (): Promise<void> => {
    if (!firestore || !user) return;
    setIsExporting(true);
    try {
      const entries = await fetchAllEntries();
      const dateStr = new Date().toISOString().slice(0, 10);
      const payload = {
        version: 1,
        exportedAt: new Date().toISOString(),
        userId: user.uid,
        entries: entries.map(serializeEntry),
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      saveAs(blob, `mivoa-export-${dateStr}.json`);
    } finally {
      setIsExporting(false);
    }
  }, [fetchAllEntries, firestore, user]);

  const exportMarkdown = useCallback(async (): Promise<void> => {
    if (!firestore || !user) return;
    setIsExporting(true);
    try {
      const entries = await fetchAllEntries();
      const zip = new JSZip();
      entries.forEach((entry) => {
        zip.file(toSafeZipFileName(entry.id), entryToMarkdown(entry));
      });
      const dateStr = new Date().toISOString().slice(0, 10);
      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, `mivoa-export-${dateStr}.zip`);
    } finally {
      setIsExporting(false);
    }
  }, [fetchAllEntries, firestore, user]);

  return { exportJSON, exportMarkdown, isExporting };
}
