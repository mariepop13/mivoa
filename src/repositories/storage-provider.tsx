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

export function StorageProvider({ backend, children }: StorageProviderProps): React.JSX.Element {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = backend.subscribeToAuthState((authUser) => {
      setUser(authUser);
      setIsUserLoading(false);
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
  const { backend, user } = useStorage();
  const [data, setData] = useState<Settings | null | undefined>(undefined);

  useEffect(() => {
    if (!backend || !user) { setData(null); return; }
    return backend.subscribeToSettings(setData);
  }, [backend, user]);

  return { data: data ?? null, isLoading: data === undefined };
}
