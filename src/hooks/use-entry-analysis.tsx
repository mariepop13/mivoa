import { useState, useCallback, useContext } from 'react';
import { OpenRouterApiKeyContext } from '@/context/OpenRouterApiKeyContext';
import { LanguageContext } from '@/context/LanguageContext';
import { useModel } from '@/context/ModelContext';
import { analyzeEntry } from '@/ai/services/entry-analysis-service';
import type { EntryAnalysis } from '@/ai/types/journal';

export interface UseEntryAnalysisResult {
  analyze: (entryContent: string) => Promise<EntryAnalysis | null>;
  isAnalyzing: boolean;
  error: string | null;
}

export function useEntryAnalysis(): UseEntryAnalysisResult {
  const { apiKey } = useContext(OpenRouterApiKeyContext);
  const { language } = useContext(LanguageContext);
  const { selectedModel } = useModel();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lang = (language || 'en') as 'en' | 'fr';

  const analyze = useCallback(async (entryContent: string): Promise<EntryAnalysis | null> => {
    if (!apiKey) {
      setError('API key not configured');
      return null;
    }

    if (!entryContent.trim()) {
      return null;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const analysis = await analyzeEntry(entryContent, apiKey, lang, selectedModel);
      return analysis;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to analyze entry';
      setError(message);
      console.error('Failed to analyze entry:', err);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [apiKey, lang, selectedModel]);

  return {
    analyze,
    isAnalyzing,
    error,
  };
}

