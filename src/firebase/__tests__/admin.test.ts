import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getAdminAuth, getAdminFirestore } from '../admin';
import type { App } from 'firebase-admin/app';
import type { Auth } from 'firebase-admin/auth';

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
  const mockServiceAccountKey = JSON.stringify({
    project_id: 'test-project',
    private_key: 'test-private-key',
    client_email: 'test@example.com',
  });

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY = mockServiceAccountKey;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getAdminAuth', () => {
    it('should throw error when service account key is missing', async () => {
      delete process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      mockGetApps.mockReturnValue([]);
      const { getAdminAuth: getAdminAuthAfterReset } = await import('../admin');

      expect(() => getAdminAuthAfterReset()).toThrow('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is required');
    });

    it('should return auth instance when service account key is set', async () => {
      const mockAuth = { verifyIdToken: vi.fn() } as unknown as Auth;
      const { getAuth } = await import('firebase-admin/auth');
      vi.mocked(getAuth).mockReturnValue(mockAuth);

      const auth = getAdminAuth();

      expect(auth).toBe(mockAuth);
      expect(getAuth).toHaveBeenCalled();
    });

    it('should return same auth instance on subsequent calls', async () => {
      const mockAuth = { verifyIdToken: vi.fn() } as unknown as Auth;
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
      const mockExistingApp = { name: 'existing-app' } as unknown as App;
      mockGetApps.mockReturnValue([mockExistingApp]);
      const { getAuth } = await import('firebase-admin/auth');
      const mockAuth = { verifyIdToken: vi.fn() } as unknown as Auth;
      vi.mocked(getAuth).mockReturnValue(mockAuth);

      const auth1 = getAdminAuth();
      const auth2 = getAdminAuth();

      expect(mockInitializeApp).not.toHaveBeenCalled();
      expect(auth1).toBe(auth2);
    });

    it('should initialize app with service account credentials', async () => {
      vi.resetModules();
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY = mockServiceAccountKey;
      mockGetApps.mockReturnValue([]);
      const mockCredential = { projectId: 'test-project' };
      mockCert.mockReturnValue(mockCredential);
      const mockApp = { name: 'test-app' } as unknown as App;
      mockInitializeApp.mockReturnValue(mockApp);
      const { getAuth } = await import('firebase-admin/auth');
      const mockAuth = { verifyIdToken: vi.fn() } as unknown as Auth;
      vi.mocked(getAuth).mockReturnValue(mockAuth);
      const { getAdminAuth: getAdminAuthAfterReset } = await import('../admin');

      getAdminAuthAfterReset();

      expect(mockCert).toHaveBeenCalledWith(JSON.parse(mockServiceAccountKey));
      expect(mockInitializeApp).toHaveBeenCalledWith({
        credential: mockCredential,
      });
    });
  });
});

