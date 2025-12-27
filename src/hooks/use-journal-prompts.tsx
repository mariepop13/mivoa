import { useState, useEffect, useCallback, useContext } from 'react';
import { OpenRouterApiKeyContext } from '@/context/OpenRouterApiKeyContext';
import { LanguageContext } from '@/context/LanguageContext';
import { generateDailyPrompt } from '@/ai/services/journal-prompt-service';
import type { JournalPrompt, RecentEntry } from '@/ai/types/journal';
import { format } from 'date-fns';

const PROMPT_CACHE_KEY_PREFIX = 'journal_prompt_';

interface UseJournalPromptsResult {
  prompt: string | null;
  isLoading: boolean;
  error: string | null;
  regenerate: () => Promise<void>;
}

function getCachedPrompt(dateKey: string): JournalPrompt | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const cached = localStorage.getItem(`${PROMPT_CACHE_KEY_PREFIX}${dateKey}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      parsed.generatedAt = new Date(parsed.generatedAt);
      return parsed;
    }
  } catch (error) {
    console.error('Failed to read cached prompt:', error);
  }
  
  return null;
}

function setCachedPrompt(prompt: JournalPrompt): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(`${PROMPT_CACHE_KEY_PREFIX}${prompt.dateKey}`, JSON.stringify(prompt));
  } catch (error) {
    console.error('Failed to cache prompt:', error);
  }
}

export function useJournalPrompts(recentEntries: RecentEntry[] = []): UseJournalPromptsResult {
  const { apiKey } = useContext(OpenRouterApiKeyContext);
  const { language } = useContext(LanguageContext);
  const [prompt, setPrompt] = useState<JournalPrompt | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dateKey = format(new Date(), 'yyyy-MM-dd');
  const lang = (language || 'en') as 'en' | 'fr';

  const generatePrompt = useCallback(async () => {
    if (!apiKey) {
      setError('API key not configured');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const generated = await generateDailyPrompt(apiKey, recentEntries, lang);
      setPrompt(generated);
      setCachedPrompt(generated);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate prompt';
      setError(message);
      console.error('Failed to generate journal prompt:', err);
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, recentEntries, lang]);

  useEffect(() => {
    if (!apiKey) {
      setPrompt(null);
      return;
    }

    const cached = getCachedPrompt(dateKey);
    if (cached && cached.dateKey === dateKey) {
      setPrompt(cached);
    } else {
      generatePrompt();
    }
  }, [apiKey, dateKey, generatePrompt]);

  return {
    prompt: prompt?.text || null,
    isLoading,
    error,
    regenerate: generatePrompt,
  };
}

