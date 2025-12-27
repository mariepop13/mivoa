import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateOpenRouterApiKey } from '../openrouter-client';

describe('validateOpenRouterApiKey', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return false for empty string', async () => {
    const result = await validateOpenRouterApiKey('');
    expect(result).toBe(false);
  });

  it('should return false for non-string input', async () => {
    const result = await validateOpenRouterApiKey(null as any);
    expect(result).toBe(false);
  });

  it('should return false for key shorter than 10 characters', async () => {
    const result = await validateOpenRouterApiKey('short');
    expect(result).toBe(false);
  });

  it('should return false for invalid API key', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    } as Response);

    const result = await validateOpenRouterApiKey('invalid-key-1234567890');
    expect(result).toBe(false);
  });

  it('should return false for API key that returns 403', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => 'Forbidden',
    } as Response);

    const result = await validateOpenRouterApiKey('forbidden-key-1234567890');
    expect(result).toBe(false);
  });

  it('should return false when API returns error in response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ error: 'Invalid key' }),
    } as Response);

    const result = await validateOpenRouterApiKey('error-key-1234567890');
    expect(result).toBe(false);
  });

  it('should return false when API response is missing id', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ name: 'test' }),
    } as Response);

    const result = await validateOpenRouterApiKey('missing-id-key-1234567890');
    expect(result).toBe(false);
  });

  it('should return true for valid API key with data.data structure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          label: 'sk-or-v1-test',
          is_provisioning_key: false,
        },
      }),
    } as Response);

    const result = await validateOpenRouterApiKey('valid-key-1234567890');
    expect(result).toBe(true);
  });

  it('should return true for valid API key with data.id structure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'key_1234567890',
        created_at: '2024-01-01T00:00:00Z',
      }),
    } as Response);

    const result = await validateOpenRouterApiKey('valid-key-1234567890');
    expect(result).toBe(true);
  });

  it('should validate real API key from environment variable', async () => {
    const apiKey = process.env.TEST_OPENROUTER_API_KEY;
    
    if (!apiKey) {
      console.log('Skipping real API key test: TEST_OPENROUTER_API_KEY not set in .env.local');
      console.log('To test with a real key, add TEST_OPENROUTER_API_KEY=your-key to .env.local');
      return;
    }

    const result = await validateOpenRouterApiKey(apiKey, false);
    
    expect(result).toBe(true);
  }, 15000);
});

