/* eslint-disable react/display-name */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useJournalPrompts } from '../use-journal-prompts';
import { OpenRouterApiKeyContext } from '@/context/OpenRouterApiKeyContext';
import { LanguageContext, SUPPORTED_LANGUAGES } from '@/context/LanguageContext';
import { ModelContext } from '@/context/ModelContext';
import * as journalPromptService from '@/ai/services/journal-prompt-service';
import type { RecentEntry } from '@/ai/types/journal';

vi.mock('@/ai/services/journal-prompt-service', () => ({
  generateDailyPrompt: vi.fn(),
}));

const mockApiKey = 'test-api-key';
const mockLanguage = 'en';
const mockModel = 'test-model';
const TODAY_KEY = '2024-01-15';

vi.mock('date-fns', async () => {
  const actual = await vi.importActual<typeof import('date-fns')>('date-fns');
  return {
    ...actual,
    format: vi.fn(() => TODAY_KEY),
  };
});

const EMPTY_RECENT_ENTRIES: RecentEntry[] = [];

const createWrapper = (overrides: { apiKey?: string | null } = {}) =>
  ({ children }: { children: React.ReactNode }) => (
    <OpenRouterApiKeyContext.Provider value={{ apiKey: 'apiKey' in overrides ? (overrides.apiKey as string | null) : mockApiKey, setApiKey: vi.fn(), resetApiKey: vi.fn(), isLoading: false }}>
      <LanguageContext.Provider value={{ language: mockLanguage, setLanguage: vi.fn(), supportedLanguages: SUPPORTED_LANGUAGES }}>
        <ModelContext.Provider value={{ selectedModel: mockModel, setSelectedModel: vi.fn(), isLoading: false }}>
          {children}
        </ModelContext.Provider>
      </LanguageContext.Provider>
    </OpenRouterApiKeyContext.Provider>
  );

describe('useJournalPrompts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(journalPromptService.generateDailyPrompt).mockImplementation(
      () => Promise.resolve({
        text: 'Test prompt',
        dateKey: TODAY_KEY,
        generatedAt: new Date(),
      })
    );
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('generates prompt when API key is available', async () => {
    const { result } = renderHook(() => useJournalPrompts(EMPTY_RECENT_ENTRIES), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.prompt).toBe('Test prompt');
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 500 });

    expect(journalPromptService.generateDailyPrompt).toHaveBeenCalled();
  });

  it('returns error when API key is not configured', () => {
    const { result } = renderHook(() => useJournalPrompts(EMPTY_RECENT_ENTRIES), { wrapper: createWrapper({ apiKey: null }) });

    expect(result.current.prompt).toBeNull();
    expect(result.current.error).toBe('API key not configured');
  });

  it('uses cached prompt when available', () => {
    const cachedPrompt = {
      text: 'Cached prompt',
      dateKey: TODAY_KEY,
      generatedAt: new Date().toISOString(),
    };
    localStorage.setItem(`journal_prompt_${TODAY_KEY}`, JSON.stringify(cachedPrompt));

    const { result } = renderHook(() => useJournalPrompts(EMPTY_RECENT_ENTRIES), { wrapper: createWrapper() });

    expect(result.current.prompt).toBe('Cached prompt');
    expect(journalPromptService.generateDailyPrompt).not.toHaveBeenCalled();
  });

  it('regenerates prompt when regenerate is called', async () => {
    const { result } = renderHook(() => useJournalPrompts(EMPTY_RECENT_ENTRIES), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.prompt).toBe('Test prompt');
    }, { timeout: 500 });

    vi.mocked(journalPromptService.generateDailyPrompt).mockImplementation(
      () => Promise.resolve({
        text: 'New prompt',
        dateKey: TODAY_KEY,
        generatedAt: new Date(),
      })
    );

    await act(async () => {
      await result.current.regenerate();
    });

    expect(result.current.prompt).toBe('New prompt');
  });

  it('handles generation errors', async () => {
    vi.mocked(journalPromptService.generateDailyPrompt).mockImplementation(
      () => Promise.reject(new Error('API Error'))
    );

    const { result } = renderHook(() => useJournalPrompts(EMPTY_RECENT_ENTRIES), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.error).toBe('API Error');
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 500 });
  });
});

