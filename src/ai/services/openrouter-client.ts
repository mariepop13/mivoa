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

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY_MS = 1000;
const DEFAULT_MODEL = 'anthropic/claude-3.5-sonnet';

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildRequestHeaders(apiKey: string): Record<string, string> {
  return {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : '',
    'X-Title': 'Mivoa Journal',
  };
}

function buildRequestBody(
  messages: OpenRouterMessage[],
  options: OpenRouterCompletionOptions
): Record<string, unknown> {
  const model = options.model || DEFAULT_MODEL;
  return {
    model,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.max_tokens ?? 4000,
    top_p: options.top_p ?? 1,
  };
}

function parseApiResponse(data: OpenRouterResponse): string {
  if (!data.choices || data.choices.length === 0) {
    throw new Error('No choices in OpenRouter response');
  }

  const content = data.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No content in OpenRouter response');
  }

  return content;
}

async function makeApiRequest(
  url: string,
  headers: Record<string, string>,
  body: Record<string, unknown>
): Promise<OpenRouterResponse> {
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} ${errorText}`);
  }

  return response.json();
}

async function callOpenRouterAPI(
  messages: OpenRouterMessage[],
  apiKey: string,
  options: OpenRouterCompletionOptions = {}
): Promise<string> {
  const url = 'https://openrouter.ai/api/v1/chat/completions';
  const headers = buildRequestHeaders(apiKey);
  const requestBody = buildRequestBody(messages, options);

  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < DEFAULT_MAX_RETRIES; attempt++) {
    try {
      const data = await makeApiRequest(url, headers, requestBody);
      return parseApiResponse(data);
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

