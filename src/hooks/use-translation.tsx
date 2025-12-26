'use client';

import { useState, useEffect, useContext, useCallback } from 'react';
import { LanguageContext } from '@/context/LanguageContext';

interface UseTranslationOptions {
  namespace?: string;
}

export function useTranslation(options: UseTranslationOptions = {}) {
  const { language } = useContext(LanguageContext);
  const namespace = options?.namespace;
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadTranslations = async () => {
      setIsLoading(true);
      setError(null);

      try {
        let translationsModule;

        if (namespace) {
          if (language === 'fr') {
            translationsModule = await import(`../locales/${namespace}/fr.json`);
          } else {
            translationsModule = await import(`../locales/${namespace}/en.json`);
          }
        } else {
          if (language === 'fr') {
            translationsModule = await import('@/locales/fr.json');
          } else {
            translationsModule = await import('@/locales/en.json');
          }
        }

        setTranslations(translationsModule.default);
      } catch (e) {
        console.error(`Could not load translations for language: ${language}`, e);
        setError(e instanceof Error ? e : new Error('Translation loading failed'));

        try {
          let fallbackModule;
          if (namespace) {
            fallbackModule = await import(`../locales/${namespace}/en.json`);
          } else {
            fallbackModule = await import('@/locales/en.json');
          }
          setTranslations(fallbackModule.default);
        } catch (fallbackError) {
          console.error('Failed to load fallback translations', fallbackError);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadTranslations();
  }, [language, namespace]);

  const t = useCallback((key: string, fallback?: string): string => {
    return translations[key] || fallback || key;
  }, [translations]);

  return { t, language, isLoading, error };
}

