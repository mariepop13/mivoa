import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { incrementEntryUsage, trackModelUsage, checkAndResetIfNeeded } from '../usage-tracker';
import { getDoc, runTransaction } from 'firebase/firestore';

const mockTransaction = {
  get: vi.fn(),
  set: vi.fn(),
  update: vi.fn(),
};

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual<typeof import('firebase/firestore')>('firebase/firestore');
  return {
    ...actual,
    doc: vi.fn((firestore, path) => ({ path, firestore })),
    getDoc: vi.fn(),
    serverTimestamp: vi.fn(() => ({ _methodName: 'serverTimestamp' })),
    increment: vi.fn((value) => ({ _methodName: 'increment', _value: value })),
    runTransaction: vi.fn(async (firestore, callback) => {
      return callback(mockTransaction);
    }),
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
    mockTransaction.get.mockResolvedValue({
      exists: () => false,
      data: () => null,
    });
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
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      
      mockTransaction.get.mockResolvedValue({
        exists: () => true,
        data: () => ({ lastResetDate: lastMonth }),
      });

      const result = await checkAndResetIfNeeded('user123', lastMonth);

      expect(result).toBe(true);
      expect(runTransaction).toHaveBeenCalled();
      expect(mockTransaction.update).toHaveBeenCalled();
    });

    it('should not reset when still in same month', async () => {
      const today = new Date();

      const result = await checkAndResetIfNeeded('user123', today);

      expect(result).toBe(false);
      expect(runTransaction).not.toHaveBeenCalled();
    });

    it('should reset when lastResetDate is null', async () => {
      mockTransaction.get.mockResolvedValue({
        exists: () => false,
        data: () => null,
      });

      const result = await checkAndResetIfNeeded('user123', null);

      expect(result).toBe(true);
      expect(runTransaction).toHaveBeenCalled();
      expect(mockTransaction.set).toHaveBeenCalled();
    });

    it('should reset when crossing year boundary', async () => {
      const lastYear = new Date();
      lastYear.setFullYear(lastYear.getFullYear() - 1);
      lastYear.setMonth(11);
      
      mockTransaction.get.mockResolvedValue({
        exists: () => true,
        data: () => ({ lastResetDate: lastYear }),
      });

      const result = await checkAndResetIfNeeded('user123', lastYear);

      expect(result).toBe(true);
      expect(runTransaction).toHaveBeenCalled();
      expect(mockTransaction.update).toHaveBeenCalled();
    });

    it('should reset at beginning of new month', async () => {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      lastMonth.setDate(31);
      lastMonth.setHours(23, 59, 59, 999);
      
      mockTransaction.get.mockResolvedValue({
        exists: () => true,
        data: () => ({ lastResetDate: lastMonth }),
      });

      const result = await checkAndResetIfNeeded('user123', lastMonth);

      expect(result).toBe(true);
      expect(runTransaction).toHaveBeenCalled();
      expect(mockTransaction.update).toHaveBeenCalled();
    });

    it('should not reset on same day different time', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const result = await checkAndResetIfNeeded('user123', today);

      expect(result).toBe(false);
      expect(runTransaction).not.toHaveBeenCalled();
    });

    it('should handle transaction when document exists but no reset needed', async () => {
      const today = new Date();
      const sameMonth = new Date(today);
      sameMonth.setDate(15);
      
      mockTransaction.get.mockResolvedValue({
        exists: () => true,
        data: () => ({ lastResetDate: sameMonth }),
      });

      const result = await checkAndResetIfNeeded('user123', sameMonth);

      expect(result).toBe(false);
      expect(runTransaction).not.toHaveBeenCalled();
    });
  });

  describe('incrementEntryUsage edge cases', () => {
    it('should handle Firestore network errors gracefully', async () => {
      const { updateDocumentNonBlocking, setDocumentNonBlocking } = await import('@/firebase');
      const mockGetDoc = getDoc as ReturnType<typeof vi.fn>;
      
      vi.mocked(updateDocumentNonBlocking).mockRejectedValue(new Error('Network error'));
      mockGetDoc.mockResolvedValue({
        exists: () => false,
      });

      await incrementEntryUsage('user123');

      expect(setDocumentNonBlocking).toHaveBeenCalled();
    });

    it('should handle Firestore permission errors', async () => {
      const { updateDocumentNonBlocking, setDocumentNonBlocking } = await import('@/firebase');
      const mockGetDoc = getDoc as ReturnType<typeof vi.fn>;
      
      vi.mocked(updateDocumentNonBlocking).mockRejectedValue(new Error('Permission denied'));
      mockGetDoc.mockResolvedValue({
        exists: () => false,
      });

      await incrementEntryUsage('user123');

      expect(setDocumentNonBlocking).toHaveBeenCalled();
    });

    it('should handle document with zero entries', async () => {
      const { updateDocumentNonBlocking } = await import('@/firebase');
      const mockGetDoc = getDoc as ReturnType<typeof vi.fn>;
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ entriesUsed: 0 }),
      });

      await incrementEntryUsage('user123');

      expect(updateDocumentNonBlocking).toHaveBeenCalled();
    });

    it('should handle document with high entry count', async () => {
      const { updateDocumentNonBlocking } = await import('@/firebase');
      const mockGetDoc = getDoc as ReturnType<typeof vi.fn>;
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ entriesUsed: 999999 }),
      });

      await incrementEntryUsage('user123');

      expect(updateDocumentNonBlocking).toHaveBeenCalled();
    });
  });

  describe('trackModelUsage edge cases', () => {
    it('should handle Firestore network errors gracefully', async () => {
      const { updateDocumentNonBlocking, setDocumentNonBlocking } = await import('@/firebase');
      const mockGetDoc = getDoc as ReturnType<typeof vi.fn>;
      
      vi.mocked(updateDocumentNonBlocking).mockRejectedValue(new Error('Network error'));
      mockGetDoc.mockResolvedValue({
        exists: () => false,
      });

      await trackModelUsage('user123', 'gpt-4o');

      expect(setDocumentNonBlocking).toHaveBeenCalled();
    });

    it('should handle empty modelUsage object', async () => {
      const { updateDocumentNonBlocking } = await import('@/firebase');
      const mockGetDoc = getDoc as ReturnType<typeof vi.fn>;
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ modelUsage: {} }),
      });

      await trackModelUsage('user123', 'gpt-4o');

      expect(updateDocumentNonBlocking).toHaveBeenCalled();
    });

    it('should handle multiple models in usage', async () => {
      const { updateDocumentNonBlocking } = await import('@/firebase');
      const mockGetDoc = getDoc as ReturnType<typeof vi.fn>;
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          modelUsage: {
            'gpt-4o': 10,
            'claude-3-opus': 5,
            'gpt-3.5-turbo': 20,
          },
        }),
      });

      await trackModelUsage('user123', 'gpt-4o');

      expect(updateDocumentNonBlocking).toHaveBeenCalled();
    });

    it('should handle new model not in existing usage', async () => {
      const { updateDocumentNonBlocking } = await import('@/firebase');
      const mockGetDoc = getDoc as ReturnType<typeof vi.fn>;
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          modelUsage: {
            'gpt-4o': 10,
          },
        }),
      });

      await trackModelUsage('user123', 'claude-3-opus');

      expect(updateDocumentNonBlocking).toHaveBeenCalled();
    });
  });

  describe('concurrency', () => {
    it('should handle concurrent incrementEntryUsage calls', async () => {
      const { updateDocumentNonBlocking } = await import('@/firebase');
      const mockGetDoc = getDoc as ReturnType<typeof vi.fn>;
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ entriesUsed: 5 }),
      });

      const promises = [
        incrementEntryUsage('user123'),
        incrementEntryUsage('user123'),
        incrementEntryUsage('user123'),
      ];

      await Promise.all(promises);

      expect(updateDocumentNonBlocking).toHaveBeenCalledTimes(3);
    });

    it('should handle concurrent trackModelUsage calls', async () => {
      const { updateDocumentNonBlocking } = await import('@/firebase');
      const mockGetDoc = getDoc as ReturnType<typeof vi.fn>;
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ modelUsage: { 'gpt-4o': 3 } }),
      });

      const promises = [
        trackModelUsage('user123', 'gpt-4o'),
        trackModelUsage('user123', 'claude-3-opus'),
        trackModelUsage('user123', 'gpt-4o'),
      ];

      await Promise.all(promises);

      expect(updateDocumentNonBlocking).toHaveBeenCalledTimes(3);
    });

    it('should handle concurrent checkAndResetIfNeeded calls', async () => {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      
      mockTransaction.get.mockResolvedValue({
        exists: () => true,
        data: () => ({ lastResetDate: lastMonth }),
      });

      const promises = [
        checkAndResetIfNeeded('user123', lastMonth),
        checkAndResetIfNeeded('user123', lastMonth),
        checkAndResetIfNeeded('user123', lastMonth),
      ];

      const results = await Promise.all(promises);

      expect(results.every(r => r === true)).toBe(true);
      expect(runTransaction).toHaveBeenCalled();
    });
  });
});

