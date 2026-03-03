import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useEntryLinking } from '../use-entry-linking';
import { useStorage } from '@/repositories/storage-provider';
import * as journalHandlers from '@/app/handlers/journal-handlers';
import * as entryLinkingUtils from '@/utils/entry-linking-utils';
import type { StorageBackend } from '@/repositories/storage-backend';
import type { JournalEntryData } from '../use-journal-entries';

vi.mock('@/repositories/storage-provider', () => ({
  useStorage: vi.fn(),
  useEntriesByDate: vi.fn(),
  useEntry: vi.fn(),
  useAllEntries: vi.fn(),
}));
vi.mock('@/app/handlers/journal-handlers');
vi.mock('@/utils/entry-linking-utils');

let mockBackend: StorageBackend;

describe('useEntryLinking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBackend = {
      subscribeToAuthState: vi.fn(),
      subscribeToEntriesByDate: vi.fn(),
      subscribeToEntry: vi.fn(),
      subscribeToAllEntries: vi.fn(),
      subscribeToSettings: vi.fn(),
      getEntries: vi.fn().mockResolvedValue([]),
      createEntry: vi.fn(),
      updateEntry: vi.fn(),
      deleteEntry: vi.fn(),
      linkEntries: vi.fn(),
      unlinkEntries: vi.fn(),
      updateSettings: vi.fn(),
      signOut: vi.fn(),
    };
    vi.mocked(useStorage).mockReturnValue({
      backend: mockBackend,
      user: { uid: 'test-user-id', displayName: null, email: null, photoURL: null },
      isUserLoading: false,
    });
    vi.mocked(journalHandlers.createEntryLink).mockResolvedValue(undefined);
    vi.mocked(journalHandlers.deleteEntryLink).mockResolvedValue(undefined);
    vi.mocked(entryLinkingUtils.validateLink).mockReturnValue({ valid: true });
  });

  describe('getLinkedEntries', () => {
    it('should return empty array when no backend', async () => {
      vi.mocked(useStorage).mockReturnValue({
        backend: null,
        user: null,
        isUserLoading: false,
      });

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

    it('should fetch entries via backend.getEntries for single chunk', async () => {
      const mockEntry1 = {
        id: 'entry-2',
        content: 'Content 1',
        date: '2024-01-15',
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z',
      };
      const mockEntry2 = {
        id: 'entry-3',
        content: 'Content 2',
        date: '2024-01-16',
        createdAt: '2024-01-16T00:00:00Z',
        updatedAt: '2024-01-16T00:00:00Z',
      };

      vi.mocked(mockBackend.getEntries).mockResolvedValue([mockEntry1, mockEntry2] as any);

      const { result } = renderHook(() => useEntryLinking());

      const entries = await result.current.getLinkedEntries('entry-1', ['entry-2', 'entry-3']);

      expect(entries).toHaveLength(2);
      expect(entries[0].id).toBe('entry-2');
      expect(entries[1].id).toBe('entry-3');
      expect(mockBackend.getEntries).toHaveBeenCalledWith(['entry-2', 'entry-3']);
    });

    it('should fetch entries for multiple chunks (>10)', async () => {
      const linkedIds = Array.from({ length: 15 }, (_, i) => `entry-${i + 2}`);
      const mockEntries = linkedIds.map((id) => ({
        id,
        content: `Content ${id}`,
        date: '2024-01-15',
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z',
      }));

      vi.mocked(mockBackend.getEntries)
        .mockResolvedValueOnce(mockEntries.slice(0, 10) as any)
        .mockResolvedValueOnce(mockEntries.slice(10) as any);

      const { result } = renderHook(() => useEntryLinking());

      const entries = await result.current.getLinkedEntries('entry-1', linkedIds);

      expect(entries).toHaveLength(15);
      expect(mockBackend.getEntries).toHaveBeenCalledTimes(2);
    });

    it('should use cache when available', async () => {
      const mockEntry = {
        id: 'entry-2',
        content: 'Content',
        date: '2024-01-15',
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z',
      };

      vi.mocked(mockBackend.getEntries).mockResolvedValue([mockEntry] as any);

      const { result } = renderHook(() => useEntryLinking());

      const entries1 = await result.current.getLinkedEntries('entry-1', ['entry-2']);
      const entries2 = await result.current.getLinkedEntries('entry-1', ['entry-2']);

      expect(entries1).toHaveLength(1);
      expect(entries2).toHaveLength(1);
      expect(mockBackend.getEntries).toHaveBeenCalledTimes(1);
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(mockBackend.getEntries).mockRejectedValueOnce(new Error('Backend error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useEntryLinking());

      const entries = await result.current.getLinkedEntries('entry-1', ['entry-2']);

      expect(entries).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch linked entries:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should return all requested entries in order', async () => {
      const mockEntry1 = { id: 'entry-3', content: 'Content 3', date: '2024-01-17', createdAt: '2024-01-17T00:00:00Z', updatedAt: '2024-01-17T00:00:00Z' };
      const mockEntry2 = { id: 'entry-1', content: 'Content 1', date: '2024-01-15', createdAt: '2024-01-15T00:00:00Z', updatedAt: '2024-01-15T00:00:00Z' };
      const mockEntry3 = { id: 'entry-2', content: 'Content 2', date: '2024-01-16', createdAt: '2024-01-16T00:00:00Z', updatedAt: '2024-01-16T00:00:00Z' };

      vi.mocked(mockBackend.getEntries).mockResolvedValue([mockEntry1, mockEntry2, mockEntry3] as any);

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
      createdAt: '2024-01-15T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
      linkedEntryIds: [],
    };
    const mockToEntry: JournalEntryData = {
      content: 'To entry',
      date: '2024-01-16',
      createdAt: '2024-01-16T00:00:00Z',
      updatedAt: '2024-01-16T00:00:00Z',
      linkedEntryIds: [],
    };

    it('should successfully link two entries', async () => {
      vi.mocked(mockBackend.getEntries)
        .mockResolvedValueOnce([{ ...mockFromEntry, id: 'entry-1' }] as any)
        .mockResolvedValueOnce([{ ...mockToEntry, id: 'entry-2' }] as any);

      const { result } = renderHook(() => useEntryLinking());

      await act(async () => {
        await result.current.linkEntry('entry-1', 'entry-2');
      });

      expect(journalHandlers.createEntryLink).toHaveBeenCalledWith({
        fromEntryId: 'entry-1',
        toEntryId: 'entry-2',
        backend: mockBackend,
      });
      expect(result.current.error).toBeNull();
    });

    it('should set loading state during operation', async () => {
      vi.mocked(mockBackend.getEntries)
        .mockResolvedValueOnce([{ ...mockFromEntry, id: 'entry-1' }] as any)
        .mockResolvedValueOnce([{ ...mockToEntry, id: 'entry-2' }] as any);

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
      vi.mocked(mockBackend.getEntries).mockResolvedValueOnce([]);

      const { result } = renderHook(() => useEntryLinking());

      await act(async () => {
        await expect(result.current.linkEntry('entry-1', 'entry-2')).rejects.toThrow('Source entry not found');
      });

      expect(result.current.error).toBe('Source entry not found');
      expect(journalHandlers.createEntryLink).not.toHaveBeenCalled();
    });

    it('should handle missing target entry', async () => {
      vi.mocked(mockBackend.getEntries)
        .mockResolvedValueOnce([{ ...mockFromEntry, id: 'entry-1' }] as any)
        .mockResolvedValueOnce([]);

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

      vi.mocked(mockBackend.getEntries)
        .mockResolvedValueOnce([{ ...fromEntryWithLink, id: 'entry-1' }] as any)
        .mockResolvedValueOnce([{ ...mockToEntry, id: 'entry-2' }] as any);

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

    it('should handle backend errors with rollback', async () => {
      vi.mocked(mockBackend.getEntries)
        .mockResolvedValueOnce([{ ...mockFromEntry, id: 'entry-1' }] as any)
        .mockResolvedValueOnce([{ ...mockToEntry, id: 'entry-2' }] as any);

      vi.mocked(journalHandlers.createEntryLink).mockRejectedValueOnce(new Error('Backend error'));

      const { result } = renderHook(() => useEntryLinking());

      await act(async () => {
        await expect(result.current.linkEntry('entry-1', 'entry-2')).rejects.toThrow('Backend error');
      });

      expect(result.current.error).toBe('Backend error');
    });

    it('should clear error state on success', async () => {
      vi.mocked(mockBackend.getEntries)
        .mockResolvedValueOnce([{ ...mockFromEntry, id: 'entry-1' }] as any)
        .mockResolvedValueOnce([{ ...mockToEntry, id: 'entry-2' }] as any);

      const { result } = renderHook(() => useEntryLinking());

      await act(async () => {
        await result.current.linkEntry('entry-1', 'entry-2');
      });

      expect(result.current.error).toBeNull();
    });

    it('should handle user not authenticated (backend missing)', async () => {
      vi.mocked(useStorage).mockReturnValue({
        backend: null,
        user: null,
        isUserLoading: false,
      });

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
      createdAt: '2024-01-15T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
      linkedEntryIds: ['entry-2'],
    };
    const mockToEntry: JournalEntryData = {
      content: 'To entry',
      date: '2024-01-16',
      createdAt: '2024-01-16T00:00:00Z',
      updatedAt: '2024-01-16T00:00:00Z',
      linkedEntryIds: ['entry-1'],
    };

    it('should successfully unlink two entries', async () => {
      vi.mocked(mockBackend.getEntries)
        .mockResolvedValueOnce([{ ...mockFromEntry, id: 'entry-1' }] as any)
        .mockResolvedValueOnce([{ ...mockToEntry, id: 'entry-2' }] as any);

      const { result } = renderHook(() => useEntryLinking());

      await act(async () => {
        await result.current.unlinkEntry('entry-1', 'entry-2');
      });

      expect(journalHandlers.deleteEntryLink).toHaveBeenCalledWith({
        fromEntryId: 'entry-1',
        toEntryId: 'entry-2',
        backend: mockBackend,
      });
      expect(result.current.error).toBeNull();
    });

    it('should set loading state during operation', async () => {
      vi.mocked(mockBackend.getEntries)
        .mockResolvedValueOnce([{ ...mockFromEntry, id: 'entry-1' }] as any)
        .mockResolvedValueOnce([{ ...mockToEntry, id: 'entry-2' }] as any);

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
      vi.mocked(mockBackend.getEntries).mockResolvedValueOnce([]);

      const { result } = renderHook(() => useEntryLinking());

      await act(async () => {
        await expect(result.current.unlinkEntry('entry-1', 'entry-2')).rejects.toThrow('Source entry not found');
      });

      expect(result.current.error).toBe('Source entry not found');
      expect(journalHandlers.deleteEntryLink).not.toHaveBeenCalled();
    });

    it('should handle missing target entry', async () => {
      vi.mocked(mockBackend.getEntries)
        .mockResolvedValueOnce([{ ...mockFromEntry, id: 'entry-1' }] as any)
        .mockResolvedValueOnce([]);

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

      vi.mocked(mockBackend.getEntries).mockResolvedValueOnce([{ ...fromEntryWithoutLink, id: 'entry-1' }] as any);

      const { result } = renderHook(() => useEntryLinking());

      await act(async () => {
        await result.current.unlinkEntry('entry-1', 'entry-2');
      });

      expect(result.current.error).toBe('Link does not exist');
      expect(journalHandlers.deleteEntryLink).not.toHaveBeenCalled();
    });

    it('should handle backend errors with rollback', async () => {
      vi.mocked(mockBackend.getEntries)
        .mockResolvedValueOnce([{ ...mockFromEntry, id: 'entry-1' }] as any)
        .mockResolvedValueOnce([{ ...mockToEntry, id: 'entry-2' }] as any);

      vi.mocked(journalHandlers.deleteEntryLink).mockRejectedValueOnce(new Error('Backend error'));

      const { result } = renderHook(() => useEntryLinking());

      await act(async () => {
        await expect(result.current.unlinkEntry('entry-1', 'entry-2')).rejects.toThrow('Backend error');
      });

      expect(result.current.error).toBe('Backend error');
    });

    it('should clear error state on success', async () => {
      vi.mocked(mockBackend.getEntries)
        .mockResolvedValueOnce([{ ...mockFromEntry, id: 'entry-1' }] as any)
        .mockResolvedValueOnce([{ ...mockToEntry, id: 'entry-2' }] as any);

      const { result } = renderHook(() => useEntryLinking());

      await act(async () => {
        await result.current.unlinkEntry('entry-1', 'entry-2');
      });

      expect(result.current.error).toBeNull();
    });

    it('should handle user not authenticated (backend missing)', async () => {
      vi.mocked(useStorage).mockReturnValue({
        backend: null,
        user: null,
        isUserLoading: false,
      });

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
