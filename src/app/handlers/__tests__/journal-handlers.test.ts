import { describe, it, expect, vi, beforeEach } from 'vitest';
import { changeEntryDate } from '../journal-handlers';
import { format } from 'date-fns';
import type { StorageBackend } from '@/repositories/storage-backend';

vi.mock('date-fns', () => ({
  format: vi.fn((date: Date, formatStr: string) => {
    if (formatStr === 'yyyy-MM-dd') {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return '';
  }),
}));

describe('changeEntryDate', () => {
  const mockEntryId = 'test-entry-id';
  const mockNewDate = new Date(2024, 0, 20);

  let mockBackend: StorageBackend;

  beforeEach(() => {
    vi.clearAllMocks();
    mockBackend = {
      subscribeToAuthState: vi.fn(),
      subscribeToEntriesByDate: vi.fn(),
      subscribeToEntry: vi.fn(),
      subscribeToAllEntries: vi.fn(),
      subscribeToSettings: vi.fn(),
      getEntries: vi.fn(),
      createEntry: vi.fn(),
      updateEntry: vi.fn().mockResolvedValue(undefined),
      deleteEntry: vi.fn(),
      linkEntries: vi.fn(),
      unlinkEntries: vi.fn(),
      updateSettings: vi.fn(),
      signOut: vi.fn(),
    };
  });

  it('should format date correctly', async () => {
    await changeEntryDate({
      entryId: mockEntryId,
      newDate: mockNewDate,
      backend: mockBackend,
    });

    expect(format).toHaveBeenCalledWith(mockNewDate, 'yyyy-MM-dd');
  });

  it('should call backend.updateEntry with new date', async () => {
    await changeEntryDate({
      entryId: mockEntryId,
      newDate: mockNewDate,
      backend: mockBackend,
    });

    expect(mockBackend.updateEntry).toHaveBeenCalledWith(mockEntryId, {
      date: '2024-01-20',
    });
  });

  it('should update document with new date', async () => {
    await changeEntryDate({
      entryId: mockEntryId,
      newDate: mockNewDate,
      backend: mockBackend,
    });

    expect(mockBackend.updateEntry).toHaveBeenCalledWith(
      mockEntryId,
      expect.objectContaining({ date: '2024-01-20' })
    );
  });

  it('should handle different dates correctly', async () => {
    const differentDate = new Date(2024, 11, 31);

    await changeEntryDate({
      entryId: mockEntryId,
      newDate: differentDate,
      backend: mockBackend,
    });

    expect(format).toHaveBeenCalledWith(differentDate, 'yyyy-MM-dd');
    expect(mockBackend.updateEntry).toHaveBeenCalledWith(
      mockEntryId,
      expect.objectContaining({ date: '2024-12-31' })
    );
  });

  it('should return promise that resolves when update completes', async () => {
    const promise = changeEntryDate({
      entryId: mockEntryId,
      newDate: mockNewDate,
      backend: mockBackend,
    });

    expect(promise).toBeInstanceOf(Promise);
    await expect(promise).resolves.toBeUndefined();
  });

  it('should handle update errors', async () => {
    const mockError = new Error('Update failed');
    vi.mocked(mockBackend.updateEntry).mockRejectedValue(mockError);

    await expect(
      changeEntryDate({
        entryId: mockEntryId,
        newDate: mockNewDate,
        backend: mockBackend,
      })
    ).rejects.toThrow('Update failed');
  });
});
