import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useCollection } from '../use-collection';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { CollectionReference, QuerySnapshot, DocumentData, FirestoreError } from 'firebase/firestore';

vi.mock('@/firebase/error-emitter', () => ({
  errorEmitter: {
    emit: vi.fn(),
  },
}));

const mockUnsubscribe = vi.fn();
const mockOnSnapshot = vi.fn((..._args: unknown[]) => mockUnsubscribe);

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual<typeof import('firebase/firestore')>('firebase/firestore');
  return {
    ...actual,
    onSnapshot: (...args: unknown[]) => mockOnSnapshot(...args),
  };
});

const mockCollectionRef = {
  type: 'collection',
  path: 'test/collection',
  __memo: true,
} as unknown as CollectionReference<DocumentData> & { __memo?: boolean };

const mockQuerySnapshot = {
  docs: [
    {
      id: 'doc1',
      data: () => ({ name: 'Document 1', value: 100 }),
    },
    {
      id: 'doc2',
      data: () => ({ name: 'Document 2', value: 200 }),
    },
  ],
} as unknown as QuerySnapshot<DocumentData>;

describe('useCollection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSnapshot.mockImplementation((...args: unknown[]) => {
      const onNext = args[1] as ((snapshot: QuerySnapshot<DocumentData>) => void) | undefined;
      setTimeout(() => {
        if (onNext) {
          onNext(mockQuerySnapshot);
        }
      }, 0);
      return mockUnsubscribe;
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return null data when collection ref is null', () => {
    const { result } = renderHook(() => useCollection(null));

    expect(result.current.data).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should return null data when collection ref is undefined', () => {
    const { result } = renderHook(() => useCollection(undefined));

    expect(result.current.data).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should load collection data successfully', async () => {
    const { result } = renderHook(() => useCollection(mockCollectionRef));

    await waitFor(() => {
      expect(result.current.data).not.toBeNull();
    });

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0]).toEqual({
      id: 'doc1',
      name: 'Document 1',
      value: 100,
    });
    expect(result.current.data?.[1]).toEqual({
      id: 'doc2',
      name: 'Document 2',
      value: 200,
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle permission denied errors', async () => {
    const permissionError = {
      code: 'permission-denied',
      message: 'Permission denied',
    } as FirestoreError;

    mockOnSnapshot.mockImplementation((...args: unknown[]) => {
      const onError = args[2] as ((error: FirestoreError) => void) | undefined;
      setTimeout(() => {
        if (onError) {
          onError(permissionError);
        }
      }, 0);
      return mockUnsubscribe;
    });

    const { result } = renderHook(() => useCollection(mockCollectionRef));

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });

    expect(result.current.error).toBeInstanceOf(FirestorePermissionError);
    expect(result.current.data).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(errorEmitter.emit).toHaveBeenCalledWith('permission-error', expect.any(FirestorePermissionError));
  });

  it('should handle other firestore errors', async () => {
    const firestoreError = {
      code: 'unavailable',
      message: 'Service unavailable',
    } as FirestoreError;

    mockOnSnapshot.mockImplementation((...args: unknown[]) => {
      const onError = args[2] as ((error: FirestoreError) => void) | undefined;
      setTimeout(() => {
        if (onError) {
          onError(firestoreError);
        }
      }, 0);
      return mockUnsubscribe;
    });

    const { result } = renderHook(() => useCollection(mockCollectionRef));

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });

    expect(result.current.error).toBe(firestoreError);
    expect(result.current.data).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('should unsubscribe on unmount', () => {
    const { unmount } = renderHook(() => useCollection(mockCollectionRef));

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('should update when collection ref changes', async () => {
    const newCollectionRef = {
      ...mockCollectionRef,
      path: 'test/new-collection',
    } as unknown as CollectionReference<DocumentData> & { __memo?: boolean };

    const { result, rerender } = renderHook(
      ({ ref }: { ref: typeof mockCollectionRef | null }) => useCollection(ref),
      { initialProps: { ref: mockCollectionRef } }
    );

    await waitFor(() => {
      expect(result.current.data).not.toBeNull();
    });

    act(() => {
      rerender({ ref: newCollectionRef });
    });

    expect(mockOnSnapshot).toHaveBeenCalledTimes(2);
  });

  it('should not process updates after unmount', async () => {
    const { result, unmount } = renderHook(() => useCollection(mockCollectionRef));

    unmount();

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(result.current.data).toBeNull();
  });
});

