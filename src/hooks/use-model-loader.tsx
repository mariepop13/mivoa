import { useState, useEffect, useCallback, useContext } from 'react';
import { OpenRouterApiKeyContext } from '@/context/OpenRouterApiKeyContext';
import { useTranslation } from '@/hooks/use-translation';
import { fetchAvailableModels } from '@/ai/services/model-service';
import type { OpenRouterModel } from '@/ai/types/model';

interface UseModelLoaderResult {
  models: OpenRouterModel[];
  isLoading: boolean;
  error: string | null;
  loadModels: () => Promise<void>;
}

export function useModelLoader(shouldLoad: boolean): UseModelLoaderResult {
  const { apiKey } = useContext(OpenRouterApiKeyContext);
  const { t } = useTranslation();
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadModels = useCallback(async () => {
    if (!apiKey) return;

    setIsLoading(true);
    setError(null);
    try {
      const fetchedModels = await fetchAvailableModels(apiKey);
      setModels(fetchedModels);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('errorLoadingModels');
      setError(errorMessage);
      console.error('Failed to load models:', err);
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, t]);

  useEffect(() => {
    if (shouldLoad && apiKey && models.length === 0 && !isLoading) {
      loadModels();
    }
  }, [shouldLoad, apiKey, loadModels, models.length, isLoading]);

  return {
    models,
    isLoading,
    error,
    loadModels,
  };
}

