import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LanguageProvider, LanguageContext, SUPPORTED_LANGUAGES, LANGUAGE_LABELS, type LanguageContextType } from '../LanguageContext';

const LANGUAGE_STORAGE_KEY = 'mivoa-language';

describe('LanguageContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should provide default language as en', () => {
    const contextValueRef = { current: null as LanguageContextType | null };

    render(
      <LanguageProvider>
        <LanguageContext.Consumer>
          {(value: LanguageContextType) => {
            contextValueRef.current = value;
            return <div>{value.language}</div>;
          }}
        </LanguageContext.Consumer>
      </LanguageProvider>
    );

    expect(contextValueRef.current).not.toBeNull();
    expect(contextValueRef.current!.language).toBe('en');
  });

  it('should load language from localStorage on mount', () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'fr');

    const contextValueRef = { current: null as LanguageContextType | null };

    render(
      <LanguageProvider>
        <LanguageContext.Consumer>
          {(value: LanguageContextType) => {
            contextValueRef.current = value;
            return <div>{value.language}</div>;
          }}
        </LanguageContext.Consumer>
      </LanguageProvider>
    );

    expect(contextValueRef.current).not.toBeNull();
    expect(contextValueRef.current!.language).toBe('fr');
  });

  it('should ignore invalid language from localStorage', () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'invalid');

    const contextValueRef = { current: null as LanguageContextType | null };

    render(
      <LanguageProvider>
        <LanguageContext.Consumer>
          {(value: LanguageContextType) => {
            contextValueRef.current = value;
            return <div>{value.language}</div>;
          }}
        </LanguageContext.Consumer>
      </LanguageProvider>
    );

    expect(contextValueRef.current).not.toBeNull();
    expect(contextValueRef.current!.language).toBe('en');
  });

  it('should update language and save to localStorage', async () => {
    const user = userEvent.setup();
     
    const contextValueRef = { current: null as LanguageContextType | null };

    const TestComponent = () => (
        <LanguageContext.Consumer>
          {(value: LanguageContextType) => {
            // eslint-disable-next-line react-hooks/immutability
            contextValueRef.current = value;
            return (
              <button onClick={() => value.setLanguage('fr')}>
                {value.language}
              </button>
            );
          }}
        </LanguageContext.Consumer>
      );

    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );

    expect(contextValueRef.current).not.toBeNull();
    expect(contextValueRef.current!.language).toBe('en');

    const button = screen.getByRole('button');
    await act(async () => {
      await user.click(button);
    });

    expect(contextValueRef.current!.language).toBe('fr');
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('fr');
  });

  it('should default to en for unsupported language', async () => {
    const user = userEvent.setup();
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
     
    const contextValueRef = { current: null as LanguageContextType | null };

    const TestComponent = () => (
        <LanguageContext.Consumer>
          {(value: LanguageContextType) => {
            // eslint-disable-next-line react-hooks/immutability
            contextValueRef.current = value;
            return (
              <button onClick={() => value.setLanguage('invalid' as 'en' | 'fr')}>
                {value.language}
              </button>
            );
          }}
        </LanguageContext.Consumer>
      );

    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );

    const button = screen.getByRole('button');
    await act(async () => {
      await user.click(button);
    });

    expect(contextValueRef.current!.language).toBe('en');
    expect(consoleWarnSpy).toHaveBeenCalledWith("Unsupported language: invalid. Defaulting to 'en'.");

    consoleWarnSpy.mockRestore();
  });


  it('should export SUPPORTED_LANGUAGES constant', () => {
    expect(SUPPORTED_LANGUAGES).toEqual(['en', 'fr']);
  });

  it('should export LANGUAGE_LABELS constant', () => {
    expect(LANGUAGE_LABELS).toEqual({
      en: 'English',
      fr: 'Français',
    });
  });
});

