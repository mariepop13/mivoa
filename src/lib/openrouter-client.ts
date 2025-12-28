const MIN_API_KEY_LENGTH = 10;

function isValidApiKeyFormat(apiKey: string): boolean {
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }
  return apiKey.trim().length >= MIN_API_KEY_LENGTH;
}

export async function validateOpenRouterApiKey(apiKey: string, debug = false): Promise<boolean> {
  if (!isValidApiKeyFormat(apiKey)) {
    return false;
  }

  const trimmedKey = apiKey.trim();

  try {
    const response = await fetch('/api/validate-openrouter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ apiKey: trimmedKey }),
    });

    if (!response.ok) {
      if (debug) {
        console.error('OpenRouter API key validation request failed:', response.status);
      }
      return false;
    }

    const result = await response.json();
    return result.valid === true;
  } catch (error) {
    if (debug) {
      console.error('OpenRouter API key validation failed:', error);
    }
    return false;
  }
}

