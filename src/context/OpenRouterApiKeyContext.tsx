'use client';

import { createContext, ReactNode, useCallback, useMemo } from 'react';
import { useUser, useFirestore, useDoc, setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp, deleteField } from 'firebase/firestore';

interface UserSettings extends Record<string, unknown> {
  openRouterApiKey?: string;
  updatedAt?: unknown;
}

interface OpenRouterApiKeyContextType {
  apiKey: string | null;
  setApiKey: (key: string | null) => Promise<void>;
  resetApiKey: () => Promise<void>;
  isLoading: boolean;
}

export const OpenRouterApiKeyContext = createContext<OpenRouterApiKeyContextType>({
  apiKey: null,
  setApiKey: async () => {},
  resetApiKey: async () => {},
  isLoading: true,
});

export function OpenRouterApiKeyProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: isUserLoading } = useUser();
  const firestore = useFirestore();

  const settingsDocRef = useMemo(() => {
    if (!firestore || !user) return null;
    return doc(firestore, `users/${user.uid}/settings/api`);
  }, [firestore, user]);

  const { data: settingsData, isLoading: isSettingsLoading } = useDoc<UserSettings>(settingsDocRef);

  const apiKey = settingsData?.openRouterApiKey || null;
  const isLoading = isSettingsLoading || isUserLoading;

  const setApiKey = useCallback(async (key: string | null) => {
    if (!settingsDocRef || !user) {
      console.warn('Cannot save API key: missing settings doc ref or user');
      return;
    }

    try {
      if (key) {
        await setDocumentNonBlocking(
          settingsDocRef,
          {
            openRouterApiKey: key,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } else {
        await updateDocumentNonBlocking(settingsDocRef, {
          openRouterApiKey: deleteField(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Failed to save OpenRouter API key to Firestore', error);
      throw error;
    }
  }, [settingsDocRef, user]);

  const resetApiKey = useCallback(async () => {
    await setApiKey(null);
  }, [setApiKey]);

  return (
    <OpenRouterApiKeyContext.Provider value={{ apiKey, setApiKey, resetApiKey, isLoading }}>
      {children}
    </OpenRouterApiKeyContext.Provider>
  );
}

