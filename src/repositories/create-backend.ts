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
