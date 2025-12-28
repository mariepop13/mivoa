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
      ok: true,
      json: async () => ({ valid: false }),
    } as Response);

    const result = await validateOpenRouterApiKey('invalid-key-1234567890');
    expect(result).toBe(false);
    expect(global.fetch).toHaveBeenCalledWith('/api/validate-openrouter', expect.any(Object));
  });

  it('should return false for API key that returns 403', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ valid: false }),
    } as Response);

    const result = await validateOpenRouterApiKey('forbidden-key-1234567890');
    expect(result).toBe(false);
  });

  it('should return false when API returns error in response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ valid: false }),
    } as Response);

    const result = await validateOpenRouterApiKey('error-key-1234567890');
    expect(result).toBe(false);
  });

  it('should return false when API response is missing id', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ valid: false }),
    } as Response);

    const result = await validateOpenRouterApiKey('missing-id-key-1234567890');
    expect(result).toBe(false);
  });

  it('should return true for valid API key with data.data structure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ valid: true }),
    } as Response);

    const result = await validateOpenRouterApiKey('valid-key-1234567890');
    expect(result).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith('/api/validate-openrouter', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        'Content-Type': 'application/json',
      }),
      body: expect.stringContaining('valid-key-1234567890'),
    }));
  });

  it('should return true for valid API key with data.id structure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ valid: true }),
    } as Response);

    const result = await validateOpenRouterApiKey('valid-key-1234567890');
    expect(result).toBe(true);
  });

  it('should handle fetch errors', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const result = await validateOpenRouterApiKey('test-key-1234567890');
    expect(result).toBe(false);
  });
});

