'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { StorageBackend } from './storage-backend';
import type { AppUser, Entry, Settings } from './types';

interface StorageContextValue {
  backend: StorageBackend | null;
  user: AppUser | null;
  isUserLoading: boolean;
}

const StorageContext = createContext<StorageContextValue>({
  backend: null,
  user: null,
  isUserLoading: true,
});

interface StorageProviderProps {
  backend: StorageBackend;
  children: ReactNode;
}

function readAuthStateSync(backend: StorageBackend): { user: AppUser | null; isLoading: boolean } {
  let syncUser: AppUser | null = null;
  let resolved = false;
  const unsub = backend.subscribeToAuthState((u) => { syncUser = u; resolved = true; });
  unsub();
  return { user: syncUser, isLoading: !resolved };
}

export function StorageProvider({ backend, children }: StorageProviderProps): React.JSX.Element {
  const [authState, setAuthState] = useState(() => readAuthStateSync(backend));
  const { user, isLoading: isUserLoading } = authState;

  useEffect(() => {
    const unsubscribe = backend.subscribeToAuthState((authUser) => {
      setAuthState((prev) =>
        prev.user === authUser && !prev.isLoading ? prev : { user: authUser, isLoading: false }
      );
    });
    return unsubscribe;
  }, [backend]);

  return (
    <StorageContext.Provider value={{ backend, user, isUserLoading }}>
      {children}
    </StorageContext.Provider>
  );
}

export function useStorage(): StorageContextValue {
  return useContext(StorageContext);
}

export function useEntriesByDate(dateKey: string): { data: Entry[] | null; isLoading: boolean } {
  const { backend, user } = useStorage();
  const [data, setData] = useState<Entry[] | null>(null);

  useEffect(() => {
    if (!backend || !user) return;
    return backend.subscribeToEntriesByDate(dateKey, setData);
  }, [backend, user, dateKey]);

  return { data, isLoading: data === null };
}

export function useEntry(entryId: string | null): { data: Entry | null; isLoading: boolean } {
  const { backend, user } = useStorage();
  const [data, setData] = useState<Entry | null | undefined>(undefined);

  useEffect(() => {
    if (!backend || !user || !entryId) { setData(null); return; }
    return backend.subscribeToEntry(entryId, setData);
  }, [backend, user, entryId]);

  return { data: data ?? null, isLoading: data === undefined };
}

export function useAllEntries(): { data: Entry[] | null; isLoading: boolean } {
  const { backend, user } = useStorage();
  const [data, setData] = useState<Entry[] | null>(null);

  useEffect(() => {
    if (!backend || !user) return;
    return backend.subscribeToAllEntries(setData);
  }, [backend, user]);

  return { data, isLoading: data === null };
}

export function useSettings(): { data: Settings | null; isLoading: boolean } {
  const { backend, user, isUserLoading } = useStorage();
  const [data, setData] = useState<Settings | null | undefined>(() => {
    if (!backend || isUserLoading || !user) return undefined;
    let syncData: Settings | null | undefined = undefined;
    const unsub = backend.subscribeToSettings((d) => { syncData = d; });
    unsub();
    return syncData;
  });

  useEffect(() => {
    if (!backend) { setData(null); return; }
    if (isUserLoading) { setData(undefined); return; }
    if (!user) { setData(null); return; }
    return backend.subscribeToSettings((d) => {
      setData((prev) => prev === d ? prev : d);
    });
  }, [backend, user, isUserLoading]);

  return { data: data ?? null, isLoading: data === undefined };
}
