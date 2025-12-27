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

export async function validateOpenRouterApiKey(apiKey: string): Promise<boolean> {
  try {
    const client = new OpenRouter({
      apiKey,
    });
    
    await client.apiKeys.getCurrentKeyMetadata();
    return true;
  } catch (error) {
    console.error('OpenRouter API key validation failed:', error);
    return false;
  }
}

