import type { AppUser, Entry, EntryCreateData, EntryUpdateData, Settings, Unsubscribe } from './types';

export interface StorageBackend {
  subscribeToAuthState(callback: (user: AppUser | null) => void): Unsubscribe;

  subscribeToEntriesByDate(
    dateKey: string,
    callback: (entries: Entry[]) => void
  ): Unsubscribe;

  subscribeToEntry(
    entryId: string,
    callback: (entry: Entry | null) => void
  ): Unsubscribe;

  subscribeToAllEntries(callback: (entries: Entry[]) => void): Unsubscribe;

  subscribeToSettings(callback: (settings: Settings | null) => void): Unsubscribe;

  createEntry(entryId: string, data: EntryCreateData): Promise<void>;
  updateEntry(entryId: string, data: EntryUpdateData): Promise<void>;
  deleteEntry(entryId: string): Promise<void>;
  linkEntries(fromId: string, toId: string): Promise<void>;
  unlinkEntries(fromId: string, toId: string): Promise<void>;
  updateSettings(data: Partial<Settings>): Promise<void>;

  signOut(): Promise<void>;
}
