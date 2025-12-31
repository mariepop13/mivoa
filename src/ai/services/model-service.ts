import type { OpenRouterModel, ModelsResponse } from '../types/model';

const PRICE_MULTIPLIER = 1000;
const TOKENS_PER_K = 1000;
const TOKENS_PER_M = 1000000;
const ZERO_VALUE = 0;
const PRICE_DECIMAL_PLACES = 3;
const CONTEXT_LENGTH_DECIMAL_PLACES = 1;

export async function fetchAvailableModels(apiKey: string): Promise<OpenRouterModel[]> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} ${errorText}`);
    }

    const data: ModelsResponse = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Failed to fetch models from OpenRouter:', error);
    throw error;
  }
}

export function formatPrice(promptPrice: string, completionPrice: string): string {
  const prompt = parseFloat(promptPrice);
  const completion = parseFloat(completionPrice);
  
  if (isNaN(prompt) || isNaN(completion)) {
    return 'N/A';
  }

  const formatPriceValue = (value: number): string => {
    if (value === ZERO_VALUE) return '$0';
    return `$${(value * PRICE_MULTIPLIER).toFixed(PRICE_DECIMAL_PLACES)}`;
  };

  return `${formatPriceValue(prompt)} / ${formatPriceValue(completion)} per 1K tokens`;
}

export function formatContextLength(contextLength: number | null): string {
  if (!contextLength) return 'N/A';
  
  if (contextLength >= TOKENS_PER_M) {
    return `${(contextLength / TOKENS_PER_M).toFixed(CONTEXT_LENGTH_DECIMAL_PLACES)}M tokens`;
  }
  if (contextLength >= TOKENS_PER_K) {
    return `${(contextLength / TOKENS_PER_K).toFixed(ZERO_VALUE)}K tokens`;
  }
  return `${contextLength} tokens`;
}

export function extractProvider(modelId: string): string {
  const parts = modelId.split('/');
  if (parts.length > 0 && parts[0]) {
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  }
  return 'Unknown';
}

