import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useJournalAuth } from '../use-journal-auth';

vi.mock('@/repositories/storage-provider', () => ({
  useStorage: vi.fn(),
}));

import { useStorage } from '@/repositories/storage-provider';

describe('useJournalAuth', () => {
  const mockUser = { uid: 'test-user-id', displayName: null, email: null, photoURL: null };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useStorage).mockReturnValue({
      backend: null,
      user: null,
      isUserLoading: false,
    });
  });

  it('should return null authError', () => {
    const { result } = renderHook(() => useJournalAuth());

    expect(result.current.authError).toBeNull();
  });

  it('should return user and loading state from useStorage', () => {
    vi.mocked(useStorage).mockReturnValue({
      backend: null,
      user: mockUser,
      isUserLoading: true,
    });

    const { result } = renderHook(() => useJournalAuth());

    expect(result.current.user).toBe(mockUser);
    expect(result.current.authLoading).toBe(true);
    expect(result.current.authError).toBeNull();
  });

  it('should return null user when not authenticated', () => {
    const { result } = renderHook(() => useJournalAuth());

    expect(result.current.user).toBeNull();
    expect(result.current.authLoading).toBe(false);
    expect(result.current.authError).toBeNull();
  });

  it('should return loading state when auth is loading', () => {
    vi.mocked(useStorage).mockReturnValue({
      backend: null,
      user: null,
      isUserLoading: true,
    });

    const { result } = renderHook(() => useJournalAuth());

    expect(result.current.authLoading).toBe(true);
    expect(result.current.authError).toBeNull();
  });

  it('always returns null authError regardless of state', () => {
    vi.mocked(useStorage).mockReturnValue({
      backend: null,
      user: null,
      isUserLoading: false,
    });

    const { result } = renderHook(() => useJournalAuth());

    expect(result.current.authError).toBeNull();
  });
});
