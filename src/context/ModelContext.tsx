'use client';

import { createContext, ReactNode, useCallback, useMemo, useContext, useState, useEffect } from 'react';
import { useUser, useFirestore, useDoc, setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp, deleteField } from 'firebase/firestore';

const DEFAULT_MODEL = 'google/gemini-3-flash-preview';

interface UserSettings extends Record<string, unknown> {
  openRouterApiKey?: string;
  selectedModel?: string;
  updatedAt?: unknown;
}

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

export function ModelProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: isUserLoading } = useUser();
  const firestore = useFirestore();

  const settingsDocRef = useMemo(() => {
    if (!firestore || !user) return null;
    return doc(firestore, `users/${user.uid}/settings/api`);
  }, [firestore, user]);

  const { data: settingsData, isLoading: isSettingsLoading } = useDoc<UserSettings>(settingsDocRef);

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
    if (!settingsDocRef || !user) {
      console.warn('Cannot save model: missing settings doc ref or user');
      return;
    }

    const modelToUse = modelId || DEFAULT_MODEL;
    setOptimisticModel(modelToUse);

    try {
      if (modelId) {
        await setDocumentNonBlocking(
          settingsDocRef,
          {
            selectedModel: modelId,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } else {
        await updateDocumentNonBlocking(settingsDocRef, {
          selectedModel: deleteField(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      setOptimisticModel(null);
      console.error('Failed to save selected model to Firestore', error);
      throw error;
    }
  }, [settingsDocRef, user]);

  return (
    <ModelContext.Provider value={{ selectedModel, setSelectedModel, isLoading }}>
      {children}
    </ModelContext.Provider>
  );
}

export function useModel() {
  return useContext(ModelContext);
}

