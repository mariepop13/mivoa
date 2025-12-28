import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useDoc } from '../use-doc';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { DocumentReference, DocumentSnapshot, DocumentData, FirestoreError } from 'firebase/firestore';

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

const mockDocRef = {
  path: 'test/collection/doc1',
} as unknown as DocumentReference<DocumentData>;

const mockDocumentSnapshot = {
  id: 'doc1',
  exists: () => true,
  data: () => ({ name: 'Test Document', value: 123 }),
} as unknown as DocumentSnapshot<DocumentData>;

const mockEmptySnapshot = {
  id: 'doc1',
  exists: () => false,
  data: () => undefined,
} as unknown as DocumentSnapshot<DocumentData>;

describe('useDoc', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSnapshot.mockImplementation((...args: unknown[]) => {
      const onNext = args[1] as ((snapshot: DocumentSnapshot<DocumentData>) => void) | undefined;
      setTimeout(() => {
        if (onNext) {
          onNext(mockDocumentSnapshot);
        }
      }, 0);
      return mockUnsubscribe;
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return null data when doc ref is null', () => {
    const { result } = renderHook(() => useDoc(null));

    expect(result.current.data).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should return null data when doc ref is undefined', () => {
    const { result } = renderHook(() => useDoc(undefined));

    expect(result.current.data).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should load document data successfully', async () => {
    const { result } = renderHook(() => useDoc(mockDocRef));

    await waitFor(() => {
      expect(result.current.data).not.toBeNull();
    });

    expect(result.current.data).toEqual({
      id: 'doc1',
      name: 'Test Document',
      value: 123,
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should return null when document does not exist', async () => {
    mockOnSnapshot.mockImplementation((...args: unknown[]) => {
      const onNext = args[1] as ((snapshot: DocumentSnapshot<DocumentData>) => void) | undefined;
      setTimeout(() => {
        if (onNext) {
          onNext(mockEmptySnapshot);
        }
      }, 0);
      return mockUnsubscribe;
    });

    const { result } = renderHook(() => useDoc(mockDocRef));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeNull();
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

    const { result } = renderHook(() => useDoc(mockDocRef));

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

    const { result } = renderHook(() => useDoc(mockDocRef));

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });

    expect(result.current.error).toBe(firestoreError);
    expect(result.current.data).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('should unsubscribe on unmount', () => {
    const { unmount } = renderHook(() => useDoc(mockDocRef));

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('should update when doc ref changes', async () => {
    const newDocRef = {
      path: 'test/collection/doc2',
    } as unknown as DocumentReference<DocumentData>;

    const { result, rerender } = renderHook(
      ({ ref }: { ref: typeof mockDocRef | null }) => useDoc(ref),
      { initialProps: { ref: mockDocRef } }
    );

    await waitFor(() => {
      expect(result.current.data).not.toBeNull();
    });

    act(() => {
      rerender({ ref: newDocRef });
    });

    expect(mockOnSnapshot).toHaveBeenCalledTimes(2);
  });

  it('should not process updates after unmount', async () => {
    const { result, unmount } = renderHook(() => useDoc(mockDocRef));

    unmount();

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(result.current.data).toBeNull();
  });
});

