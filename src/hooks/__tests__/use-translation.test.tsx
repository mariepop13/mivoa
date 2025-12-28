import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTranslation } from '../use-translation';
import { LanguageContext } from '@/context/LanguageContext';

vi.mock('@/locales/en.json', () => ({
  default: {
    hello: 'Hello',
    world: 'World',
  },
}));

vi.mock('@/locales/fr.json', () => ({
  default: {
    hello: 'Bonjour',
    world: 'Monde',
  },
}));

describe('useTranslation', () => {
  const mockSetLanguage = vi.fn();

  const renderWithLanguage = (language: 'en' | 'fr') => renderHook(() => useTranslation(), {
      wrapper: ({ children }) => (
        <LanguageContext.Provider
          value={{
            language,
            setLanguage: mockSetLanguage,
            supportedLanguages: ['en', 'fr'],
          }}
        >
          {children}
        </LanguageContext.Provider>
      ),
    });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should load English translations when language is en', async () => {
    const { result } = renderWithLanguage('en');

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.t('hello')).toBe('Hello');
    expect(result.current.t('world')).toBe('World');
    expect(result.current.language).toBe('en');
  });

  it('should load French translations when language is fr', async () => {
    const { result } = renderWithLanguage('fr');

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.t('hello')).toBe('Bonjour');
    expect(result.current.t('world')).toBe('Monde');
    expect(result.current.language).toBe('fr');
  });

  it('should return key when translation is not found', async () => {
    const { result } = renderWithLanguage('en');

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.t('nonexistent')).toBe('nonexistent');
  });

  it('should return fallback when translation is not found and fallback is provided', async () => {
    const { result } = renderWithLanguage('en');

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.t('nonexistent', 'Fallback text')).toBe('Fallback text');
  });

  it('should be loading initially', () => {
    const { result } = renderWithLanguage('en');

    expect(result.current.isLoading).toBe(true);
  });

});

