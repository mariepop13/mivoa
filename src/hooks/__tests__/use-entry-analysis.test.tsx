import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useEntryAnalysis } from '../use-entry-analysis';
import { OpenRouterApiKeyContext } from '@/context/OpenRouterApiKeyContext';
import { LanguageContext, SUPPORTED_LANGUAGES } from '@/context/LanguageContext';
import { ModelContext } from '@/context/ModelContext';
import * as entryAnalysisService from '@/ai/services/entry-analysis-service';
import type { EntryAnalysis } from '@/ai/types/journal';

vi.mock('@/ai/services/entry-analysis-service');

const mockApiKey = 'test-api-key';
const mockLanguage = 'en';
const mockModel = 'test-model';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <OpenRouterApiKeyContext.Provider value={{ apiKey: mockApiKey, setApiKey: vi.fn(), resetApiKey: vi.fn(), isLoading: false }}>
    <LanguageContext.Provider value={{ language: mockLanguage, setLanguage: vi.fn(), supportedLanguages: SUPPORTED_LANGUAGES }}>
      <ModelContext.Provider value={{ selectedModel: mockModel, setSelectedModel: vi.fn(), isLoading: false }}>
        {children}
      </ModelContext.Provider>
    </LanguageContext.Provider>
  </OpenRouterApiKeyContext.Provider>
);

describe('useEntryAnalysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(entryAnalysisService.analyzeEntry).mockResolvedValue({
      mood: 'happy',
      themes: ['work', 'family'],
      keyTakeaways: ['Important insight'],
      processedAt: new Date(),
    });
  });

  it('analyzes entry content', async () => {
    const { result } = renderHook(() => useEntryAnalysis(), { wrapper });

    const analysis = await result.current.analyze('Test entry content');

    expect(analysis).toEqual({
      mood: 'happy',
      themes: ['work', 'family'],
      keyTakeaways: ['Important insight'],
      processedAt: expect.any(Date),
    });
    expect(entryAnalysisService.analyzeEntry).toHaveBeenCalledWith(
      'Test entry content',
      mockApiKey,
      mockLanguage,
      mockModel
    );
  });

  it('returns null when API key is not configured', async () => {
    const wrapperWithoutKey = ({ children }: { children: React.ReactNode }) => (
      <OpenRouterApiKeyContext.Provider value={{ apiKey: null, setApiKey: vi.fn(), resetApiKey: vi.fn(), isLoading: false }}>
        <LanguageContext.Provider value={{ language: mockLanguage, setLanguage: vi.fn(), supportedLanguages: SUPPORTED_LANGUAGES }}>
          <ModelContext.Provider value={{ selectedModel: mockModel, setSelectedModel: vi.fn(), isLoading: false }}>
            {children}
          </ModelContext.Provider>
        </LanguageContext.Provider>
      </OpenRouterApiKeyContext.Provider>
    );

    const { result } = renderHook(() => useEntryAnalysis(), { wrapper: wrapperWithoutKey });

    const analysis = await result.current.analyze('Test content');

    expect(analysis).toBeNull();
    await waitFor(() => {
      expect(result.current.error).toBe('API key not configured');
    });
  });

  it('returns null for empty content', async () => {
    const { result } = renderHook(() => useEntryAnalysis(), { wrapper });

    const analysis = await result.current.analyze('   ');

    expect(analysis).toBeNull();
    expect(entryAnalysisService.analyzeEntry).not.toHaveBeenCalled();
  });

  it('handles analysis errors', async () => {
    vi.mocked(entryAnalysisService.analyzeEntry).mockRejectedValue(new Error('Analysis failed'));

    const { result } = renderHook(() => useEntryAnalysis(), { wrapper });

    const analysis = await result.current.analyze('Test content');

    expect(analysis).toBeNull();
    await waitFor(() => {
      expect(result.current.error).toBe('Analysis failed');
    });
  });

  it('sets isAnalyzing state during analysis', async () => {
    let resolveAnalysis: (value: EntryAnalysis) => void;
    const analysisPromise = new Promise<EntryAnalysis>((resolve) => {
      resolveAnalysis = resolve;
    });

    vi.mocked(entryAnalysisService.analyzeEntry).mockReturnValue(analysisPromise);

    const { result } = renderHook(() => useEntryAnalysis(), { wrapper });

    const analyzePromise = result.current.analyze('Test content');

    await waitFor(() => {
      expect(result.current.isAnalyzing).toBe(true);
    });

    resolveAnalysis!({
      mood: 'happy',
      themes: [],
      keyTakeaways: [],
      processedAt: new Date(),
    });

    await analyzePromise;

    await waitFor(() => {
      expect(result.current.isAnalyzing).toBe(false);
    });
  });
});

