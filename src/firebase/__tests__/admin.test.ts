import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getAdminAuth, getAdminFirestore } from '../admin';

vi.mock('firebase-admin/app', () => ({
  initializeApp: vi.fn(),
  getApps: vi.fn().mockReturnValue([]),
}));

vi.mock('firebase-admin/auth', () => ({
  getAuth: vi.fn(),
}));

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn(),
}));

describe('firebase admin', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    process.env.FIREBASE_PROJECT_ID = 'test-project';
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getAdminAuth', () => {
    it('should throw error when project ID is missing', () => {
      delete process.env.FIREBASE_PROJECT_ID;
      delete process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

      expect(() => getAdminAuth()).toThrow('Missing required Firebase Admin environment variable');
    });

    it('should return auth instance when project ID is set', async () => {
      const mockAuth = { verifySessionCookie: vi.fn() } as any;
      const { getAuth } = await import('firebase-admin/auth');
      vi.mocked(getAuth).mockReturnValue(mockAuth);

      const auth = getAdminAuth();

      expect(auth).toBe(mockAuth);
      expect(getAuth).toHaveBeenCalled();
    });

    it('should return same auth instance on subsequent calls', async () => {
      const mockAuth = { verifySessionCookie: vi.fn() } as any;
      const { getAuth } = await import('firebase-admin/auth');
      vi.mocked(getAuth).mockReturnValue(mockAuth);

      const auth1 = getAdminAuth();
      const auth2 = getAdminAuth();

      expect(auth1).toBe(auth2);
      expect(getAuth).toHaveBeenCalledTimes(1);
    });
  });

  describe('getAdminFirestore', () => {
    it('should return firestore instance', async () => {
      const mockFirestore = { collection: vi.fn() } as any;
      const { getFirestore } = await import('firebase-admin/firestore');
      vi.mocked(getFirestore).mockReturnValue(mockFirestore);

      const firestore = getAdminFirestore();

      expect(firestore).toBe(mockFirestore);
      expect(getFirestore).toHaveBeenCalled();
    });

    it('should return same firestore instance on subsequent calls', async () => {
      const mockFirestore = { collection: vi.fn() } as any;
      const { getFirestore } = await import('firebase-admin/firestore');
      vi.mocked(getFirestore).mockReturnValue(mockFirestore);

      const firestore1 = getAdminFirestore();
      const firestore2 = getAdminFirestore();

      expect(firestore1).toBe(firestore2);
      expect(getFirestore).toHaveBeenCalledTimes(1);
    });
  });
});

