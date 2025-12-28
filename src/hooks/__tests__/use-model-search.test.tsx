import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useModelSearch } from '../use-model-search';
import type { OpenRouterModel } from '@/ai/types/model';

const mockModels: OpenRouterModel[] = [
  {
    id: 'openai/gpt-4',
    canonical_slug: 'openai/gpt-4',
    name: 'GPT-4',
    created: 1234567890,
    description: 'Advanced language model',
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
    per_request_limits: null,
    supported_parameters: [],
    default_parameters: null,
  },
  {
    id: 'anthropic/claude-3',
    canonical_slug: 'anthropic/claude-3',
    name: 'Claude 3',
    created: 1234567890,
    description: 'Anthropic AI assistant',
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
    per_request_limits: null,
    supported_parameters: [],
    default_parameters: null,
  },
  {
    id: 'meta/llama-2',
    canonical_slug: 'meta/llama-2',
    name: 'Llama 2',
    created: 1234567890,
    description: 'Open source model',
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
    per_request_limits: null,
    supported_parameters: [],
    default_parameters: null,
  },
];

describe('useModelSearch', () => {
  it('should return all models when search query is empty', () => {
    const { result } = renderHook(() =>
      useModelSearch({ models: mockModels, searchQuery: '' })
    );

    expect(result.current).toEqual(mockModels);
  });

  it('should return all models when search query is only whitespace', () => {
    const { result } = renderHook(() =>
      useModelSearch({ models: mockModels, searchQuery: '   ' })
    );

    expect(result.current).toEqual(mockModels);
  });

  it('should filter models by name (case insensitive)', () => {
    const { result } = renderHook(() =>
      useModelSearch({ models: mockModels, searchQuery: 'gpt' })
    );

    expect(result.current).toHaveLength(1);
    expect(result.current[0].name).toBe('GPT-4');
  });

  it('should filter models by id (case insensitive)', () => {
    const { result } = renderHook(() =>
      useModelSearch({ models: mockModels, searchQuery: 'ANTHROPIC' })
    );

    expect(result.current).toHaveLength(1);
    expect(result.current[0].id).toBe('anthropic/claude-3');
  });

  it('should filter models by description (case insensitive)', () => {
    const { result } = renderHook(() =>
      useModelSearch({ models: mockModels, searchQuery: 'open source' })
    );

    expect(result.current).toHaveLength(1);
    expect(result.current[0].name).toBe('Llama 2');
  });

  it('should filter models by partial match', () => {
    const { result } = renderHook(() =>
      useModelSearch({ models: mockModels, searchQuery: 'claude' })
    );

    expect(result.current).toHaveLength(1);
    expect(result.current[0].name).toBe('Claude 3');
  });

  it('should return empty array when no models match', () => {
    const { result } = renderHook(() =>
      useModelSearch({ models: mockModels, searchQuery: 'nonexistent' })
    );

    expect(result.current).toEqual([]);
  });

  it('should handle models without description', () => {
    const modelsWithoutDescription: OpenRouterModel[] = [
      {
        ...mockModels[0],
        description: '',
      },
    ];

    const { result } = renderHook(() =>
      useModelSearch({ models: modelsWithoutDescription, searchQuery: 'gpt' })
    );

    expect(result.current).toHaveLength(1);
    expect(result.current[0].name).toBe('GPT-4');
  });

  it('should update filtered results when search query changes', () => {
    const { result, rerender } = renderHook(
      ({ searchQuery }: { searchQuery: string }) =>
        useModelSearch({ models: mockModels, searchQuery }),
      { initialProps: { searchQuery: 'gpt' } }
    );

    expect(result.current).toHaveLength(1);

    act(() => {
      rerender({ searchQuery: 'claude' });
    });

    expect(result.current).toHaveLength(1);
    expect(result.current[0].name).toBe('Claude 3');
  });

  it('should update filtered results when models change', () => {
    const { result, rerender } = renderHook(
      ({ models }: { models: OpenRouterModel[] }) =>
        useModelSearch({ models, searchQuery: 'gpt' }),
      { initialProps: { models: mockModels } }
    );

    expect(result.current).toHaveLength(1);

    const newModels = [mockModels[0]];

    act(() => {
      rerender({ models: newModels });
    });

    expect(result.current).toHaveLength(1);
  });
});

