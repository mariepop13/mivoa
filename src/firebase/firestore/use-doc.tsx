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
  const [docIsLoading, setDocIsLoading] = useState<boolean>(false);
  // hasSettled tracks whether the current memoizedDocRef has received its first snapshot.
  // This prevents the race condition where isLoading=false and data=null simultaneously
  // in the render frame between memoizedDocRef becoming non-null and the effect firing.
  const [hasSettled, setHasSettled] = useState(false);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    if (!memoizedDocRef && mountedRef.current) {
      startTransition(() => {
        setDocIsLoading(false);
        setHasSettled(false);
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
        setDocIsLoading(true);
        setHasSettled(false);
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
        setDocIsLoading(false);
        setHasSettled(true);
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
        setDocIsLoading(false);
        setHasSettled(true);
      }
    );

    return () => {
      mountedRef.current = false;
      unsubscribe();
    };
  }, [memoizedDocRef]);

  // isLoading is true when docRef is non-null but no snapshot has arrived yet (hasSettled=false),
  // OR when the subscription is actively fetching. This ensures isLoading=true in the render
  // frame right after memoizedDocRef becomes non-null, before any effect fires.
  const isLoading = docIsLoading || (!!memoizedDocRef && !hasSettled);

  return { data, isLoading, error };
}

