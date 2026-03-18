'use client';

import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';

export const SUPPORTED_LANGUAGES = ['en', 'fr'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  en: 'English',
  fr: 'Français',
};

const LANGUAGE_STORAGE_KEY = 'mivoa-language';

export interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
  supportedLanguages: readonly SupportedLanguage[];
  t: (key: string, fallback?: string) => string;
  isLoading: boolean;
  error: Error | null;
}

const defaultT = (key: string, fallback?: string) => fallback ?? key;

export const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  supportedLanguages: SUPPORTED_LANGUAGES,
  t: defaultT,
  isLoading: true,
  error: null,
});

interface LanguageProviderProps {
  children: ReactNode;
}

function getNestedValue(obj: Record<string, unknown>, path: string): string | undefined {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current && typeof current === 'object' && !Array.isArray(current)) {
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
}

export function LanguageProvider({ children }: LanguageProviderProps): React.JSX.Element {
  const [language, setLanguageState] = useState<SupportedLanguage>('en');
  const [translations, setTranslations] = useState<Record<string, unknown>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    try {
      const storedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (storedLanguage && SUPPORTED_LANGUAGES.includes(storedLanguage as SupportedLanguage)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLanguageState(storedLanguage as SupportedLanguage);
      }
    } catch (err) {
      console.error('Failed to load language from localStorage:', err);
    }
  }, []);

  useEffect(() => {
    let isActive = true;
    const loadTranslations = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const module = language === 'fr'
          ? await import('@/locales/fr.json')
          : await import('@/locales/en.json');
        if (!isActive) return;
        setTranslations(module.default);
      } catch (e) {
        if (!isActive) return;
        console.error(`Could not load translations for language: ${language}`, e);
        setError(e instanceof Error ? e : new Error('Translation loading failed'));

        try {
          const fallbackModule = await import('@/locales/en.json');
          if (!isActive) return;
          setTranslations(fallbackModule.default);
        } catch (fallbackError) {
          console.error('Failed to load fallback translations', fallbackError);
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    loadTranslations();
    return () => { isActive = false; };
  }, [language]);

  const setLanguage = useCallback((newLanguage: SupportedLanguage) => {
    if (!SUPPORTED_LANGUAGES.includes(newLanguage)) {
      console.warn(`Unsupported language: ${newLanguage}. Defaulting to 'en'.`);
      newLanguage = 'en';
    }

    setLanguageState(newLanguage);

    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, newLanguage);
    } catch (err) {
      console.error('Failed to save language to localStorage:', err);
    }
  }, []);

  const t = useCallback(
    (key: string, fallback?: string): string => {
      if (key.includes('.')) {
        const nestedValue = getNestedValue(translations, key);
        if (nestedValue) return nestedValue;
      }

      const flatValue = translations[key];
      if (typeof flatValue === 'string') return flatValue;

      return fallback ?? key;
    },
    [translations]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, supportedLanguages: SUPPORTED_LANGUAGES, t, isLoading, error }}>
      {children}
    </LanguageContext.Provider>
  );
}
