import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useJournalAuth } from '../use-journal-auth';
import { useAuth } from '@/firebase';
import { useUser } from '@/firebase/auth/use-user';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { isAppOfflineError } from '@/firebase/utils';
import type { Auth } from 'firebase/auth';

vi.mock('@/firebase');
vi.mock('@/firebase/auth/use-user');
vi.mock('@/firebase/non-blocking-login');
vi.mock('@/firebase/utils');

describe('useJournalAuth', () => {
  const mockAuth = { app: { name: 'test' } } as Partial<Auth> as Auth;
  const mockUser = { uid: 'test-user-id' } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue(mockAuth);
    vi.mocked(useUser).mockReturnValue({
      user: null,
      isLoading: false,
      error: null,
    });
    vi.mocked(initiateAnonymousSignIn).mockResolvedValue({ user: mockUser } as any);
    vi.mocked(isAppOfflineError).mockReturnValue(false);
  });

  it('should initiate anonymous sign in when user is not authenticated', async () => {
    renderHook(() => useJournalAuth());

    await waitFor(() => {
      expect(initiateAnonymousSignIn).toHaveBeenCalledWith(mockAuth);
    });
  });

  it('should not initiate sign in when user is already authenticated', () => {
    vi.mocked(useUser).mockReturnValue({
      user: mockUser,
      isLoading: false,
      error: null,
    });

    renderHook(() => useJournalAuth());

    expect(initiateAnonymousSignIn).not.toHaveBeenCalled();
  });

  it('should not initiate sign in when auth is loading', () => {
    vi.mocked(useUser).mockReturnValue({
      user: null,
      isLoading: true,
      error: null,
    });

    renderHook(() => useJournalAuth());

    expect(initiateAnonymousSignIn).not.toHaveBeenCalled();
  });

  it('should not initiate sign in when auth is null', () => {
    vi.mocked(useAuth).mockReturnValue(null as any);

    renderHook(() => useJournalAuth());

    expect(initiateAnonymousSignIn).not.toHaveBeenCalled();
  });

  it('should set error for offline errors', async () => {
    const offlineError = new Error('Network error');
    vi.mocked(initiateAnonymousSignIn).mockRejectedValue(offlineError);
    vi.mocked(isAppOfflineError).mockReturnValue(true);

    const { result } = renderHook(() => useJournalAuth());

    await waitFor(() => {
      expect(result.current.authError).toBeTruthy();
    });

    expect(result.current.authError).toContain('offline');
  });

  it('should set error for other authentication errors', async () => {
    const authError = new Error('Auth failed');
    vi.mocked(initiateAnonymousSignIn).mockRejectedValue(authError);
    vi.mocked(isAppOfflineError).mockReturnValue(false);

    const { result } = renderHook(() => useJournalAuth());

    await waitFor(() => {
      expect(result.current.authError).toBeTruthy();
    });

    expect(result.current.authError).toContain('Firebase configuration');
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
  });

  it('should not set error after unmount', async () => {
    const authError = new Error('Auth failed');
    vi.mocked(initiateAnonymousSignIn).mockImplementation(() => new Promise((_, reject) => {
        setTimeout(() => reject(authError), 100);
      }));

    const { result, unmount } = renderHook(() => useJournalAuth());

    unmount();

    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(result.current.authError).toBeNull();
  });
});

