'use client';

import { useState, useEffect, useContext, useCallback } from 'react';
import { LanguageContext } from '@/context/LanguageContext';

interface UseTranslationResult {
  t: (key: string, fallback?: string) => string;
  language: string;
  isLoading: boolean;
  error: Error | null;
}

export function useTranslation(): UseTranslationResult {
  const { language } = useContext(LanguageContext);
  const [translations, setTranslations] = useState<Record<string, unknown>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadTranslations = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const translationsModule = language === 'fr'
          ? await import('@/locales/fr.json')
          : await import('@/locales/en.json');

        setTranslations(translationsModule.default);
      } catch (e) {
        console.error(`Could not load translations for language: ${language}`, e);
        setError(e instanceof Error ? e : new Error('Translation loading failed'));

        try {
          const fallbackModule = await import('@/locales/en.json');
          setTranslations(fallbackModule.default);
        } catch (fallbackError) {
          console.error('Failed to load fallback translations', fallbackError);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadTranslations();
  }, [language]);

  const getNestedValue = useCallback((obj: Record<string, unknown>, path: string): string | undefined => {
    const keys = path.split('.');
    let current: unknown = obj;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && current !== null && !Array.isArray(current)) {
        const record = current as Record<string, unknown>;
        if (key in record) {
          current = record[key];
        } else {
          return undefined;
        }
      } else {
        return undefined;
      }
    }
    
    return typeof current === 'string' ? current : undefined;
  }, []);

  const t = useCallback(
    (key: string, fallback?: string): string => {
      if (key.includes('.')) {
        const nestedValue = getNestedValue(translations, key);
        if (nestedValue) return nestedValue;
      }
      
      const flatValue = translations[key];
      if (typeof flatValue === 'string') return flatValue;
      
      return fallback || key;
    },
    [translations, getNestedValue]
  );

  return { t, language, isLoading, error };
}

