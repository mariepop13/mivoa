import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getAdminAuth, getAdminFirestore } from '../admin';

const mockInitializeApp = vi.fn();
const mockGetApps = vi.fn().mockReturnValue([]);
const mockCert = vi.fn();

vi.mock('firebase-admin/app', () => ({
  initializeApp: (...args: unknown[]) => mockInitializeApp(...args),
  getApps: () => mockGetApps(),
  cert: (...args: unknown[]) => mockCert(...args),
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

  describe('getAdminAuth edge cases', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      mockGetApps.mockReturnValue([]);
    });

    it('should use existing app when apps already exist', async () => {
      const mockExistingApp = { name: 'existing-app' } as any;
      mockGetApps.mockReturnValue([mockExistingApp]);
      const { getAuth } = await import('firebase-admin/auth');
      const mockAuth = { verifySessionCookie: vi.fn() } as any;
      vi.mocked(getAuth).mockReturnValue(mockAuth);

      const auth1 = getAdminAuth();
      const auth2 = getAdminAuth();

      expect(mockInitializeApp).not.toHaveBeenCalled();
      expect(auth1).toBe(auth2);
    });

    it('should use NEXT_PUBLIC_FIREBASE_PROJECT_ID when FIREBASE_PROJECT_ID is missing', async () => {
      delete process.env.FIREBASE_PROJECT_ID;
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'public-project-id';
      mockGetApps.mockReturnValue([]);
      const { getAuth } = await import('firebase-admin/auth');
      const mockAuth = { verifySessionCookie: vi.fn() } as any;
      vi.mocked(getAuth).mockReturnValue(mockAuth);

      expect(() => getAdminAuth()).not.toThrow();
    });
  });
});

