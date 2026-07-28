import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LocalStorageBackend } from '../local-storage-backend';

describe('LocalStorageBackend', () => {
  let backend: LocalStorageBackend;

  beforeEach(() => {
    localStorage.clear();
    backend = new LocalStorageBackend();
  });

  it('subscribeToAuthState immediately calls callback with local user', () => {
    const callback = vi.fn();
    const unsub = backend.subscribeToAuthState(callback);
    expect(callback).toHaveBeenCalledWith({
      uid: 'local',
      displayName: 'Local User',
      email: null,
      photoURL: null,
    });
    unsub();
  });

  it('createEntry then subscribeToEntriesByDate returns created entry', async () => {
    await backend.createEntry('e1', { content: 'hello', date: '2026-01-01' });

    const entries: import('../types').Entry[] = [];
    const unsub = backend.subscribeToEntriesByDate('2026-01-01', (e) => entries.push(...e));

    expect(entries).toHaveLength(1);
    expect(entries[0].content).toBe('hello');
    unsub();
  });

  it('updateEntry mutates the stored entry', async () => {
    await backend.createEntry('e1', { content: 'original', date: '2026-01-01' });
    await backend.updateEntry('e1', { content: 'updated' });

    const entries: import('../types').Entry[] = [];
    backend.subscribeToEntriesByDate('2026-01-01', (e) => { entries.length = 0; entries.push(...e); });

    expect(entries[0].content).toBe('updated');
  });

  it('deleteEntry removes the entry', async () => {
    await backend.createEntry('e1', { content: 'hello', date: '2026-01-01' });
    await backend.deleteEntry('e1');

    const entries: import('../types').Entry[] = [];
    backend.subscribeToEntriesByDate('2026-01-01', (e) => entries.push(...e));

    expect(entries).toHaveLength(0);
  });

  it('linkEntries creates a bidirectional echo between entries', async () => {
    await backend.createEntry('e1', { content: 'a', date: '2026-01-01' });
    await backend.createEntry('e2', { content: 'b', date: '2026-01-02' });
    await backend.linkEntries('e1', 'e2');

    const e1List: import('../types').Entry[] = [];
    const e2List: import('../types').Entry[] = [];
    const unsubE1 = backend.subscribeToEntry('e1', (e) => { if (e) e1List.push(e); });
    const unsubE2 = backend.subscribeToEntry('e2', (e) => { if (e) e2List.push(e); });

    expect(e1List[0].linkedEntryIds).toContain('e2');
    expect(e2List[0].linkedEntryIds).toContain('e1');
    unsubE1();
    unsubE2();
  });

  it('updateSettings persists and restores settings', async () => {
    await backend.updateSettings({ selectedModel: 'test-model' });

    const settings: (import('../types').Settings | null)[] = [];
    backend.subscribeToSettings((s) => settings.push(s));

    expect(settings[0]?.selectedModel).toBe('test-model');
  });

  it('subscriptions are safe when window is unavailable during server rendering', () => {
    const browserWindow = globalThis.window;
    vi.stubGlobal('window', undefined);

    try {
      const settings: (import('../types').Settings | null)[] = [];
      const unsubscribe = backend.subscribeToSettings((s) => settings.push(s));

      expect(settings).toEqual([null]);
      expect(unsubscribe).not.toThrow();
    } finally {
      vi.stubGlobal('window', browserWindow);
    }
  });
});
