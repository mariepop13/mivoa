import {
  collection, doc, query, where, onSnapshot,
  setDoc, updateDoc, deleteDoc, writeBatch, getDoc,
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

  async getEntries(ids: string[]): Promise<Entry[]> {
    if (!this.currentUser) return [];
    const uid = this.currentUser.uid;
    const results = await Promise.all(
      ids.map((id) => getDoc(doc(this.firestore, `users/${uid}/entries/${id}`)))
    );
    return results
      .filter((snap) => snap.exists())
      .map((snap) => firestoreDocToEntry(snap.id, snap.data() as Record<string, unknown>));
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
