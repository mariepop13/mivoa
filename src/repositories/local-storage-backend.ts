import type { StorageBackend } from './storage-backend';
import type { AppUser, Entry, EntryCreateData, EntryUpdateData, Settings, Unsubscribe } from './types';

const STORAGE_KEY_ENTRIES = 'mivoa:local:entries:v1';
const STORAGE_KEY_SETTINGS = 'mivoa:local:settings:v1';
const LOCAL_USER: AppUser = {
  uid: 'local',
  displayName: 'Local User',
  email: null,
  photoURL: null,
};

function readEntries(): Record<string, Entry> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ENTRIES);
    return raw ? (JSON.parse(raw) as Record<string, Entry>) : {};
  } catch {
    return {};
  }
}

function writeEntries(entries: Record<string, Entry>): void {
  localStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify(entries));
  window.dispatchEvent(new CustomEvent('mivoa:entries:changed'));
}

function readSettings(): Settings | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    return raw ? (JSON.parse(raw) as Settings) : null;
  } catch {
    return null;
  }
}

function writeSettings(settings: Settings): void {
  localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  window.dispatchEvent(new CustomEvent('mivoa:settings:changed'));
}

export class LocalStorageBackend implements StorageBackend {
  subscribeToAuthState(callback: (user: AppUser | null) => void): Unsubscribe {
    callback(LOCAL_USER);
    return () => {};
  }

  subscribeToEntriesByDate(dateKey: string, callback: (entries: Entry[]) => void): Unsubscribe {
    const notify = (): void => {
      const all = readEntries();
      callback(Object.values(all).filter((e) => e.date === dateKey));
    };
    notify();
    window.addEventListener('mivoa:entries:changed', notify);
    return () => window.removeEventListener('mivoa:entries:changed', notify);
  }

  subscribeToEntry(entryId: string, callback: (entry: Entry | null) => void): Unsubscribe {
    const notify = (): void => {
      const all = readEntries();
      callback(all[entryId] ?? null);
    };
    notify();
    window.addEventListener('mivoa:entries:changed', notify);
    return () => window.removeEventListener('mivoa:entries:changed', notify);
  }

  subscribeToAllEntries(callback: (entries: Entry[]) => void): Unsubscribe {
    const notify = (): void => callback(Object.values(readEntries()));
    notify();
    window.addEventListener('mivoa:entries:changed', notify);
    return () => window.removeEventListener('mivoa:entries:changed', notify);
  }

  subscribeToEntriesInDateRange(fromKey: string, toKey: string, callback: (entries: Entry[]) => void): Unsubscribe {
    const notify = (): void => {
      const all = readEntries();
      callback(Object.values(all).filter((e) => e.date >= fromKey && e.date <= toKey));
    };
    notify();
    window.addEventListener('mivoa:entries:changed', notify);
    return () => window.removeEventListener('mivoa:entries:changed', notify);
  }

  subscribeToSettings(callback: (settings: Settings | null) => void): Unsubscribe {
    const notify = (): void => callback(readSettings());
    notify();
    window.addEventListener('mivoa:settings:changed', notify);
    return () => window.removeEventListener('mivoa:settings:changed', notify);
  }

  async getEntries(ids: string[]): Promise<Entry[]> {
    const all = readEntries();
    return ids.map((id) => all[id]).filter((e): e is Entry => e !== undefined);
  }

  async createEntry(entryId: string, data: EntryCreateData): Promise<void> {
    const now = new Date().toISOString();
    const entries = readEntries();
    entries[entryId] = { ...data, id: entryId, createdAt: data.createdAt ?? now, updatedAt: data.updatedAt ?? now };
    writeEntries(entries);
  }

  async updateEntry(entryId: string, data: EntryUpdateData): Promise<void> {
    const entries = readEntries();
    if (!entries[entryId]) throw new Error(`Entry ${entryId} not found`);
    entries[entryId] = { ...entries[entryId], ...data, updatedAt: new Date().toISOString() };
    writeEntries(entries);
  }

  async deleteEntry(entryId: string): Promise<void> {
    const entries = readEntries();
    delete entries[entryId];
    writeEntries(entries);
  }

  async linkEntries(fromId: string, toId: string): Promise<void> {
    const entries = readEntries();
    const addLink = (entry: Entry, otherId: string): Entry => ({
      ...entry,
      linkedEntryIds: [...new Set([...(entry.linkedEntryIds ?? []), otherId])],
      updatedAt: new Date().toISOString(),
    });
    if (entries[fromId]) entries[fromId] = addLink(entries[fromId], toId);
    if (entries[toId]) entries[toId] = addLink(entries[toId], fromId);
    writeEntries(entries);
  }

  async unlinkEntries(fromId: string, toId: string): Promise<void> {
    const entries = readEntries();
    const removeLink = (entry: Entry, otherId: string): Entry => ({
      ...entry,
      linkedEntryIds: (entry.linkedEntryIds ?? []).filter((id) => id !== otherId),
      updatedAt: new Date().toISOString(),
    });
    if (entries[fromId]) entries[fromId] = removeLink(entries[fromId], toId);
    if (entries[toId]) entries[toId] = removeLink(entries[toId], fromId);
    writeEntries(entries);
  }

  async updateSettings(data: Partial<Settings>): Promise<void> {
    writeSettings({ ...readSettings(), ...data });
  }

  async signOut(): Promise<void> {
    // No-op in local mode — user is always "logged in"
  }
}
