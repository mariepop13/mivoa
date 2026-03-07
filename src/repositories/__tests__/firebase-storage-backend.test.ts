import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  onSnapshot: vi.fn(() => vi.fn()),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  writeBatch: vi.fn(() => ({
    update: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined),
  })),
  onAuthStateChanged: vi.fn((_, cb: (user: null) => void) => { cb(null); return vi.fn(); }),
  signOut: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn((_, path: string) => ({ path })),
  query: vi.fn((ref: unknown) => ref),
  where: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: mocks.onSnapshot,
  setDoc: mocks.setDoc,
  updateDoc: mocks.updateDoc,
  deleteDoc: mocks.deleteDoc,
  writeBatch: mocks.writeBatch,
  serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
  Timestamp: { fromDate: (d: Date) => ({ toDate: () => d, toMillis: () => d.getTime() }) },
  arrayUnion: vi.fn((v: unknown) => v),
  arrayRemove: vi.fn((v: unknown) => v),
}));

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: mocks.onAuthStateChanged,
  signOut: mocks.signOut,
}));

import { FirebaseStorageBackend } from '../firebase-storage-backend';

describe('FirebaseStorageBackend', () => {
  const mockFirestore = {} as import('firebase/firestore').Firestore;
  const mockAuth = {} as import('firebase/auth').Auth;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.onAuthStateChanged.mockImplementation((_, cb: (user: null) => void) => { cb(null); return vi.fn(); });
  });

  it('subscribeToAuthState calls callback with null when no user', () => {
    const backend = new FirebaseStorageBackend(mockFirestore, mockAuth);
    const callback = vi.fn();
    const unsubscribe = backend.subscribeToAuthState(callback);
    expect(callback).toHaveBeenCalledWith(null);
    unsubscribe();
  });

  it('subscribeToEntriesByDate calls onSnapshot', () => {
    mocks.onSnapshot.mockReturnValue(vi.fn());
    const backend = new FirebaseStorageBackend(mockFirestore, mockAuth, { uid: 'u1' } as import('firebase/auth').User);
    backend.subscribeToEntriesByDate('2026-01-01', vi.fn());
    expect(mocks.onSnapshot).toHaveBeenCalled();
  });

  it('createEntry calls setDoc', async () => {
    mocks.setDoc.mockResolvedValue(undefined);
    const backend = new FirebaseStorageBackend(mockFirestore, mockAuth, { uid: 'u1' } as import('firebase/auth').User);
    await backend.createEntry('e1', {
      content: 'hello',
      date: '2026-01-01',
    });
    expect(mocks.setDoc).toHaveBeenCalled();
  });
});
