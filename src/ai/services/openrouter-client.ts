interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface OpenRouterCompletionOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
}

interface OpenRouterResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

const DEFAULT_MODEL = 'anthropic/claude-3.5-sonnet';
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY_MS = 1000;

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callOpenRouterAPI(
  messages: OpenRouterMessage[],
  apiKey: string,
  options: OpenRouterCompletionOptions = {}
): Promise<string> {
  const model = options.model || DEFAULT_MODEL;
  const url = 'https://openrouter.ai/api/v1/chat/completions';

  const requestBody = {
    model,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.max_tokens ?? 4000,
    top_p: options.top_p ?? 1,
  };

  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < DEFAULT_MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : '',
          'X-Title': 'Mivoa Journal',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} ${errorText}`);
      }

      const data: OpenRouterResponse = await response.json();

      if (!data.choices || data.choices.length === 0) {
        throw new Error('No choices in OpenRouter response');
      }

      const content = data.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content in OpenRouter response');
      }

      return content;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < DEFAULT_MAX_RETRIES - 1) {
        const delayMs = DEFAULT_RETRY_DELAY_MS * (2 ** attempt);
        await delay(delayMs);
      }
    }
  }

  throw lastError || new Error('Failed to call OpenRouter API');
}

export async function generateTextCompletion(
  prompt: string,
  apiKey: string,
  options: OpenRouterCompletionOptions = {}
): Promise<string> {
  const messages: OpenRouterMessage[] = [
    { role: 'user', content: prompt }
  ];

  return callOpenRouterAPI(messages, apiKey, options);
}

export async function generateChatCompletion(
  messages: OpenRouterMessage[],
  apiKey: string,
  options: OpenRouterCompletionOptions = {}
): Promise<string> {
  return callOpenRouterAPI(messages, apiKey, options);
}

