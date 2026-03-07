'use client';

import { createContext, ReactNode, useCallback, useContext, useState, useEffect } from 'react';
import { useStorage, useSettings } from '@/repositories/storage-provider';

export const DEFAULT_MODEL = 'google/gemini-3-flash-preview';

interface ModelContextType {
  selectedModel: string;
  setSelectedModel: (modelId: string | null) => Promise<void>;
  isLoading: boolean;
}

export const ModelContext = createContext<ModelContextType>({
  selectedModel: DEFAULT_MODEL,
  setSelectedModel: async () => {},
  isLoading: true,
});

export function ModelProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const { backend, isUserLoading } = useStorage();
  const { data: settingsData, isLoading: isSettingsLoading } = useSettings();

  const persistedModel = settingsData?.selectedModel || DEFAULT_MODEL;
  const [optimisticModel, setOptimisticModel] = useState<string | null>(null);

  useEffect(() => {
    if (settingsData?.selectedModel !== undefined) {
      setOptimisticModel(null);
    }
  }, [settingsData?.selectedModel]);

  const selectedModel = optimisticModel ?? persistedModel;
  const isLoading = isSettingsLoading || isUserLoading;

  const setSelectedModel = useCallback(async (modelId: string | null) => {
    if (!backend) {
      console.warn('Cannot save model: storage backend not available');
      return;
    }

    const modelToUse = modelId || DEFAULT_MODEL;
    setOptimisticModel(modelToUse);

    try {
      await backend.updateSettings({ selectedModel: modelToUse });
    } catch (error) {
      setOptimisticModel(null);
      console.error('Failed to save selected model', error);
      throw error;
    }
  }, [backend]);

  return (
    <ModelContext.Provider value={{ selectedModel, setSelectedModel, isLoading }}>
      {children}
    </ModelContext.Provider>
  );
}

export function useModel(): ModelContextType {
  return useContext(ModelContext);
}
