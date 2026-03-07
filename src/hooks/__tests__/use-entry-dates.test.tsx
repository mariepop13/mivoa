import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useEntryDates } from '../use-entry-dates';
import { useAllEntries } from '@/repositories/storage-provider';

vi.mock('@/repositories/storage-provider', () => ({
  useStorage: vi.fn(),
  useEntriesByDate: vi.fn(),
  useEntry: vi.fn(),
  useAllEntries: vi.fn(),
}));

interface MockEntry {
  date?: string;
  content?: string;
  id?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

describe('useEntryDates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty dates when no entries exist', () => {
    vi.mocked(useAllEntries).mockReturnValue({ data: [], isLoading: false });

    const { result } = renderHook(() => useEntryDates());

    expect(result.current.dates).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('should return unique dates from entries', () => {
    const mockEntries: MockEntry[] = [
      { id: '1', date: '2024-01-15', content: '', createdAt: '', updatedAt: '' },
      { id: '2', date: '2024-01-14', content: '', createdAt: '', updatedAt: '' },
      { id: '3', date: '2024-01-15', content: '', createdAt: '', updatedAt: '' },
      { id: '4', date: '2024-01-13', content: '', createdAt: '', updatedAt: '' },
    ];

    vi.mocked(useAllEntries).mockReturnValue({ data: mockEntries as any, isLoading: false });

    const { result } = renderHook(() => useEntryDates());

    expect(result.current.dates).toEqual(['2024-01-15', '2024-01-14', '2024-01-13']);
    expect(result.current.dates.length).toBe(3);
  });

  it('should sort dates in descending order', () => {
    const mockEntries: MockEntry[] = [
      { id: '1', date: '2024-01-13', content: '', createdAt: '', updatedAt: '' },
      { id: '2', date: '2024-01-15', content: '', createdAt: '', updatedAt: '' },
      { id: '3', date: '2024-01-14', content: '', createdAt: '', updatedAt: '' },
      { id: '4', date: '2024-01-12', content: '', createdAt: '', updatedAt: '' },
    ];

    vi.mocked(useAllEntries).mockReturnValue({ data: mockEntries as any, isLoading: false });

    const { result } = renderHook(() => useEntryDates());

    expect(result.current.dates).toEqual(['2024-01-15', '2024-01-14', '2024-01-13', '2024-01-12']);
  });

  it('should filter out entries without date field', () => {
    const mockEntries: MockEntry[] = [
      { id: '1', date: '2024-01-15', content: '', createdAt: '', updatedAt: '' },
      { id: '2', content: 'No date', createdAt: '', updatedAt: '' },
      { id: '3', date: '2024-01-14', content: '', createdAt: '', updatedAt: '' },
      { id: '4', createdAt: '', updatedAt: '' },
    ];

    vi.mocked(useAllEntries).mockReturnValue({ data: mockEntries as any, isLoading: false });

    const { result } = renderHook(() => useEntryDates());

    expect(result.current.dates).toEqual(['2024-01-15', '2024-01-14']);
  });

  it('should return loading state when entries are loading', () => {
    vi.mocked(useAllEntries).mockReturnValue({ data: null, isLoading: true });

    const { result } = renderHook(() => useEntryDates());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.dates).toEqual([]);
  });

  it('should return empty dates when data is null', () => {
    vi.mocked(useAllEntries).mockReturnValue({ data: null, isLoading: false });

    const { result } = renderHook(() => useEntryDates());

    expect(result.current.dates).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle entries with empty date strings', () => {
    const mockEntries: MockEntry[] = [
      { id: '1', date: '2024-01-15', content: '', createdAt: '', updatedAt: '' },
      { id: '2', date: '', content: '', createdAt: '', updatedAt: '' },
      { id: '3', date: '2024-01-14', content: '', createdAt: '', updatedAt: '' },
    ];

    vi.mocked(useAllEntries).mockReturnValue({ data: mockEntries as any, isLoading: false });

    const { result } = renderHook(() => useEntryDates());

    expect(result.current.dates).toEqual(['2024-01-15', '2024-01-14']);
  });

  it('should update dates when entries data changes', async () => {
    const initialEntries: MockEntry[] = [
      { id: '1', date: '2024-01-15', content: '', createdAt: '', updatedAt: '' },
    ];
    vi.mocked(useAllEntries).mockReturnValue({ data: initialEntries as any, isLoading: false });

    const { result, rerender } = renderHook(() => useEntryDates());

    expect(result.current.dates).toEqual(['2024-01-15']);

    const updatedEntries: MockEntry[] = [
      { id: '1', date: '2024-01-15', content: '', createdAt: '', updatedAt: '' },
      { id: '2', date: '2024-01-16', content: '', createdAt: '', updatedAt: '' },
    ];

    vi.mocked(useAllEntries).mockReturnValue({ data: updatedEntries as any, isLoading: false });

    rerender();

    await waitFor(() => {
      expect(result.current.dates).toEqual(['2024-01-16', '2024-01-15']);
    });
  });
});
