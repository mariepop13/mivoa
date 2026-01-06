import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { incrementEntryUsage, trackModelUsage, checkAndResetIfNeeded } from '../usage-tracker';
import { getDoc } from 'firebase/firestore';

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual<typeof import('firebase/firestore')>('firebase/firestore');
  return {
    ...actual,
    doc: vi.fn((firestore, path) => ({ path, firestore })),
    getDoc: vi.fn(),
    serverTimestamp: vi.fn(() => ({ _methodName: 'serverTimestamp' })),
    increment: vi.fn((value) => ({ _methodName: 'increment', _value: value })),
  };
});

vi.mock('@/firebase', async () => {
  const actual = await vi.importActual('@/firebase');
  return {
    ...actual,
    initializeFirebase: vi.fn(() => ({
      firestore: {
        collection: vi.fn(),
        doc: vi.fn(),
      },
    })),
    updateDocumentNonBlocking: vi.fn(),
    setDocumentNonBlocking: vi.fn(),
  };
});

describe('usage-tracker', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { updateDocumentNonBlocking } = await import('@/firebase');
    vi.mocked(updateDocumentNonBlocking).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('incrementEntryUsage', () => {
    it('should increment entry usage when document exists', async () => {
      const { updateDocumentNonBlocking } = await import('@/firebase');
      const mockGetDoc = getDoc as ReturnType<typeof vi.fn>;
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ entriesUsed: 5 }),
      });

      await incrementEntryUsage('user123');

      expect(updateDocumentNonBlocking).toHaveBeenCalled();
    });

    it('should create document when it does not exist', async () => {
      const { setDocumentNonBlocking } = await import('@/firebase');
      const mockGetDoc = getDoc as ReturnType<typeof vi.fn>;
      const mockUpdateDoc = (await import('@/firebase')).updateDocumentNonBlocking as ReturnType<typeof vi.fn>;
      
      mockGetDoc.mockResolvedValue({
        exists: () => false,
      });
      mockUpdateDoc.mockRejectedValue(new Error('Document not found'));

      await incrementEntryUsage('user123');

      expect(setDocumentNonBlocking).toHaveBeenCalled();
    });
  });

  describe('trackModelUsage', () => {
    it('should track model usage when document exists', async () => {
      const { updateDocumentNonBlocking } = await import('@/firebase');
      const mockGetDoc = getDoc as ReturnType<typeof vi.fn>;
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ modelUsage: { 'gpt-4o': 3 } }),
      });

      await trackModelUsage('user123', 'gpt-4o');

      expect(updateDocumentNonBlocking).toHaveBeenCalled();
    });

    it('should create document when it does not exist', async () => {
      const { setDocumentNonBlocking } = await import('@/firebase');
      const mockGetDoc = getDoc as ReturnType<typeof vi.fn>;
      const mockUpdateDoc = (await import('@/firebase')).updateDocumentNonBlocking as ReturnType<typeof vi.fn>;
      
      mockGetDoc.mockResolvedValue({
        exists: () => false,
      });
      mockUpdateDoc.mockRejectedValue(new Error('Document not found'));

      await trackModelUsage('user123', 'gpt-4o');

      expect(setDocumentNonBlocking).toHaveBeenCalled();
    });
  });

  describe('checkAndResetIfNeeded', () => {
    it('should reset when new month is reached', async () => {
      const { setDocumentNonBlocking } = await import('@/firebase');
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      const result = await checkAndResetIfNeeded('user123', lastMonth);

      expect(result).toBe(true);
      expect(setDocumentNonBlocking).toHaveBeenCalled();
    });

    it('should not reset when still in same month', async () => {
      const { setDocumentNonBlocking } = await import('@/firebase');
      const today = new Date();

      const result = await checkAndResetIfNeeded('user123', today);

      expect(result).toBe(false);
      expect(setDocumentNonBlocking).not.toHaveBeenCalled();
    });

    it('should reset when lastResetDate is null', async () => {
      const { setDocumentNonBlocking } = await import('@/firebase');

      const result = await checkAndResetIfNeeded('user123', null);

      expect(result).toBe(true);
      expect(setDocumentNonBlocking).toHaveBeenCalled();
    });
  });
});

