import { describe, it, expect, vi, beforeEach } from 'vitest';
import { changeEntryDate } from '../journal-handlers';
import { updateDocumentNonBlocking } from '@/firebase';
import { format } from 'date-fns';
import { doc, serverTimestamp } from 'firebase/firestore';

vi.mock('@/firebase');
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

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((firestore, path) => ({ id: 'mock-doc', path })),
  serverTimestamp: vi.fn(() => ({ _methodName: 'serverTimestamp' })),
}));

describe('changeEntryDate', () => {
  const mockFirestore = { id: 'mock-firestore' } as any;
  const mockUser = { uid: 'test-user-id' };
  const mockEntryId = 'test-entry-id';
  const mockNewDate = new Date(2024, 0, 20);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(updateDocumentNonBlocking).mockResolvedValue(undefined);
  });

  it('should format date correctly', async () => {
    await changeEntryDate({
      entryId: mockEntryId,
      newDate: mockNewDate,
      firestore: mockFirestore,
      user: mockUser,
    });

    expect(format).toHaveBeenCalledWith(mockNewDate, 'yyyy-MM-dd');
  });

  it('should create correct document reference', async () => {
    await changeEntryDate({
      entryId: mockEntryId,
      newDate: mockNewDate,
      firestore: mockFirestore,
      user: mockUser,
    });

    expect(doc).toHaveBeenCalledWith(mockFirestore, `users/${mockUser.uid}/entries/${mockEntryId}`);
  });

  it('should update document with new date and updatedAt timestamp', async () => {
    await changeEntryDate({
      entryId: mockEntryId,
      newDate: mockNewDate,
      firestore: mockFirestore,
      user: mockUser,
    });

    expect(updateDocumentNonBlocking).toHaveBeenCalledWith(
      { id: 'mock-doc', path: `users/${mockUser.uid}/entries/${mockEntryId}` },
      {
        date: '2024-01-20',
        updatedAt: { _methodName: 'serverTimestamp' },
      }
    );
  });

  it('should handle different dates correctly', async () => {
    const differentDate = new Date(2024, 11, 31);
    
    await changeEntryDate({
      entryId: mockEntryId,
      newDate: differentDate,
      firestore: mockFirestore,
      user: mockUser,
    });

    expect(format).toHaveBeenCalledWith(differentDate, 'yyyy-MM-dd');
    expect(updateDocumentNonBlocking).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        date: '2024-12-31',
      })
    );
  });

  it('should return promise that resolves when update completes', async () => {
    const promise = changeEntryDate({
      entryId: mockEntryId,
      newDate: mockNewDate,
      firestore: mockFirestore,
      user: mockUser,
    });

    expect(promise).toBeInstanceOf(Promise);
    await expect(promise).resolves.toBeUndefined();
  });

  it('should handle update errors', async () => {
    const mockError = new Error('Update failed');
    vi.mocked(updateDocumentNonBlocking).mockRejectedValue(mockError);

    await expect(
      changeEntryDate({
        entryId: mockEntryId,
        newDate: mockNewDate,
        firestore: mockFirestore,
        user: mockUser,
      })
    ).rejects.toThrow('Update failed');
  });

  it('should use serverTimestamp for updatedAt', async () => {
    await changeEntryDate({
      entryId: mockEntryId,
      newDate: mockNewDate,
      firestore: mockFirestore,
      user: mockUser,
    });

    expect(serverTimestamp).toHaveBeenCalled();
  });
});

