# Storage Backend Abstraction Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow Mivoa to run with either Firebase or localStorage as storage backend, selectable via `NEXT_PUBLIC_STORAGE_BACKEND=firebase|local`, so contributors can self-host with zero Firebase dependency.

**Architecture:** Introduce a `StorageBackend` interface using the Observer pattern (`subscribe*` methods). Firebase implementation wraps existing `onSnapshot` calls; localStorage implementation uses a custom event emitter. A `StorageProvider` React context exposes the chosen backend to all hooks and contexts. Existing Firebase-specific hooks (`useCollection`, `useDoc`) are replaced by backend-agnostic hooks (`useEntriesByDate`, `useEntry`, etc.).

**Tech Stack:** TypeScript interfaces, React context, localStorage JSON, custom event emitter (no extra deps).

---

### Task 1: Define backend-agnostic domain types

**Files:**
- Create: `src/repositories/types.ts`

**Step 1: Write the file**

```typescript
export interface AppUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string; // ISO 8601 — no Firebase Timestamp
}

export interface Entry {
  id: string;
  content: string;
  title?: string;
  date: string; // yyyy-MM-dd
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  isDraft?: boolean;
  conversationMode?: boolean;
  conversationHistory?: ConversationMessage[];
  summaryGeneratedAt?: string; // ISO 8601
  moods?: string[];
  moodEmojis?: Record<string, string>;
  subjectEmoji?: string;
  themes?: string[];
  themeEmojis?: Record<string, string>;
  keyTakeaways?: string[];
  places?: string[];
  characters?: string[];
  aiProcessedAt?: string; // ISO 8601
  linkedEntryIds?: string[];
}

export type EntryCreateData = Omit<Entry, 'id' | 'createdAt' | 'updatedAt'>;
export type EntryUpdateData = Partial<Omit<Entry, 'id' | 'createdAt'>>;

export interface Settings {
  openRouterApiKey?: string;
  selectedModel?: string;
}

export type Unsubscribe = () => void;
```

**Step 2: No test needed** (pure types, no logic).

**Step 3: Typecheck**

```bash
cd /Users/marie/_Code/mivoa && npm run typecheck
```

Expected: No errors.

**Step 4: Commit**

```bash
git add src/repositories/types.ts
git commit -m "✨ feat: add backend-agnostic domain types for storage abstraction"
```

---

### Task 2: Define the StorageBackend interface

**Files:**
- Create: `src/repositories/storage-backend.ts`

**Step 1: Write the file**

```typescript
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
```

**Step 2: Typecheck**

```bash
npm run typecheck
```

**Step 3: Commit**

```bash
git add src/repositories/storage-backend.ts
git commit -m "✨ feat: define StorageBackend interface for pluggable storage"
```

---

### Task 3: Implement FirebaseStorageBackend

**Files:**
- Create: `src/repositories/firebase-storage-backend.ts`
- Create: `src/repositories/__tests__/firebase-storage-backend.test.ts`

**Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FirebaseStorageBackend } from '../firebase-storage-backend';

const mockOnSnapshot = vi.fn(() => vi.fn());
const mockSetDoc = vi.fn();
const mockUpdateDoc = vi.fn();
const mockDeleteDoc = vi.fn();
const mockWriteBatch = vi.fn(() => ({
  update: vi.fn(),
  commit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn((_, path) => ({ path })),
  query: vi.fn((ref) => ref),
  where: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: mockOnSnapshot,
  setDoc: mockSetDoc,
  updateDoc: mockUpdateDoc,
  deleteDoc: mockDeleteDoc,
  writeBatch: mockWriteBatch,
  serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
  Timestamp: { fromDate: (d: Date) => ({ toDate: () => d, toMillis: () => d.getTime() }) },
  arrayUnion: vi.fn((v) => v),
  arrayRemove: vi.fn((v) => v),
}));

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn((_, cb) => { cb(null); return vi.fn(); }),
  signOut: vi.fn(),
}));

describe('FirebaseStorageBackend', () => {
  const mockFirestore = {} as import('firebase/firestore').Firestore;
  const mockAuth = {} as import('firebase/auth').Auth;

  it('subscribeToAuthState calls callback with null when no user', () => {
    const backend = new FirebaseStorageBackend(mockFirestore, mockAuth);
    const callback = vi.fn();
    const unsubscribe = backend.subscribeToAuthState(callback);
    expect(callback).toHaveBeenCalledWith(null);
    unsubscribe();
  });

  it('subscribeToEntriesByDate calls onSnapshot', () => {
    const backend = new FirebaseStorageBackend(mockFirestore, mockAuth);
    mockOnSnapshot.mockReturnValue(vi.fn());
    backend.subscribeToEntriesByDate('2026-01-01', vi.fn());
    expect(mockOnSnapshot).toHaveBeenCalled();
  });

  it('createEntry calls setDoc', async () => {
    mockSetDoc.mockResolvedValue(undefined);
    const backend = new FirebaseStorageBackend(mockFirestore, mockAuth, { uid: 'u1' } as import('firebase/auth').User);
    await backend.createEntry('e1', {
      content: 'hello',
      date: '2026-01-01',
    });
    expect(mockSetDoc).toHaveBeenCalled();
  });
});
```

**Step 2: Run test to confirm it fails**

```bash
npx vitest run src/repositories/__tests__/firebase-storage-backend.test.ts
```

Expected: FAIL — `FirebaseStorageBackend` not found.

**Step 3: Implement `FirebaseStorageBackend`**

```typescript
import {
  collection, doc, query, where, onSnapshot,
  setDoc, updateDoc, deleteDoc, writeBatch,
  serverTimestamp, Timestamp, arrayUnion, arrayRemove,
  type Firestore,
} from 'firebase/firestore';
import { onAuthStateChanged, signOut as firebaseSignOut, type Auth, type User } from 'firebase/auth';
import type { StorageBackend } from './storage-backend';
import type { AppUser, Entry, EntryCreateData, EntryUpdateData, Settings, Unsubscribe } from './types';

function toAppUser(user: User | null): AppUser | null {
  if (!user) return null;
  return {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
  };
}

function timestampToIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === 'string') return value;
  return new Date().toISOString();
}

function firestoreDocToEntry(id: string, data: Record<string, unknown>): Entry {
  return {
    id,
    content: (data.content as string) ?? '',
    title: data.title as string | undefined,
    date: data.date as string,
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
    isDraft: data.isDraft as boolean | undefined,
    conversationMode: data.conversationMode as boolean | undefined,
    conversationHistory: (data.conversationHistory as Array<{
      role: 'user' | 'assistant'; content: string; timestamp: unknown;
    }> | undefined)?.map((m) => ({
      role: m.role,
      content: m.content,
      timestamp: timestampToIso(m.timestamp),
    })),
    summaryGeneratedAt: data.summaryGeneratedAt ? timestampToIso(data.summaryGeneratedAt) : undefined,
    moods: data.moods as string[] | undefined,
    moodEmojis: data.moodEmojis as Record<string, string> | undefined,
    subjectEmoji: data.subjectEmoji as string | undefined,
    themes: data.themes as string[] | undefined,
    themeEmojis: data.themeEmojis as Record<string, string> | undefined,
    keyTakeaways: data.keyTakeaways as string[] | undefined,
    places: data.places as string[] | undefined,
    characters: data.characters as string[] | undefined,
    aiProcessedAt: data.aiProcessedAt ? timestampToIso(data.aiProcessedAt) : undefined,
    linkedEntryIds: data.linkedEntryIds as string[] | undefined,
  };
}

export class FirebaseStorageBackend implements StorageBackend {
  private currentUser: User | null;

  constructor(
    private readonly firestore: Firestore,
    private readonly auth: Auth,
    initialUser: User | null = null
  ) {
    this.currentUser = initialUser;
  }

  subscribeToAuthState(callback: (user: AppUser | null) => void): Unsubscribe {
    return onAuthStateChanged(this.auth, (user) => {
      this.currentUser = user;
      callback(toAppUser(user));
    });
  }

  subscribeToEntriesByDate(dateKey: string, callback: (entries: Entry[]) => void): Unsubscribe {
    if (!this.currentUser) { callback([]); return () => {}; }
    const uid = this.currentUser.uid;
    const ref = query(
      collection(this.firestore, `users/${uid}/entries`),
      where('date', '==', dateKey)
    );
    return onSnapshot(ref, (snapshot) => {
      const entries = snapshot.docs.map((d) =>
        firestoreDocToEntry(d.id, d.data() as Record<string, unknown>)
      );
      callback(entries);
    });
  }

  subscribeToEntry(entryId: string, callback: (entry: Entry | null) => void): Unsubscribe {
    if (!this.currentUser) { callback(null); return () => {}; }
    const uid = this.currentUser.uid;
    const ref = doc(this.firestore, `users/${uid}/entries/${entryId}`);
    return onSnapshot(ref, (snapshot) => {
      if (!snapshot.exists()) { callback(null); return; }
      callback(firestoreDocToEntry(snapshot.id, snapshot.data() as Record<string, unknown>));
    });
  }

  subscribeToAllEntries(callback: (entries: Entry[]) => void): Unsubscribe {
    if (!this.currentUser) { callback([]); return () => {}; }
    const uid = this.currentUser.uid;
    const ref = collection(this.firestore, `users/${uid}/entries`);
    return onSnapshot(ref, (snapshot) => {
      callback(snapshot.docs.map((d) =>
        firestoreDocToEntry(d.id, d.data() as Record<string, unknown>)
      ));
    });
  }

  subscribeToSettings(callback: (settings: Settings | null) => void): Unsubscribe {
    if (!this.currentUser) { callback(null); return () => {}; }
    const uid = this.currentUser.uid;
    const ref = doc(this.firestore, `users/${uid}/settings/api`);
    return onSnapshot(ref, (snapshot) => {
      if (!snapshot.exists()) { callback(null); return; }
      const data = snapshot.data();
      callback({
        openRouterApiKey: data.openRouterApiKey as string | undefined,
        selectedModel: data.selectedModel as string | undefined,
      });
    });
  }

  async createEntry(entryId: string, data: EntryCreateData): Promise<void> {
    if (!this.currentUser) throw new Error('Not authenticated');
    const uid = this.currentUser.uid;
    const ref = doc(this.firestore, `users/${uid}/entries/${entryId}`);
    const payload: Record<string, unknown> = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (data.conversationHistory) {
      payload.conversationHistory = data.conversationHistory.map((m) => ({
        ...m,
        timestamp: Timestamp.fromDate(new Date(m.timestamp)),
      }));
    }
    await setDoc(ref, payload);
  }

  async updateEntry(entryId: string, data: EntryUpdateData): Promise<void> {
    if (!this.currentUser) throw new Error('Not authenticated');
    const uid = this.currentUser.uid;
    const ref = doc(this.firestore, `users/${uid}/entries/${entryId}`);
    const payload: Record<string, unknown> = {
      ...data,
      updatedAt: serverTimestamp(),
    };
    if (data.conversationHistory) {
      payload.conversationHistory = data.conversationHistory.map((m) => ({
        ...m,
        timestamp: Timestamp.fromDate(new Date(m.timestamp)),
      }));
    }
    await updateDoc(ref, payload);
  }

  async deleteEntry(entryId: string): Promise<void> {
    if (!this.currentUser) throw new Error('Not authenticated');
    const uid = this.currentUser.uid;
    await deleteDoc(doc(this.firestore, `users/${uid}/entries/${entryId}`));
  }

  async linkEntries(fromId: string, toId: string): Promise<void> {
    if (!this.currentUser) throw new Error('Not authenticated');
    const uid = this.currentUser.uid;
    const batch = writeBatch(this.firestore);
    batch.update(doc(this.firestore, `users/${uid}/entries/${fromId}`), {
      linkedEntryIds: arrayUnion(toId), updatedAt: serverTimestamp(),
    });
    batch.update(doc(this.firestore, `users/${uid}/entries/${toId}`), {
      linkedEntryIds: arrayUnion(fromId), updatedAt: serverTimestamp(),
    });
    await batch.commit();
  }

  async unlinkEntries(fromId: string, toId: string): Promise<void> {
    if (!this.currentUser) throw new Error('Not authenticated');
    const uid = this.currentUser.uid;
    const batch = writeBatch(this.firestore);
    batch.update(doc(this.firestore, `users/${uid}/entries/${fromId}`), {
      linkedEntryIds: arrayRemove(toId), updatedAt: serverTimestamp(),
    });
    batch.update(doc(this.firestore, `users/${uid}/entries/${toId}`), {
      linkedEntryIds: arrayRemove(fromId), updatedAt: serverTimestamp(),
    });
    await batch.commit();
  }

  async updateSettings(data: Partial<Settings>): Promise<void> {
    if (!this.currentUser) throw new Error('Not authenticated');
    const uid = this.currentUser.uid;
    const ref = doc(this.firestore, `users/${uid}/settings/api`);
    await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
  }

  async signOut(): Promise<void> {
    await firebaseSignOut(this.auth);
  }
}
```

**Step 4: Run tests**

```bash
npx vitest run src/repositories/__tests__/firebase-storage-backend.test.ts
```

Expected: PASS (3 tests).

**Step 5: Run full CI**

```bash
npm run test:ci
```

**Step 6: Commit**

```bash
git add src/repositories/firebase-storage-backend.ts src/repositories/__tests__/firebase-storage-backend.test.ts
git commit -m "✨ feat: implement FirebaseStorageBackend wrapping Firestore onSnapshot"
```

---

### Task 4: Implement LocalStorageBackend

**Files:**
- Create: `src/repositories/local-storage-backend.ts`
- Create: `src/repositories/__tests__/local-storage-backend.test.ts`

**Step 1: Write the failing test**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
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

  it('linkEntries adds ids to both entries', async () => {
    await backend.createEntry('e1', { content: 'a', date: '2026-01-01' });
    await backend.createEntry('e2', { content: 'b', date: '2026-01-02' });
    await backend.linkEntries('e1', 'e2');

    const e1List: import('../types').Entry[] = [];
    backend.subscribeToEntry('e1', (e) => { if (e) e1List.push(e); });

    expect(e1List[0].linkedEntryIds).toContain('e2');
  });

  it('updateSettings persists and restores settings', async () => {
    await backend.updateSettings({ selectedModel: 'test-model' });

    const settings: (import('../types').Settings | null)[] = [];
    backend.subscribeToSettings((s) => settings.push(s));

    expect(settings[0]?.selectedModel).toBe('test-model');
  });
});
```

**Step 2: Run test to confirm it fails**

```bash
npx vitest run src/repositories/__tests__/local-storage-backend.test.ts
```

Expected: FAIL — `LocalStorageBackend` not found.

**Step 3: Implement `LocalStorageBackend`**

```typescript
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

  subscribeToSettings(callback: (settings: Settings | null) => void): Unsubscribe {
    const notify = (): void => callback(readSettings());
    notify();
    window.addEventListener('mivoa:settings:changed', notify);
    return () => window.removeEventListener('mivoa:settings:changed', notify);
  }

  async createEntry(entryId: string, data: EntryCreateData): Promise<void> {
    const now = new Date().toISOString();
    const entries = readEntries();
    entries[entryId] = { ...data, id: entryId, createdAt: now, updatedAt: now };
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
```

**Step 4: Run tests**

```bash
npx vitest run src/repositories/__tests__/local-storage-backend.test.ts
```

Expected: PASS (6 tests).

**Step 5: Full CI**

```bash
npm run test:ci
```

**Step 6: Commit**

```bash
git add src/repositories/local-storage-backend.ts src/repositories/__tests__/local-storage-backend.test.ts
git commit -m "✨ feat: implement LocalStorageBackend for zero-Firebase local development"
```

---

### Task 5: Create StorageProvider React context

**Files:**
- Create: `src/repositories/storage-provider.tsx`
- Modify: `.env.example`

**Step 1: Write `storage-provider.tsx`**

```typescript
'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { StorageBackend } from './storage-backend';
import type { AppUser, Entry, Settings } from './types';

interface StorageContextValue {
  backend: StorageBackend | null;
  user: AppUser | null;
  isUserLoading: boolean;
}

const StorageContext = createContext<StorageContextValue>({
  backend: null,
  user: null,
  isUserLoading: true,
});

interface StorageProviderProps {
  backend: StorageBackend;
  children: ReactNode;
}

export function StorageProvider({ backend, children }: StorageProviderProps): React.JSX.Element {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = backend.subscribeToAuthState((authUser) => {
      setUser(authUser);
      setIsUserLoading(false);
    });
    return unsubscribe;
  }, [backend]);

  return (
    <StorageContext.Provider value={{ backend, user, isUserLoading }}>
      {children}
    </StorageContext.Provider>
  );
}

export function useStorage(): StorageContextValue {
  return useContext(StorageContext);
}

export function useEntriesByDate(dateKey: string): { data: Entry[] | null; isLoading: boolean } {
  const { backend, user } = useStorage();
  const [data, setData] = useState<Entry[] | null>(null);

  useEffect(() => {
    if (!backend || !user) return;
    return backend.subscribeToEntriesByDate(dateKey, setData);
  }, [backend, user, dateKey]);

  return { data, isLoading: data === null };
}

export function useEntry(entryId: string | null): { data: Entry | null; isLoading: boolean } {
  const { backend, user } = useStorage();
  const [data, setData] = useState<Entry | null | undefined>(undefined);

  useEffect(() => {
    if (!backend || !user || !entryId) { setData(null); return; }
    return backend.subscribeToEntry(entryId, setData);
  }, [backend, user, entryId]);

  return { data: data ?? null, isLoading: data === undefined };
}

export function useAllEntries(): { data: Entry[] | null; isLoading: boolean } {
  const { backend, user } = useStorage();
  const [data, setData] = useState<Entry[] | null>(null);

  useEffect(() => {
    if (!backend || !user) return;
    return backend.subscribeToAllEntries(setData);
  }, [backend, user]);

  return { data, isLoading: data === null };
}

export function useSettings(): { data: Settings | null; isLoading: boolean } {
  const { backend, user } = useStorage();
  const [data, setData] = useState<Settings | null | undefined>(undefined);

  useEffect(() => {
    if (!backend || !user) { setData(null); return; }
    return backend.subscribeToSettings(setData);
  }, [backend, user]);

  return { data: data ?? null, isLoading: data === undefined };
}
```

**Step 2: Add env var to `.env.example`**

Append:
```bash
# Storage backend: "firebase" (default) or "local" (no Firebase account required)
NEXT_PUBLIC_STORAGE_BACKEND=firebase
```

**Step 3: Typecheck**

```bash
npm run typecheck
```

**Step 4: Commit**

```bash
git add src/repositories/storage-provider.tsx .env.example
git commit -m "✨ feat: add StorageProvider context with backend-agnostic hooks"
```

---

### Task 6: Create a backend factory and wire into the app layout

**Files:**
- Create: `src/repositories/create-backend.ts`
- Modify: `src/app/layout.tsx` (or wherever providers are composed — check `src/app/` structure first)
- Modify: `src/firebase/client-provider.tsx`

**Step 1: Read the current app layout/providers to understand composition**

```bash
cat src/app/layout.tsx
cat src/firebase/client-provider.tsx
```

**Step 2: Write `create-backend.ts`**

```typescript
import type { StorageBackend } from './storage-backend';

export async function createBackend(): Promise<StorageBackend> {
  if (process.env.NEXT_PUBLIC_STORAGE_BACKEND === 'local') {
    const { LocalStorageBackend } = await import('./local-storage-backend');
    return new LocalStorageBackend();
  }

  const { initializeFirebase } = await import('@/firebase');
  const { FirebaseStorageBackend } = await import('./firebase-storage-backend');
  const { auth, firestore } = initializeFirebase();
  return new FirebaseStorageBackend(firestore, auth);
}
```

**Step 3: Update `client-provider.tsx`**

Wrap the existing provider tree with `StorageProvider`. The `createBackend` call happens client-side in a `useEffect` or lazy initialization.

> **Note:** Read the file first (`cat src/firebase/client-provider.tsx`) to understand the exact existing structure before modifying. Add `StorageProvider` wrapping `children` with the backend from `createBackend()`.

Pattern to follow:
```typescript
const [backend, setBackend] = useState<StorageBackend | null>(null);

useEffect(() => {
  createBackend().then(setBackend);
}, []);

if (!backend) return null; // or a loading spinner

return <StorageProvider backend={backend}>{children}</StorageProvider>;
```

**Step 4: Typecheck**

```bash
npm run typecheck
```

**Step 5: Commit**

```bash
git add src/repositories/create-backend.ts src/firebase/client-provider.tsx
git commit -m "🔧 build: wire StorageProvider into app via createBackend factory"
```

---

### Task 7: Refactor `ModelContext` and `OpenRouterApiKeyContext` to use StorageBackend

**Files:**
- Modify: `src/context/ModelContext.tsx`
- Modify: `src/context/OpenRouterApiKeyContext.tsx`

**Step 1: Read both files in full before editing**

```bash
cat src/context/ModelContext.tsx
cat src/context/OpenRouterApiKeyContext.tsx
```

**Step 2: Replace Firebase-specific hooks with `useStorage()` and `useSettings()`**

In `ModelContext.tsx`:
- Remove: `useFirestore`, `useDoc`, `setDocumentNonBlocking`, `updateDocumentNonBlocking`, Firebase imports
- Add: `useStorage`, `useSettings` from `@/repositories/storage-provider`
- Replace `settingsDocRef` / `useDoc` → `useSettings()`
- Replace `setDocumentNonBlocking` / `updateDocumentNonBlocking` → `backend.updateSettings({ selectedModel })`

In `OpenRouterApiKeyContext.tsx`:
- Same pattern — replace Firebase reads/writes with `useSettings()` + `backend.updateSettings()`

**Step 3: Typecheck**

```bash
npm run typecheck
```

**Step 4: Run tests**

```bash
npm run test:ci
```

**Step 5: Commit**

```bash
git add src/context/ModelContext.tsx src/context/OpenRouterApiKeyContext.tsx
git commit -m "♻️ refactor: use StorageBackend for settings instead of direct Firestore calls"
```

---

### Task 8: Refactor `use-journal-entries.tsx` and related hooks

**Files:**
- Modify: `src/hooks/use-journal-entries.tsx`
- Modify: `src/hooks/use-entry-operations.tsx`
- Modify: `src/hooks/use-entry-linking.tsx`
- Modify: `src/hooks/use-entry-dates.tsx`
- Modify: `src/app/handlers/journal-handlers.ts`

**Step 1: Read all files before editing**

```bash
cat src/hooks/use-entry-operations.tsx
cat src/hooks/use-entry-linking.tsx
cat src/hooks/use-entry-dates.tsx
```

**Step 2: Update `journal-handlers.ts`**

Replace all params that take `firestore: Firestore, user: { uid: string }` with a `backend: StorageBackend` param. Each handler becomes a thin wrapper over the corresponding `backend` method.

Example transformation:
```typescript
// Before
export function createEntryDocument(params: { entryId, content, title, dateKey, firestore, user }): Promise<void>

// After
export function createEntryDocument(params: { entryId, content, title, dateKey, backend: StorageBackend }): Promise<void>
```

**Step 3: Update `use-journal-entries.tsx`**

- Replace `useFirestore()` + `useUser()` with `useStorage()`
- Replace `useCollection<JournalEntryData>(entriesQuery)` with `useEntriesByDate(dateKey)`
- Replace `useDoc<JournalEntryData>(selectedEntryDocRef)` with `useEntry(selectedEntryId)`
- Pass `backend` instead of `firestore + user` to handler calls

**Step 4: Update `use-entry-operations.tsx`, `use-entry-linking.tsx`, `use-entry-dates.tsx`**

Same pattern — replace Firebase-specific deps with `useStorage()` and corresponding `backend.*` method calls.

**Step 5: Typecheck**

```bash
npm run typecheck
```

**Step 6: Run full CI**

```bash
npm run test:ci
```

**Step 7: Commit**

```bash
git add src/hooks/ src/app/handlers/journal-handlers.ts
git commit -m "♻️ refactor: replace direct Firestore calls with StorageBackend in journal hooks"
```

---

### Task 9: Remove unused Firebase-specific code

**Files:**
- Review: `src/firebase/firestore/use-collection.tsx`, `src/firebase/firestore/use-doc.tsx`
- Review: `src/firebase/non-blocking-updates.ts`

**Step 1: Check if any component still imports the old hooks**

```bash
grep -r "useCollection\|useDoc\|setDocumentNonBlocking\|updateDocumentNonBlocking\|deleteDocumentNonBlocking" src/ --include="*.ts" --include="*.tsx" | grep -v "src/repositories" | grep -v "src/firebase"
```

If the grep returns nothing, these files are now dead code and can be deleted.

**Step 2: Delete unused files if confirmed dead**

```bash
rm src/firebase/firestore/use-collection.tsx
rm src/firebase/firestore/use-doc.tsx
rm src/firebase/non-blocking-updates.ts
```

Update `src/firebase/index.ts` to remove their exports.

**Step 3: Typecheck**

```bash
npm run typecheck
```

**Step 4: Full CI**

```bash
npm run test:ci
```

**Step 5: Commit**

```bash
git add -A
git commit -m "🔥 refactor: remove unused Firebase hooks replaced by StorageBackend"
```

---

### Task 10: Manual smoke test — both backends

**Test A — Firebase backend (default)**

```bash
npm run dev
```

1. Open http://localhost:3000
2. Sign in, create a journal entry, verify it persists
3. Refresh — entry still there
4. Confirm `NEXT_PUBLIC_STORAGE_BACKEND` is not set (defaults to Firebase)

**Test B — Local backend**

```bash
NEXT_PUBLIC_STORAGE_BACKEND=local npm run dev
```

1. Open http://localhost:3000
2. No login screen — directly access the journal as "Local User"
3. Create an entry, verify it appears
4. Open DevTools → Application → LocalStorage → `mivoa:local:entries:v1`
5. Confirm entry is stored as JSON
6. Refresh — entry still there

**Both tests passing = implementation complete.**

---

### Summary

| What changed | Why |
|---|---|
| `src/repositories/types.ts` | Backend-agnostic domain types |
| `src/repositories/storage-backend.ts` | Interface contract |
| `src/repositories/firebase-storage-backend.ts` | Firebase implementation |
| `src/repositories/local-storage-backend.ts` | localStorage implementation |
| `src/repositories/storage-provider.tsx` | React context + hooks |
| `src/repositories/create-backend.ts` | Factory selecting backend via env |
| `src/firebase/client-provider.tsx` | Wires StorageProvider into app |
| `src/context/ModelContext.tsx` | Uses StorageBackend for settings |
| `src/context/OpenRouterApiKeyContext.tsx` | Uses StorageBackend for settings |
| `src/hooks/use-journal-entries.tsx` | Uses StorageBackend hooks |
| `src/hooks/use-entry-*.tsx` | Uses StorageBackend |
| `src/app/handlers/journal-handlers.ts` | Takes StorageBackend instead of Firestore |
| `src/firebase/` (old hooks) | Deleted after migration |
