'use client';

import { useContext } from 'react';
import { LanguageContext } from '@/context/LanguageContext';

interface UseTranslationResult {
  t: (key: string, fallback?: string) => string;
  language: string;
  isLoading: boolean;
  error: Error | null;
}

export function useTranslation(): UseTranslationResult {
  const { language, t, isLoading, error } = useContext(LanguageContext);
  return { t, language, isLoading, error };
}
