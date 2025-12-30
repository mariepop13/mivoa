'use client';

import { useState, useEffect, useRef, startTransition } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export type WithId<T> = T & { id: string };

export interface UseCollectionResult<T> {
  data: WithId<T>[] | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
}

/**
 * InternalQuery interface provides access to internal Firebase Query properties.
 * ⚠️ WARNING: Relying on _query and canonicalString() is using non-public/unsupported APIs.
 * This may break in future Firebase SDK updates.
 */
export interface InternalQuery extends Query<DocumentData> {
  _query: {
    path: {
      canonicalString(): string;
      toString(): string;
    }
  }
}

export function useCollection<T = any>(
    memoizedTargetRefOrQuery: ((CollectionReference<DocumentData> | Query<DocumentData>) & {__memo?: boolean})  | null | undefined,
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;
  type StateDataType = ResultItemType[] | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!memoizedTargetRefOrQuery && mountedRef.current) {
      startTransition(() => {
        setIsLoading(false);
        setError(null);
        setData(null);
      });
    }
  }, [memoizedTargetRefOrQuery]);

  useEffect(() => {
    if (!memoizedTargetRefOrQuery) {
      return;
    }

    if (process.env.NODE_ENV !== 'production') {
      if (!memoizedTargetRefOrQuery.__memo) {
        const queryType = memoizedTargetRefOrQuery?.constructor?.name || 'Unknown';
        let queryString: string;
        try {
          const seen = new WeakSet();
          const replacer = (_key: string, value: any) => {
            if (typeof value === 'object' && value !== null) {
              if (seen.has(value)) {
                return '[circular]';
              }
              seen.add(value);
            }
            return value;
          };
          queryString = JSON.stringify(memoizedTargetRefOrQuery, replacer, 2).substring(0, 200);
        } catch (error) {
          queryString = `[unable to stringify: ${error instanceof Error ? error.message : 'unknown error'}]`;
        }
        throw new Error(`Query or collection reference was not properly memoized using useMemo. Type: ${queryType}, Value: ${queryString}`);
      }
    }

    if (mountedRef.current) {
      startTransition(() => {
        setIsLoading(true);
        setError(null);
      });
    }

    const unsubscribe = onSnapshot(
      memoizedTargetRefOrQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        if (!mountedRef.current) return;
        const results: ResultItemType[] = [];
        for (const doc of snapshot.docs) {
          results.push({ ...(doc.data() as T), id: doc.id });
        }
        setData(results);
        setError(null);
        setIsLoading(false);
      },
      (_error: FirestoreError) => {
        if (!mountedRef.current) return;

        if (_error.code === 'permission-denied') {
          const path: string =
            memoizedTargetRefOrQuery.type === 'collection'
              ? (memoizedTargetRefOrQuery as CollectionReference).path
              : (memoizedTargetRefOrQuery as any)._query?.path?.canonicalString?.() || 
                (memoizedTargetRefOrQuery as any).path || 
                'unknown-query-path';

          const contextualError = new FirestorePermissionError({
            operation: 'list',
            path,
          }, _error)

          setError(contextualError)
          errorEmitter.emit('permission-error', contextualError);
        } else {
          setError(_error);
        }

        setData(null)
        setIsLoading(false)
      }
    );

    return () => unsubscribe();
  }, [memoizedTargetRefOrQuery]);

  return { data, isLoading, error };
}

