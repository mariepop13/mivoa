import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SettingsMenu } from '../settings-menu';
import { useTheme } from 'next-themes';
import { LanguageContext, SUPPORTED_LANGUAGES } from '@/context/LanguageContext';
import { OpenRouterApiKeyContext } from '@/context/OpenRouterApiKeyContext';
import { ModelContext } from '@/context/ModelContext';
import { SubscriptionProvider } from '@/context/SubscriptionContext';

vi.mock('next-themes', () => ({
  useTheme: vi.fn(),
}));

vi.mock('@/hooks/use-translation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/firebase', () => ({
  useFirestore: vi.fn(() => ({ id: 'mock-firestore' })),
  useUser: vi.fn(() => ({ user: { uid: 'test-user' }, isLoading: false, error: null })),
  useDoc: vi.fn(() => ({ data: { plan: 'free', status: 'free' }, isLoading: false, error: null })),
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({ id: 'mock-doc' })),
}));

const mockSetTheme = vi.fn();
const mockSetLanguage = vi.fn();
const mockSetApiKey = vi.fn();
const mockSetSelectedModel = vi.fn();

const renderWithContext = (overrides = {}) => {
  const defaultContexts = {
    theme: { theme: 'light', setTheme: mockSetTheme },
    language: { language: 'en', setLanguage: mockSetLanguage },
    apiKey: { apiKey: 'test-key', setApiKey: mockSetApiKey },
    model: { selectedModel: 'test-model', setSelectedModel: mockSetSelectedModel },
    ...overrides,
  };

  return render(
    <SubscriptionProvider>
      <LanguageContext.Provider
        value={{
          language: defaultContexts.language.language as 'en' | 'fr',
          setLanguage: defaultContexts.language.setLanguage,
          supportedLanguages: SUPPORTED_LANGUAGES,
        }}
      >
        <OpenRouterApiKeyContext.Provider
          value={{
            apiKey: defaultContexts.apiKey.apiKey,
            setApiKey: defaultContexts.apiKey.setApiKey,
            resetApiKey: vi.fn(),
            isLoading: false,
          }}
        >
          <ModelContext.Provider
            value={{
              selectedModel: defaultContexts.model.selectedModel,
              setSelectedModel: defaultContexts.model.setSelectedModel,
              isLoading: false,
            }}
          >
            <SettingsMenu />
          </ModelContext.Provider>
        </OpenRouterApiKeyContext.Provider>
      </LanguageContext.Provider>
    </SubscriptionProvider>
  );
};

describe('SettingsMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTheme).mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
      themes: ['light', 'dark', 'system'],
      systemTheme: 'light',
      resolvedTheme: 'light',
    });
  });

  it('renders settings menu button', () => {
    renderWithContext();
    const button = screen.getByRole('button', { name: /settings/i });
    expect(button).toBeInTheDocument();
  });
});

