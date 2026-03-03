import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useUser } from '../use-user';
import { FirebaseProvider } from '@/firebase/provider';
import type { User, Auth, Unsubscribe, NextOrObserver, ErrorFn } from 'firebase/auth';

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn(),
  getAuth: vi.fn(),
  GoogleAuthProvider: vi.fn(),
}));

import { onAuthStateChanged } from 'firebase/auth';

interface MockAuth {
  currentUser: unknown;
}

describe('useUser', () => {
  const mockOnAuthStateChanged = vi.mocked(onAuthStateChanged);
  let mockUnsubscribe: Unsubscribe;
  let mockAuth: MockAuth;

  beforeEach(() => {
    mockUnsubscribe = vi.fn() as unknown as Unsubscribe;
    mockAuth = {
      currentUser: null,
    };

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createWrapper = (auth: MockAuth) => {
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <FirebaseProvider
        auth={auth as unknown as ReturnType<typeof import('firebase/auth').getAuth>}
        firebaseApp={{} as ReturnType<typeof import('firebase/app').getApp>}
        firestore={{} as ReturnType<typeof import('firebase/firestore').getFirestore>}
        areServicesAvailable={true}
      >
        {children}
      </FirebaseProvider>
    );
    Wrapper.displayName = 'TestWrapper';
    return Wrapper;
  };

  it('should return loading state initially', () => {
    mockOnAuthStateChanged.mockImplementation((_auth: Auth, _nextOrObserver: NextOrObserver<User>, _error?: ErrorFn): Unsubscribe => mockUnsubscribe);

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

    mockOnAuthStateChanged.mockImplementation((_auth: Auth, nextOrObserver: NextOrObserver<User>, _error?: ErrorFn): Unsubscribe => {
      setTimeout(() => {
        if (typeof nextOrObserver === 'function') {
          nextOrObserver(mockUser);
        }
      }, 0);
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
  });

  it('should return null user when not authenticated', async () => {
    mockOnAuthStateChanged.mockImplementation((_auth: Auth, nextOrObserver: NextOrObserver<User>, _error?: ErrorFn): Unsubscribe => {
      setTimeout(() => {
        if (typeof nextOrObserver === 'function') {
          nextOrObserver(null);
        }
      }, 0);
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
  });

  it('should handle auth state errors', async () => {
    const mockError = new Error('Auth state error');
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    let errorCallback: ErrorFn | undefined;

    mockOnAuthStateChanged.mockImplementation((_auth: Auth, _nextOrObserver: NextOrObserver<User>, errCallback?: ErrorFn): Unsubscribe => {
      errorCallback = errCallback;
      return mockUnsubscribe;
    });

    const { result } = renderHook(() => useUser(), {
      wrapper: createWrapper(mockAuth),
    });

    await act(async () => {
      if (errorCallback) {
        errorCallback(mockError);
      }
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).not.toBe(null);
      },
      { timeout: 1000 }
    );

    expect(result.current.user).toBe(null);
    expect(result.current.error).toEqual(mockError);
    expect(consoleErrorSpy).toHaveBeenCalledWith('Auth state listener error:', mockError);

    consoleErrorSpy.mockRestore();
  });

  it('should unsubscribe on unmount', () => {
    mockOnAuthStateChanged.mockImplementation((_auth: Auth, _nextOrObserver: NextOrObserver<User>, _error?: ErrorFn): Unsubscribe => mockUnsubscribe);

    const { unmount } = renderHook(() => useUser(), {
      wrapper: createWrapper(mockAuth),
    });

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it('should update when auth state changes', async () => {
    let authCallback: ((user: User | null) => void) | null = null;

    mockOnAuthStateChanged.mockImplementation((_auth: Auth, nextOrObserver: NextOrObserver<User>, _error?: ErrorFn): Unsubscribe => {
      if (typeof nextOrObserver === 'function') {
        authCallback = nextOrObserver;
      }
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
