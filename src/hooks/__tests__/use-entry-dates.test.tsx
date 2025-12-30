import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useEntryDates } from '../use-entry-dates';
import { useFirestore, useCollection } from '@/firebase';
import { useUser } from '@/firebase/auth/use-user';
import { collection } from 'firebase/firestore';
import type { User } from 'firebase/auth';

vi.mock('@/firebase');
vi.mock('@/firebase/auth/use-user');
vi.mock('firebase/firestore', () => {
  return {
    collection: vi.fn((firestore, path) => ({ id: 'mock-collection', path })),
    query: vi.fn((ref) => ref),
  };
});

const mockFirestore = { id: 'mock-firestore' } as any;
const mockUser = { uid: 'test-user-id' } as Partial<User> as User;

describe('useEntryDates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useFirestore).mockReturnValue(mockFirestore);
    vi.mocked(useUser).mockReturnValue({ user: mockUser, isLoading: false, error: null });
  });

  it('should return empty dates when no entries exist', () => {
    vi.mocked(useCollection).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useEntryDates());

    expect(result.current.dates).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('should return unique dates from entries', () => {
    const mockEntries = [
      { date: '2024-01-15' },
      { date: '2024-01-14' },
      { date: '2024-01-15' },
      { date: '2024-01-13' },
    ];

    vi.mocked(useCollection).mockReturnValue({
      data: mockEntries as any,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useEntryDates());

    expect(result.current.dates).toEqual(['2024-01-15', '2024-01-14', '2024-01-13']);
    expect(result.current.dates.length).toBe(3);
  });

  it('should sort dates in descending order', () => {
    const mockEntries = [
      { date: '2024-01-13' },
      { date: '2024-01-15' },
      { date: '2024-01-14' },
      { date: '2024-01-12' },
    ];

    vi.mocked(useCollection).mockReturnValue({
      data: mockEntries as any,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useEntryDates());

    expect(result.current.dates).toEqual(['2024-01-15', '2024-01-14', '2024-01-13', '2024-01-12']);
  });

  it('should filter out entries without date field', () => {
    const mockEntries = [
      { date: '2024-01-15' },
      { content: 'No date' },
      { date: '2024-01-14' },
      {},
    ];

    vi.mocked(useCollection).mockReturnValue({
      data: mockEntries as any,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useEntryDates());

    expect(result.current.dates).toEqual(['2024-01-15', '2024-01-14']);
  });

  it('should return loading state when entries are loading', () => {
    vi.mocked(useCollection).mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    const { result } = renderHook(() => useEntryDates());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.dates).toEqual([]);
  });

  it('should return empty dates when firestore is not available', () => {
    vi.mocked(useFirestore).mockReturnValue(null as any);
    vi.mocked(useCollection).mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useEntryDates());

    expect(result.current.dates).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('should return empty dates when user is not available', () => {
    vi.mocked(useUser).mockReturnValue({ user: null, isLoading: false, error: null });
    vi.mocked(useCollection).mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useEntryDates());

    expect(result.current.dates).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('should create collection reference with correct path', () => {
    vi.mocked(useCollection).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    renderHook(() => useEntryDates());

    expect(collection).toHaveBeenCalledWith(mockFirestore, 'users/test-user-id/entries');
  });

  it('should handle entries with empty date strings', () => {
    const mockEntries = [
      { date: '2024-01-15' },
      { date: '' },
      { date: '2024-01-14' },
    ];

    vi.mocked(useCollection).mockReturnValue({
      data: mockEntries as any,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useEntryDates());

    expect(result.current.dates).toEqual(['2024-01-15', '2024-01-14']);
  });

  it('should update dates when entries data changes', async () => {
    const initialEntries = [{ date: '2024-01-15' }];
    vi.mocked(useCollection).mockReturnValue({
      data: initialEntries as any,
      isLoading: false,
      error: null,
    });

    const { result, rerender } = renderHook(() => useEntryDates());

    expect(result.current.dates).toEqual(['2024-01-15']);

    const updatedEntries = [
      { date: '2024-01-15' },
      { date: '2024-01-16' },
    ];

    vi.mocked(useCollection).mockReturnValue({
      data: updatedEntries as any,
      isLoading: false,
      error: null,
    });

    rerender();

    await waitFor(() => {
      expect(result.current.dates).toEqual(['2024-01-16', '2024-01-15']);
    });
  });
});

