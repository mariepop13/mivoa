import { useMemo } from 'react';
import type { OpenRouterModel } from '@/ai/types/model';

interface UseModelSearchParams {
  models: OpenRouterModel[];
  searchQuery: string;
}

export function useModelSearch({ models, searchQuery }: UseModelSearchParams): OpenRouterModel[] {
  const filteredModels = useMemo(() => {
    if (!searchQuery.trim()) return models;

    const query = searchQuery.toLowerCase();
    return models.filter(
      (model) =>
        model.name.toLowerCase().includes(query) ||
        model.id.toLowerCase().includes(query) ||
        model.description?.toLowerCase().includes(query)
    );
  }, [models, searchQuery]);

  return filteredModels;
}

