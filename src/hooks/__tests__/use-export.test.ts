import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useExport } from '../use-export';

const mockSubscribeToAllEntries = vi.fn();

vi.mock('@/repositories/storage-provider', () => ({
  useStorage: vi.fn(),
}));

import { useStorage } from '@/repositories/storage-provider';

vi.mock('jszip', () => ({
  default: vi.fn().mockImplementation(() => ({
    file: vi.fn(),
    generateAsync: vi.fn().mockResolvedValue(new Blob()),
  })),
}));

// Mock URL methods used by triggerDownload
URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
URL.revokeObjectURL = vi.fn();

const mockBackend = { subscribeToAllEntries: mockSubscribeToAllEntries };

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
    vi.mocked(useStorage).mockReturnValue({
      backend: mockBackend as never,
      user: { uid: 'test-uid' } as never,
      isUserLoading: false,
    });
    mockSubscribeToAllEntries.mockImplementation((callback: (entries: typeof mockEntry[]) => void) => {
      callback([mockEntry]);
      return () => {};
    });
  });

  it('exports isExporting as false initially', () => {
    const { result } = renderHook(() => useExport());
    expect(result.current.isExporting).toBe(false);
  });

  it('calls subscribeToAllEntries on exportJSON', async () => {
    const { result } = renderHook(() => useExport());
    await act(async () => {
      await result.current.exportJSON();
    });
    expect(mockSubscribeToAllEntries).toHaveBeenCalled();
  });

  it('does nothing when backend is null', async () => {
    vi.mocked(useStorage).mockReturnValue({
      backend: null,
      user: null,
      isUserLoading: false,
    });
    const { result } = renderHook(() => useExport());
    await act(async () => {
      await result.current.exportJSON();
    });
    expect(mockSubscribeToAllEntries).not.toHaveBeenCalled();
  });

  it('does nothing when user is null', async () => {
    vi.mocked(useStorage).mockReturnValue({
      backend: mockBackend as never,
      user: null,
      isUserLoading: false,
    });
    const { result } = renderHook(() => useExport());
    await act(async () => {
      await result.current.exportJSON();
    });
    expect(mockSubscribeToAllEntries).not.toHaveBeenCalled();
  });
});
