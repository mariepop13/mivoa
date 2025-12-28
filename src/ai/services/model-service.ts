import type { OpenRouterModel, ModelsResponse } from '../types/model';

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
    if (value === 0) return '$0';
    return `$${(value * 1000).toFixed(3)}`;
  };

  return `${formatPriceValue(prompt)} / ${formatPriceValue(completion)} per 1K tokens`;
}

export function formatContextLength(contextLength: number | null): string {
  if (!contextLength) return 'N/A';
  
  if (contextLength >= 1000000) {
    return `${(contextLength / 1000000).toFixed(1)}M tokens`;
  }
  if (contextLength >= 1000) {
    return `${(contextLength / 1000).toFixed(0)}K tokens`;
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

