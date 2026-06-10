import { beforeEach, describe, expect, it } from 'vitest';
import { SELF_REFLECTION_DEMO_ENTRIES } from '@/dev/self-reflection-demo-seed';
import { LocalStorageBackend } from '@/repositories/local-storage-backend';
import type { Entry, Settings } from '@/repositories/types';
import { seedDevData, SEED_ENTRY_IDS, SEED_SETTINGS } from '../seed-dev-data';

function readAllEntries(backend = new LocalStorageBackend()): Entry[] {
  let entries: Entry[] = [];
  const unsubscribe = backend.subscribeToAllEntries((nextEntries) => {
    entries = nextEntries;
  });
  unsubscribe();
  return entries;
}

function readSettings(backend = new LocalStorageBackend()): Settings | null {
  let settings: Settings | null = null;
  const unsubscribe = backend.subscribeToSettings((nextSettings) => {
    settings = nextSettings;
  });
  unsubscribe();
  return settings;
}

function findMissingReciprocalEchoes(entries: Entry[]): string[] {
  const entriesById = new Map(entries.map((entry) => [entry.id, entry]));

  return entries.flatMap((entry) =>
    (entry.linkedEntryIds ?? [])
      .filter((echoId) => !entriesById.get(echoId)?.linkedEntryIds?.includes(entry.id))
      .map((echoId) => `${entry.id}->${echoId}`)
  );
}

describe('seedDevData', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('creates the full self-reflection demo dataset', async () => {
    const result = await seedDevData();
    const entries = readAllEntries();

    expect(result.entriesCreated).toBe(SELF_REFLECTION_DEMO_ENTRIES.length);
    expect(entries).toHaveLength(SELF_REFLECTION_DEMO_ENTRIES.length);
    expect(entries.map((entry) => entry.id).sort()).toEqual([...SEED_ENTRY_IDS].sort());
  });

  it('seeds settings required by AI flows', async () => {
    await seedDevData();

    expect(readSettings()).toEqual(SEED_SETTINGS);
  });

  it('includes echoes, a finalized conversation, and a draft conversation', async () => {
    await seedDevData();
    const entries = readAllEntries();

    expect(entries.some((entry) => (entry.linkedEntryIds ?? []).length > 0)).toBe(true);
    expect(entries.some((entry) => entry.conversationMode && entry.summaryGeneratedAt)).toBe(true);
    expect(entries.some((entry) => entry.isDraft && entry.conversationMode)).toBe(true);
  });

  it('keeps seeded echoes bidirectional', async () => {
    await seedDevData();

    expect(findMissingReciprocalEchoes(readAllEntries())).toEqual([]);
  });

  it('resets only Mivoa-owned localStorage keys', async () => {
    window.localStorage.setItem('external:preference', 'keep-me');
    window.localStorage.setItem('mivoa:local:entries:v1', JSON.stringify({ stale: true }));
    window.localStorage.setItem('journal_prompt_2026-05-10', 'stale');

    await seedDevData({ mode: 'reset' });

    expect(window.localStorage.getItem('external:preference')).toBe('keep-me');
    expect(window.localStorage.getItem('journal_prompt_2026-05-10')).toBeNull();
    expect(readAllEntries()).toHaveLength(SELF_REFLECTION_DEMO_ENTRIES.length);
  });

  it('appends seed data without deleting user entries', async () => {
    const backend = new LocalStorageBackend();
    await backend.createEntry('user-entry', {
      content: 'Personal note',
      date: '2026-05-01',
    });

    await seedDevData({ mode: 'append' });

    const entries = readAllEntries();
    expect(entries.some((entry) => entry.id === 'user-entry')).toBe(true);
    expect(entries).toHaveLength(SELF_REFLECTION_DEMO_ENTRIES.length + 1);
  });
});
