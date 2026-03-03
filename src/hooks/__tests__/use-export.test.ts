import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useExport } from '../use-export';
import { useFirestore } from '@/firebase';
import { useUser } from '@/firebase/auth/use-user';
import { collection, getDocs } from 'firebase/firestore';
import type { User } from 'firebase/auth';

vi.mock('@/firebase');
vi.mock('@/firebase/auth/use-user');
vi.mock('jszip', () => ({
  default: vi.fn().mockImplementation(() => ({
    file: vi.fn(),
    generateAsync: vi.fn().mockResolvedValue(new Blob()),
  })),
}));
vi.mock('file-saver', () => ({
  saveAs: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  getDocs: vi.fn(),
  Timestamp: {
    fromDate: vi.fn((d: Date) => ({ toDate: () => d, seconds: 0, nanoseconds: 0 })),
  },
}));

const mockFirestore = { id: 'mock-firestore' } as any;
const mockUser = { uid: 'test-uid' } as Partial<User> as User;

const mockEntry = {
  id: '2026-03-02-143045123',
  content: 'Test content',
  title: 'Test title',
  date: '2026-03-02',
  createdAt: '2026-03-02T14:30:45.000Z',
  updatedAt: '2026-03-02T14:31:00.000Z',
  moods: ['calm'],
  themes: ['work'],
  keyTakeaways: ['insight'],
  places: [],
  characters: [],
  linkedEntryIds: [],
  conversationHistory: [],
};

describe('useExport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useFirestore).mockReturnValue(mockFirestore);
    vi.mocked(useUser).mockReturnValue({ user: mockUser, isLoading: false, error: null });
    vi.mocked(collection).mockReturnValue({ id: 'mock-col' } as any);
    vi.mocked(getDocs).mockResolvedValue({
      docs: [{ id: mockEntry.id, data: () => mockEntry }],
    } as any);
  });

  it('exports isExporting as false initially', () => {
    const { result } = renderHook(() => useExport());
    expect(result.current.isExporting).toBe(false);
  });

  it('calls getDocs with the correct collection path', async () => {
    const { result } = renderHook(() => useExport());
    await act(async () => {
      await result.current.exportJSON();
    });
    expect(collection).toHaveBeenCalledWith(mockFirestore, 'users/test-uid/entries');
    expect(getDocs).toHaveBeenCalled();
  });

  it('does nothing when firestore is null', async () => {
    vi.mocked(useFirestore).mockReturnValue(null as any);
    const { result } = renderHook(() => useExport());
    await act(async () => {
      await result.current.exportJSON();
    });
    expect(getDocs).not.toHaveBeenCalled();
  });

  it('does nothing when user is null', async () => {
    vi.mocked(useUser).mockReturnValue({ user: null, isLoading: false, error: null });
    const { result } = renderHook(() => useExport());
    await act(async () => {
      await result.current.exportJSON();
    });
    expect(getDocs).not.toHaveBeenCalled();
  });
});
