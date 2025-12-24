'use client';
    
import { useState, useEffect, useRef, startTransition } from 'react';
import {
  DocumentReference,
  onSnapshot,
  DocumentData,
  FirestoreError,
  DocumentSnapshot,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { WithId } from './use-collection';

export interface UseDocResult<T> {
  data: WithId<T> | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
}

export function useDoc<T extends Record<string, unknown> = Record<string, unknown>>(
  memoizedDocRef: DocumentReference<DocumentData> | null | undefined,
): UseDocResult<T> {
  type StateDataType = WithId<T> | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    if (!memoizedDocRef && mountedRef.current) {
      startTransition(() => {
        setIsLoading(false);
        setError(null);
        setData(null);
      });
    }
  }, [memoizedDocRef]);

  useEffect(() => {
    if (!memoizedDocRef) {
      return;
    }

    mountedRef.current = true;

    if (mountedRef.current) {
      startTransition(() => {
        setIsLoading(true);
        setError(null);
      });
    }

    const unsubscribe = onSnapshot(
      memoizedDocRef,
      (snapshot: DocumentSnapshot<DocumentData>) => {
        if (!mountedRef.current) return;
        if (snapshot.exists()) {
          setData({ ...(snapshot.data() as T), id: snapshot.id });
        } else {
          setData(null);
        }
        setIsLoading(false);
      },
      (_error: FirestoreError) => {
        if (!mountedRef.current) return;
        
        if (_error.code === 'permission-denied') {
          const contextualError = new FirestorePermissionError({
            operation: 'get',
            path: memoizedDocRef.path,
          }, _error);
          setError(contextualError);
          errorEmitter.emit('permission-error', contextualError);
        } else {
          setError(_error);
        }
        
        setData(null);
        setIsLoading(false);
      }
    );

    return () => {
      mountedRef.current = false;
      unsubscribe();
    };
  }, [memoizedDocRef]);

  return { data, isLoading, error };
}

