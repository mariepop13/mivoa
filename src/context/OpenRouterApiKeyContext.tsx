'use client';

import { createContext, ReactNode, useCallback } from 'react';
import { useStorage, useSettings } from '@/repositories/storage-provider';

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

export function OpenRouterApiKeyProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const { backend } = useStorage();
  const { data: settingsData, isLoading } = useSettings();

  const apiKey = settingsData?.openRouterApiKey || null;

  const setApiKey = useCallback(async (key: string | null) => {
    if (!backend) return;

    try {
      await backend.updateSettings({ openRouterApiKey: key ?? undefined });
    } catch (error) {
      console.error('Failed to save OpenRouter API key', error);
      throw error;
    }
  }, [backend]);

  const resetApiKey = useCallback(async () => {
    await setApiKey(null);
  }, [setApiKey]);

  return (
    <OpenRouterApiKeyContext.Provider value={{ apiKey, setApiKey, resetApiKey, isLoading }}>
      {children}
    </OpenRouterApiKeyContext.Provider>
  );
}
