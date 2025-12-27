import { OpenRouter } from '@openrouter/sdk';

let clientInstance: OpenRouter | null = null;
let lastApiKey: string | null = null;

export function getOpenRouterClient(apiKey: string): OpenRouter {
  if (!clientInstance || lastApiKey !== apiKey) {
    clientInstance = new OpenRouter({
      apiKey,
    });
    lastApiKey = apiKey;
  }
  return clientInstance;
}

export async function validateOpenRouterApiKey(apiKey: string, debug = false): Promise<boolean> {
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }

  const trimmedKey = apiKey.trim();
  
  if (trimmedKey.length < 10) {
    return false;
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/key', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${trimmedKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return false;
      }
      const errorText = await response.text();
      if (debug) {
        console.error('OpenRouter API validation failed:', response.status, errorText);
      }
      return false;
    }

    const data = await response.json();
    if (debug) {
      console.log('[DEBUG] Response data:', JSON.stringify(data, null, 2));
    }
    
    if (!data || typeof data !== 'object') {
      return false;
    }

    if (data.error) {
      if (debug) {
        console.error('OpenRouter API returned an error:', data.error);
      }
      return false;
    }

    if (data.data && typeof data.data === 'object') {
      return true;
    }

    if (data.id && typeof data.id === 'string') {
      return true;
    }

    return false;
  } catch (error) {
    if (debug) {
      console.error('OpenRouter API key validation failed:', error);
    }
    return false;
  }
}

