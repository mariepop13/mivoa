import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useUser } from '../use-user';
import { FirebaseProvider } from '@/firebase/provider';
import type { User } from 'firebase/auth';

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn(),
  getAuth: vi.fn(),
  GoogleAuthProvider: vi.fn(),
}));

import { onAuthStateChanged } from 'firebase/auth';

describe('useUser', () => {
  const mockOnAuthStateChanged = vi.mocked(onAuthStateChanged);
  let mockUnsubscribe: ReturnType<typeof vi.fn>;
  let mockAuth: any;

  beforeEach(() => {
    mockUnsubscribe = vi.fn();
    mockAuth = {
      currentUser: null,
    };

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createWrapper = (auth: any) => {
    return ({ children }: { children: React.ReactNode }) => (
      <FirebaseProvider
        auth={auth}
        firebaseApp={{} as any}
        firestore={{} as any}
        areServicesAvailable={true}
      >
        {children}
      </FirebaseProvider>
    );
  };

  it('should return loading state initially', () => {
    mockOnAuthStateChanged.mockImplementation(() => {
      return mockUnsubscribe;
    });

    const { result } = renderHook(() => useUser(), {
      wrapper: createWrapper(mockAuth),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.user).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('should return user when authenticated', async () => {
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com',
    } as User;

    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      setTimeout(() => callback(mockUser), 0);
      return mockUnsubscribe;
    });

    const { result } = renderHook(() => useUser(), {
      wrapper: createWrapper(mockAuth),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.error).toBe(null);
    expect(result.current.isLoading).toBe(false);
  });

  it('should return null user when not authenticated', async () => {
    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      setTimeout(() => callback(null), 0);
      return mockUnsubscribe;
    });

    const { result } = renderHook(() => useUser(), {
      wrapper: createWrapper(mockAuth),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toBe(null);
    expect(result.current.error).toBe(null);
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle auth state errors', async () => {
    const mockError = new Error('Auth state error');

    mockOnAuthStateChanged.mockImplementation((auth, callback, errorCallback) => {
      setTimeout(() => errorCallback?.(mockError), 0);
      return mockUnsubscribe;
    });

    const { result } = renderHook(() => useUser(), {
      wrapper: createWrapper(mockAuth),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toBe(null);
    expect(result.current.error).toEqual(mockError);
    expect(result.current.isLoading).toBe(false);
  });

  it('should unsubscribe on unmount', () => {
    mockOnAuthStateChanged.mockImplementation(() => {
      return mockUnsubscribe;
    });

    const { unmount } = renderHook(() => useUser(), {
      wrapper: createWrapper(mockAuth),
    });

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it('should update when auth state changes', async () => {
    let authCallback: ((user: User | null) => void) | null = null;

    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      authCallback = callback;
      return mockUnsubscribe;
    });

    const { result } = renderHook(() => useUser(), {
      wrapper: createWrapper(mockAuth),
    });

    expect(result.current.isLoading).toBe(true);

    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com',
    } as User;

    await act(async () => {
      if (authCallback) {
        authCallback(mockUser);
      }
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.user).toEqual(mockUser);
    });

    const newMockUser = {
      uid: 'new-uid',
      email: 'new@example.com',
    } as User;

    await act(async () => {
      if (authCallback) {
        authCallback(newMockUser);
      }
    });

    await waitFor(() => {
      expect(result.current.user).toEqual(newMockUser);
    });
  });
});
