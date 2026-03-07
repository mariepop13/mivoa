import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('../local-storage-backend', () => ({
  LocalStorageBackend: vi.fn(),
}));

vi.mock('@/firebase', () => ({
  initializeFirebase: vi.fn().mockReturnValue({ auth: {}, firestore: {} }),
}));

vi.mock('../firebase-storage-backend', () => ({
  FirebaseStorageBackend: vi.fn(),
}));

import { createBackend } from '../create-backend';
import { LocalStorageBackend } from '../local-storage-backend';
import { FirebaseStorageBackend } from '../firebase-storage-backend';

describe('createBackend', () => {
  const originalBackendEnv = process.env.NEXT_PUBLIC_STORAGE_BACKEND;

  afterEach(() => {
    process.env.NEXT_PUBLIC_STORAGE_BACKEND = originalBackendEnv;
    vi.clearAllMocks();
  });

  it('instantiates LocalStorageBackend when NEXT_PUBLIC_STORAGE_BACKEND=local', async () => {
    process.env.NEXT_PUBLIC_STORAGE_BACKEND = 'local';
    await createBackend();
    expect(LocalStorageBackend).toHaveBeenCalledOnce();
    expect(FirebaseStorageBackend).not.toHaveBeenCalled();
  });

  it('instantiates FirebaseStorageBackend when NEXT_PUBLIC_STORAGE_BACKEND=firebase', async () => {
    process.env.NEXT_PUBLIC_STORAGE_BACKEND = 'firebase';
    await createBackend();
    expect(FirebaseStorageBackend).toHaveBeenCalledOnce();
    expect(LocalStorageBackend).not.toHaveBeenCalled();
  });

  it('defaults to FirebaseStorageBackend when NEXT_PUBLIC_STORAGE_BACKEND is unset', async () => {
    delete process.env.NEXT_PUBLIC_STORAGE_BACKEND;
    await createBackend();
    expect(FirebaseStorageBackend).toHaveBeenCalledOnce();
    expect(LocalStorageBackend).not.toHaveBeenCalled();
  });
});
