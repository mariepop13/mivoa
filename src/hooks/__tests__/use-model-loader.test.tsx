import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useModelLoader } from '../use-model-loader';
import { OpenRouterApiKeyContext } from '@/context/OpenRouterApiKeyContext';
import { LanguageContext, SUPPORTED_LANGUAGES } from '@/context/LanguageContext';
import { ModelContext } from '@/context/ModelContext';
import * as modelService from '@/ai/services/model-service';
import type { OpenRouterModel } from '@/ai/types/model';

vi.mock('@/ai/services/model-service', () => ({
  fetchAvailableModels: vi.fn(),
}));

vi.mock('@/locales/en.json', () => ({
  default: {
    errorLoadingModels: 'Error loading models',
  },
}));

const mockModels: OpenRouterModel[] = [
  {
    id: 'model-1',
    name: 'Test Model 1',
    description: 'Test description',
    pricing: {
      prompt: '0.001',
      completion: '0.002',
      request: '0.0001',
      image: '0.0001',
    },
    context_length: 4096,
    architecture: {
      modality: 'text',
      input_modalities: ['text'],
      output_modalities: ['text'],
      tokenizer: 'gpt2',
      instruct_type: 'none',
    },
    top_provider: {
      max_completion_tokens: null,
      is_moderated: false,
      context_length: 4096,
    },
    canonical_slug: 'test-model',
    created: 1234567890,
    per_request_limits: null,
    supported_parameters: [],
    default_parameters: null,
  },
];

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <OpenRouterApiKeyContext.Provider
    value={{
      apiKey: 'test-api-key',
      setApiKey: vi.fn(),
      resetApiKey: vi.fn(),
      isLoading: false,
    }}
  >
    <LanguageContext.Provider
      value={{
        language: 'en',
        setLanguage: vi.fn(),
        supportedLanguages: SUPPORTED_LANGUAGES,
      }}
    >
      <ModelContext.Provider
        value={{
          selectedModel: 'model-1',
          setSelectedModel: vi.fn(),
          isLoading: false,
        }}
      >
        {children}
      </ModelContext.Provider>
    </LanguageContext.Provider>
  </OpenRouterApiKeyContext.Provider>
);

describe('useModelLoader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(modelService.fetchAvailableModels).mockResolvedValue(mockModels);
  });

  it('should load models when shouldLoad is true and apiKey is available', async () => {
    const { result } = renderHook(() => useModelLoader(true), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.models).toEqual(mockModels);
    expect(result.current.error).toBeNull();
    expect(modelService.fetchAvailableModels).toHaveBeenCalledWith('test-api-key');
  });

  it('should not load models when shouldLoad is false', async () => {
    const { result } = renderHook(() => useModelLoader(false), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 500 });

    expect(result.current.models).toEqual([]);
    expect(modelService.fetchAvailableModels).not.toHaveBeenCalled();
  });

  it('should not load models when apiKey is missing', () => {
    const wrapperWithoutKey = ({ children }: { children: React.ReactNode }) => (
      <OpenRouterApiKeyContext.Provider
        value={{
          apiKey: null,
          setApiKey: vi.fn(),
          resetApiKey: vi.fn(),
          isLoading: false,
        }}
      >
        <LanguageContext.Provider
          value={{
            language: 'en',
            setLanguage: vi.fn(),
            supportedLanguages: SUPPORTED_LANGUAGES,
          }}
        >
          <ModelContext.Provider
            value={{
              selectedModel: 'model-1',
              setSelectedModel: vi.fn(),
              isLoading: false,
            }}
          >
            {children}
          </ModelContext.Provider>
        </LanguageContext.Provider>
      </OpenRouterApiKeyContext.Provider>
    );

    const { result } = renderHook(() => useModelLoader(true), { wrapper: wrapperWithoutKey });

    expect(result.current.models).toEqual([]);
    expect(modelService.fetchAvailableModels).not.toHaveBeenCalled();
  });

  it('should handle errors when loading models fails', async () => {
    const error = new Error('Failed to fetch models');
    vi.mocked(modelService.fetchAvailableModels).mockRejectedValue(error);

    const { result } = renderHook(() => useModelLoader(true), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch models');
    expect(result.current.models).toEqual([]);
  });

  it('should use translation for error message when error is not an Error instance', async () => {
    vi.mocked(modelService.fetchAvailableModels).mockRejectedValue('String error');

    const { result } = renderHook(() => useModelLoader(true), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Error loading models');
  });

  it('should allow manual loading via loadModels', async () => {
    const { result } = renderHook(() => useModelLoader(false), { wrapper });

    await act(async () => {
      await result.current.loadModels();
    });

    expect(result.current.models).toEqual(mockModels);
    expect(modelService.fetchAvailableModels).toHaveBeenCalledWith('test-api-key');
  });

  it('should not load models when models already exist', async () => {
    const { result, rerender } = renderHook(
      ({ shouldLoad }: { shouldLoad: boolean }) => useModelLoader(shouldLoad),
      { wrapper, initialProps: { shouldLoad: true } }
    );

    await waitFor(() => {
      expect(result.current.models.length).toBeGreaterThan(0);
    });

    vi.clearAllMocks();

    rerender({ shouldLoad: true });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 500 });

    expect(modelService.fetchAvailableModels).not.toHaveBeenCalled();
  });
});

