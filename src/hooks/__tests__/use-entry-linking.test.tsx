import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useEntryLinking } from '../use-entry-linking';
import { useFirestore } from '@/firebase';
import { useUser } from '@/firebase/auth/use-user';
import { collection, doc, getDoc } from 'firebase/firestore';
import * as journalHandlers from '@/app/handlers/journal-handlers';
import * as entryLinkingUtils from '@/utils/entry-linking-utils';
import type { User } from 'firebase/auth';
import type { JournalEntryData } from '../use-journal-entries';

vi.mock('@/firebase');
vi.mock('@/firebase/auth/use-user');
vi.mock('@/app/handlers/journal-handlers');
vi.mock('@/utils/entry-linking-utils');

vi.mock('firebase/firestore', () => {
  return {
    collection: vi.fn(),
    doc: vi.fn(),
    getDoc: vi.fn(),
  };
});

const mockFirestore = { id: 'mock-firestore' } as any;
const mockUser = { uid: 'test-user-id' } as Partial<User> as User;

const createMockDocSnapshot = (id: string, data: JournalEntryData | null) => {
  return {
    id,
    exists: () => data !== null,
    data: () => data,
  } as any;
};

describe('useEntryLinking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useFirestore).mockReturnValue(mockFirestore);
    vi.mocked(useUser).mockReturnValue({ user: mockUser, isLoading: false, error: null });
    vi.mocked(collection).mockReturnValue({ id: 'mock-collection' } as any);
    vi.mocked(doc).mockReturnValue({ id: 'mock-doc' } as any);
    vi.mocked(journalHandlers.createEntryLink).mockResolvedValue(undefined);
    vi.mocked(journalHandlers.deleteEntryLink).mockResolvedValue(undefined);
    vi.mocked(entryLinkingUtils.validateLink).mockReturnValue({ valid: true });
  });

  describe('getLinkedEntries', () => {
    it('should return empty array when no firestore', async () => {
      vi.mocked(useFirestore).mockReturnValue(null as any);
      
      const { result } = renderHook(() => useEntryLinking());
      
      const entries = await result.current.getLinkedEntries('entry-1', ['entry-2']);
      
      expect(entries).toEqual([]);
    });

    it('should return empty array when no user', async () => {
      vi.mocked(useUser).mockReturnValue({ user: null, isLoading: false, error: null });
      
      const { result } = renderHook(() => useEntryLinking());
      
      const entries = await result.current.getLinkedEntries('entry-1', ['entry-2']);
      
      expect(entries).toEqual([]);
    });

    it('should return empty array when no linkedEntryIds', async () => {
      const { result } = renderHook(() => useEntryLinking());
      
      const entries = await result.current.getLinkedEntries('entry-1', undefined);
      
      expect(entries).toEqual([]);
    });

    it('should return empty array when linkedEntryIds is empty', async () => {
      const { result } = renderHook(() => useEntryLinking());
      
      const entries = await result.current.getLinkedEntries('entry-1', []);
      
      expect(entries).toEqual([]);
    });

    it('should fetch entries from Firestore for single chunk', async () => {
      const mockEntry1: JournalEntryData = {
        content: 'Content 1',
        date: '2024-01-15',
        createdAt: '2024-01-15',
        updatedAt: '2024-01-15',
      };
      const mockEntry2: JournalEntryData = {
        content: 'Content 2',
        date: '2024-01-16',
        createdAt: '2024-01-16',
        updatedAt: '2024-01-16',
      };

      vi.mocked(getDoc)
        .mockResolvedValueOnce(createMockDocSnapshot('entry-2', mockEntry1))
        .mockResolvedValueOnce(createMockDocSnapshot('entry-3', mockEntry2));

      const { result } = renderHook(() => useEntryLinking());
      
      const entries = await result.current.getLinkedEntries('entry-1', ['entry-2', 'entry-3']);
      
      expect(entries).toHaveLength(2);
      expect(entries[0].id).toBe('entry-2');
      expect(entries[1].id).toBe('entry-3');
      expect(collection).toHaveBeenCalledWith(mockFirestore, 'users/test-user-id/entries');
    });

    it('should fetch entries from Firestore for multiple chunks (>10)', async () => {
      const linkedIds = Array.from({ length: 15 }, (_, i) => `entry-${i + 2}`);
      const mockEntries = linkedIds.map((id) => ({
        id,
        content: `Content ${id}`,
        date: '2024-01-15',
        createdAt: '2024-01-15',
        updatedAt: '2024-01-15',
      }));

      linkedIds.forEach((id, index) => {
        vi.mocked(getDoc).mockResolvedValueOnce(
          createMockDocSnapshot(id, mockEntries[index] as JournalEntryData)
        );
      });

      const { result } = renderHook(() => useEntryLinking());
      
      const entries = await result.current.getLinkedEntries('entry-1', linkedIds);
      
      expect(entries).toHaveLength(15);
      expect(getDoc).toHaveBeenCalledTimes(15);
    });

    it('should use cache when available', async () => {
      const mockEntry: JournalEntryData = {
        content: 'Content',
        date: '2024-01-15',
        createdAt: '2024-01-15',
        updatedAt: '2024-01-15',
      };

      vi.mocked(getDoc).mockResolvedValueOnce(createMockDocSnapshot('entry-2', mockEntry));

      const { result } = renderHook(() => useEntryLinking());
      
      const entries1 = await result.current.getLinkedEntries('entry-1', ['entry-2']);
      const entries2 = await result.current.getLinkedEntries('entry-1', ['entry-2']);
      
      expect(entries1).toHaveLength(1);
      expect(entries2).toHaveLength(1);
      expect(getDoc).toHaveBeenCalledTimes(1);
    });

    it('should filter out non-existent entries', async () => {
      vi.mocked(getDoc)
        .mockResolvedValueOnce(createMockDocSnapshot('entry-2', null))
        .mockResolvedValueOnce(createMockDocSnapshot('entry-3', {
          content: 'Content',
          date: '2024-01-15',
          createdAt: '2024-01-15',
          updatedAt: '2024-01-15',
        }));

      const { result } = renderHook(() => useEntryLinking());
      
      const entries = await result.current.getLinkedEntries('entry-1', ['entry-2', 'entry-3']);
      
      expect(entries).toHaveLength(1);
      expect(entries[0].id).toBe('entry-3');
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(getDoc).mockRejectedValueOnce(new Error('Firestore error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useEntryLinking());
      
      const entries = await result.current.getLinkedEntries('entry-1', ['entry-2']);
      
      expect(entries).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch linked entries:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should return all requested entries', async () => {
      const mockEntry1: JournalEntryData = {
        content: 'Content 1',
        date: '2024-01-15',
        createdAt: '2024-01-15',
        updatedAt: '2024-01-15',
      };
      const mockEntry2: JournalEntryData = {
        content: 'Content 2',
        date: '2024-01-16',
        createdAt: '2024-01-16',
        updatedAt: '2024-01-16',
      };
      const mockEntry3: JournalEntryData = {
        content: 'Content 3',
        date: '2024-01-17',
        createdAt: '2024-01-17',
        updatedAt: '2024-01-17',
      };

      const entryMap = new Map<string, JournalEntryData>([
        ['entry-3', mockEntry3],
        ['entry-1', mockEntry1],
        ['entry-2', mockEntry2],
      ]);

      vi.mocked(doc).mockImplementation((collectionRef: any, ...pathSegments: string[]) => {
        const entryId = pathSegments[pathSegments.length - 1];
        return { id: entryId, path: pathSegments.join('/') } as any;
      });

      vi.mocked(getDoc).mockImplementation((docRef: any) => {
        const id = docRef?.id || 'unknown';
        const entryData = entryMap.get(id);
        return Promise.resolve(createMockDocSnapshot(id, entryData || null));
      });

      const { result } = renderHook(() => useEntryLinking());
      
      const entries = await result.current.getLinkedEntries('entry-0', ['entry-3', 'entry-1', 'entry-2']);
      
      expect(entries).toHaveLength(3);
      const entryIds = entries.map(e => e.id).sort();
      expect(entryIds).toEqual(['entry-1', 'entry-2', 'entry-3']);
    });
  });

  describe('linkEntry', () => {
    const mockFromEntry: JournalEntryData = {
      content: 'From entry',
      date: '2024-01-15',
      createdAt: '2024-01-15',
      updatedAt: '2024-01-15',
      linkedEntryIds: [],
    };
    const mockToEntry: JournalEntryData = {
      content: 'To entry',
      date: '2024-01-16',
      createdAt: '2024-01-16',
      updatedAt: '2024-01-16',
      linkedEntryIds: [],
    };

    it('should successfully link two entries', async () => {
      vi.mocked(getDoc)
        .mockResolvedValueOnce(createMockDocSnapshot('entry-1', mockFromEntry))
        .mockResolvedValueOnce(createMockDocSnapshot('entry-2', mockToEntry));

      const { result } = renderHook(() => useEntryLinking());
      
      await act(async () => {
        await result.current.linkEntry('entry-1', 'entry-2');
      });

      expect(journalHandlers.createEntryLink).toHaveBeenCalledWith({
        fromEntryId: 'entry-1',
        toEntryId: 'entry-2',
        firestore: mockFirestore,
        user: mockUser,
      });
      expect(result.current.error).toBeNull();
    });

    it('should set loading state during operation', async () => {
      vi.mocked(getDoc)
        .mockResolvedValueOnce(createMockDocSnapshot('entry-1', mockFromEntry))
        .mockResolvedValueOnce(createMockDocSnapshot('entry-2', mockToEntry));

      let resolveLink: () => void;
      const linkPromise = new Promise<void>((resolve) => {
        resolveLink = resolve;
      });
      vi.mocked(journalHandlers.createEntryLink).mockImplementation(() => linkPromise);

      const { result } = renderHook(() => useEntryLinking());
      
      act(() => {
        result.current.linkEntry('entry-1', 'entry-2');
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });
      
      act(() => {
        resolveLink!();
      });
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should prevent self-linking', async () => {
      const { result } = renderHook(() => useEntryLinking());
      
      await act(async () => {
        await result.current.linkEntry('entry-1', 'entry-1');
      });

      expect(result.current.error).toBe('cannotLinkToSelf');
      expect(journalHandlers.createEntryLink).not.toHaveBeenCalled();
    });

    it('should handle missing source entry', async () => {
      vi.mocked(getDoc).mockResolvedValueOnce(createMockDocSnapshot('entry-1', null));

      const { result } = renderHook(() => useEntryLinking());
      
      await act(async () => {
        await expect(result.current.linkEntry('entry-1', 'entry-2')).rejects.toThrow('Source entry not found');
      });

      expect(result.current.error).toBe('Source entry not found');
      expect(journalHandlers.createEntryLink).not.toHaveBeenCalled();
    });

    it('should handle missing target entry', async () => {
      vi.mocked(getDoc)
        .mockResolvedValueOnce(createMockDocSnapshot('entry-1', mockFromEntry))
        .mockResolvedValueOnce(createMockDocSnapshot('entry-2', null));

      const { result } = renderHook(() => useEntryLinking());
      
      await act(async () => {
        await expect(result.current.linkEntry('entry-1', 'entry-2')).rejects.toThrow('Target entry not found');
      });

      expect(result.current.error).toBe('Target entry not found');
      expect(journalHandlers.createEntryLink).not.toHaveBeenCalled();
    });

    it('should handle validation errors (already linked)', async () => {
      const fromEntryWithLink: JournalEntryData = {
        ...mockFromEntry,
        linkedEntryIds: ['entry-2'],
      };

      vi.mocked(getDoc)
        .mockResolvedValueOnce(createMockDocSnapshot('entry-1', fromEntryWithLink))
        .mockResolvedValueOnce(createMockDocSnapshot('entry-2', mockToEntry));

      vi.mocked(entryLinkingUtils.validateLink).mockReturnValue({
        valid: false,
        error: 'entryAlreadyLinked',
      });

      const { result } = renderHook(() => useEntryLinking());
      
      await act(async () => {
        await result.current.linkEntry('entry-1', 'entry-2');
      });

      expect(result.current.error).toBe('entryAlreadyLinked');
      expect(journalHandlers.createEntryLink).not.toHaveBeenCalled();
    });

    it('should handle Firestore errors with rollback', async () => {
      vi.mocked(getDoc)
        .mockResolvedValueOnce(createMockDocSnapshot('entry-1', mockFromEntry))
        .mockResolvedValueOnce(createMockDocSnapshot('entry-2', mockToEntry));

      vi.mocked(journalHandlers.createEntryLink).mockRejectedValueOnce(new Error('Firestore error'));

      const { result } = renderHook(() => useEntryLinking());
      
      await act(async () => {
        await expect(result.current.linkEntry('entry-1', 'entry-2')).rejects.toThrow('Firestore error');
      });

      expect(result.current.error).toBe('Firestore error');
    });

    it('should clear error state on success', async () => {
      vi.mocked(getDoc)
        .mockResolvedValueOnce(createMockDocSnapshot('entry-1', mockFromEntry))
        .mockResolvedValueOnce(createMockDocSnapshot('entry-2', mockToEntry));

      const { result } = renderHook(() => useEntryLinking());
      
      await act(async () => {
        await result.current.linkEntry('entry-1', 'entry-2');
      });

      expect(result.current.error).toBeNull();
    });

    it('should handle user not authenticated', async () => {
      vi.mocked(useUser).mockReturnValue({ user: null, isLoading: false, error: null });
      
      const { result } = renderHook(() => useEntryLinking());
      
      await act(async () => {
        await result.current.linkEntry('entry-1', 'entry-2');
      });

      expect(result.current.error).toBe('User not authenticated');
      expect(journalHandlers.createEntryLink).not.toHaveBeenCalled();
    });
  });

  describe('unlinkEntry', () => {
    const mockFromEntry: JournalEntryData = {
      content: 'From entry',
      date: '2024-01-15',
      createdAt: '2024-01-15',
      updatedAt: '2024-01-15',
      linkedEntryIds: ['entry-2'],
    };
    const mockToEntry: JournalEntryData = {
      content: 'To entry',
      date: '2024-01-16',
      createdAt: '2024-01-16',
      updatedAt: '2024-01-16',
      linkedEntryIds: ['entry-1'],
    };

    it('should successfully unlink two entries', async () => {
      vi.mocked(getDoc)
        .mockResolvedValueOnce(createMockDocSnapshot('entry-1', mockFromEntry))
        .mockResolvedValueOnce(createMockDocSnapshot('entry-2', mockToEntry));

      const { result } = renderHook(() => useEntryLinking());
      
      await act(async () => {
        await result.current.unlinkEntry('entry-1', 'entry-2');
      });

      expect(journalHandlers.deleteEntryLink).toHaveBeenCalledWith({
        fromEntryId: 'entry-1',
        toEntryId: 'entry-2',
        firestore: mockFirestore,
        user: mockUser,
      });
      expect(result.current.error).toBeNull();
    });

    it('should set loading state during operation', async () => {
      vi.mocked(getDoc)
        .mockResolvedValueOnce(createMockDocSnapshot('entry-1', mockFromEntry))
        .mockResolvedValueOnce(createMockDocSnapshot('entry-2', mockToEntry));

      let resolveUnlink: () => void;
      const unlinkPromise = new Promise<void>((resolve) => {
        resolveUnlink = resolve;
      });
      vi.mocked(journalHandlers.deleteEntryLink).mockImplementation(() => unlinkPromise);

      const { result } = renderHook(() => useEntryLinking());
      
      act(() => {
        result.current.unlinkEntry('entry-1', 'entry-2');
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });
      
      act(() => {
        resolveUnlink!();
      });
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should handle missing source entry', async () => {
      vi.mocked(getDoc).mockResolvedValueOnce(createMockDocSnapshot('entry-1', null));

      const { result } = renderHook(() => useEntryLinking());
      
      await act(async () => {
        await expect(result.current.unlinkEntry('entry-1', 'entry-2')).rejects.toThrow('Source entry not found');
      });

      expect(result.current.error).toBe('Source entry not found');
      expect(journalHandlers.deleteEntryLink).not.toHaveBeenCalled();
    });

    it('should handle missing target entry', async () => {
      vi.mocked(getDoc)
        .mockResolvedValueOnce(createMockDocSnapshot('entry-1', mockFromEntry))
        .mockResolvedValueOnce(createMockDocSnapshot('entry-2', null));

      const { result } = renderHook(() => useEntryLinking());
      
      await act(async () => {
        await expect(result.current.unlinkEntry('entry-1', 'entry-2')).rejects.toThrow('Target entry not found');
      });

      expect(result.current.error).toBe('Target entry not found');
      expect(journalHandlers.deleteEntryLink).not.toHaveBeenCalled();
    });

    it('should handle link does not exist error', async () => {
      const fromEntryWithoutLink: JournalEntryData = {
        ...mockFromEntry,
        linkedEntryIds: [],
      };

      vi.mocked(getDoc).mockResolvedValueOnce(createMockDocSnapshot('entry-1', fromEntryWithoutLink));

      const { result } = renderHook(() => useEntryLinking());
      
      await act(async () => {
        await result.current.unlinkEntry('entry-1', 'entry-2');
      });

      expect(result.current.error).toBe('Link does not exist');
      expect(journalHandlers.deleteEntryLink).not.toHaveBeenCalled();
    });

    it('should handle Firestore errors with rollback', async () => {
      vi.mocked(getDoc)
        .mockResolvedValueOnce(createMockDocSnapshot('entry-1', mockFromEntry))
        .mockResolvedValueOnce(createMockDocSnapshot('entry-2', mockToEntry));

      vi.mocked(journalHandlers.deleteEntryLink).mockRejectedValueOnce(new Error('Firestore error'));

      const { result } = renderHook(() => useEntryLinking());
      
      await act(async () => {
        await expect(result.current.unlinkEntry('entry-1', 'entry-2')).rejects.toThrow('Firestore error');
      });

      expect(result.current.error).toBe('Firestore error');
    });

    it('should clear error state on success', async () => {
      vi.mocked(getDoc)
        .mockResolvedValueOnce(createMockDocSnapshot('entry-1', mockFromEntry))
        .mockResolvedValueOnce(createMockDocSnapshot('entry-2', mockToEntry));

      const { result } = renderHook(() => useEntryLinking());
      
      await act(async () => {
        await result.current.unlinkEntry('entry-1', 'entry-2');
      });

      expect(result.current.error).toBeNull();
    });

    it('should handle user not authenticated', async () => {
      vi.mocked(useUser).mockReturnValue({ user: null, isLoading: false, error: null });
      
      const { result } = renderHook(() => useEntryLinking());
      
      await act(async () => {
        await result.current.unlinkEntry('entry-1', 'entry-2');
      });

      expect(result.current.error).toBe('User not authenticated');
      expect(journalHandlers.deleteEntryLink).not.toHaveBeenCalled();
    });
  });

  describe('state management', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useEntryLinking());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.linkEntry).toBe('function');
      expect(typeof result.current.unlinkEntry).toBe('function');
      expect(typeof result.current.getLinkedEntries).toBe('function');
    });
  });
});

