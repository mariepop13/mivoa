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
}

export const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  supportedLanguages: SUPPORTED_LANGUAGES,
});

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps): React.JSX.Element {
  const [language, setLanguageState] = useState<SupportedLanguage>('en');

  useEffect(() => {
    try {
      const storedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (storedLanguage && SUPPORTED_LANGUAGES.includes(storedLanguage as SupportedLanguage)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLanguageState(storedLanguage as SupportedLanguage);
      }
    } catch (error) {
      console.error('Failed to load language from localStorage:', error);
    }
  }, []);

  const setLanguage = useCallback((newLanguage: SupportedLanguage) => {
    if (!SUPPORTED_LANGUAGES.includes(newLanguage)) {
      console.warn(`Unsupported language: ${newLanguage}. Defaulting to 'en'.`);
      newLanguage = 'en';
    }
    
    setLanguageState(newLanguage);
    
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, newLanguage);
    } catch (error) {
      console.error('Failed to save language to localStorage:', error);
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, supportedLanguages: SUPPORTED_LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

