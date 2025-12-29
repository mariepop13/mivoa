import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useJournalAuth } from '../use-journal-auth';
import { useUser } from '@/firebase/auth/use-user';

vi.mock('@/firebase/auth/use-user');

describe('useJournalAuth', () => {
  const mockUser = { uid: 'test-user-id' } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useUser).mockReturnValue({
      user: null,
      isLoading: false,
      error: null,
    });
  });

  it('should return null authError', () => {
    const { result } = renderHook(() => useJournalAuth());

    expect(result.current.authError).toBeNull();
  });

  it('should return user and loading state from useUser', () => {
    vi.mocked(useUser).mockReturnValue({
      user: mockUser,
      isLoading: true,
      error: null,
    });

    const { result } = renderHook(() => useJournalAuth());

    expect(result.current.user).toBe(mockUser);
    expect(result.current.authLoading).toBe(true);
    expect(result.current.authError).toBeNull();
  });

  it('should return null user when not authenticated', () => {
    vi.mocked(useUser).mockReturnValue({
      user: null,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useJournalAuth());

    expect(result.current.user).toBeNull();
    expect(result.current.authLoading).toBe(false);
    expect(result.current.authError).toBeNull();
  });

  it('should return loading state when auth is loading', () => {
    vi.mocked(useUser).mockReturnValue({
      user: null,
      isLoading: true,
      error: null,
    });

    const { result } = renderHook(() => useJournalAuth());

    expect(result.current.authLoading).toBe(true);
    expect(result.current.authError).toBeNull();
  });

  it('should return authError message when error exists', () => {
    const mockError = new Error('Authentication failed');
    vi.mocked(useUser).mockReturnValue({
      user: null,
      isLoading: false,
      error: mockError,
    });

    const { result } = renderHook(() => useJournalAuth());

    expect(result.current.authError).toBe('Authentication failed');
    expect(result.current.authLoading).toBe(false);
    expect(result.current.user).toBeNull();
  });
});

