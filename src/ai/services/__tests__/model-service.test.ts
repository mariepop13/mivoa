import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchAvailableModels, formatPrice, formatContextLength, extractProvider } from '../model-service';

global.fetch = vi.fn();

describe('model-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchAvailableModels', () => {
    it('should fetch and return available models', async () => {
      const mockModels = [
        { id: 'model-1', name: 'Model 1' },
        { id: 'model-2', name: 'Model 2' },
      ];
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ data: mockModels }),
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

      const result = await fetchAvailableModels('test-api-key');

      expect(fetch).toHaveBeenCalledWith('https://openrouter.ai/api/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer test-api-key',
          'Content-Type': 'application/json',
        },
      });
      expect(result).toEqual(mockModels);
    });

    it('should return empty array if data is missing', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({}),
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

      const result = await fetchAvailableModels('test-api-key');

      expect(result).toEqual([]);
    });

    it('should throw error on API failure', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        text: vi.fn().mockResolvedValue('Unauthorized'),
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

      await expect(fetchAvailableModels('test-api-key')).rejects.toThrow('OpenRouter API error: 401 Unauthorized');
    });

    it('should throw error on network failure', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

      await expect(fetchAvailableModels('test-api-key')).rejects.toThrow('Network error');
    });
  });

  describe('formatPrice', () => {
    it('should format price correctly', () => {
      expect(formatPrice('0.001', '0.002')).toBe('$1.000 / $2.000 per 1K tokens');
    });

    it('should format zero price', () => {
      expect(formatPrice('0', '0')).toBe('$0 / $0 per 1K tokens');
    });

    it('should format very small prices', () => {
      expect(formatPrice('0.0005', '0.0003')).toBe('$0.500 / $0.300 per 1K tokens');
    });

    it('should return N/A for invalid prices', () => {
      expect(formatPrice('invalid', '0.001')).toBe('N/A');
      expect(formatPrice('0.001', 'invalid')).toBe('N/A');
      expect(formatPrice('invalid', 'invalid')).toBe('N/A');
    });
  });

  describe('formatContextLength', () => {
    it('should format context length in millions', () => {
      expect(formatContextLength(2000000)).toBe('2.0M tokens');
      expect(formatContextLength(1500000)).toBe('1.5M tokens');
    });

    it('should format context length in thousands', () => {
      expect(formatContextLength(5000)).toBe('5K tokens');
      expect(formatContextLength(10000)).toBe('10K tokens');
    });

    it('should format small context lengths', () => {
      expect(formatContextLength(500)).toBe('500 tokens');
      expect(formatContextLength(100)).toBe('100 tokens');
    });

    it('should return N/A for null context length', () => {
      expect(formatContextLength(null)).toBe('N/A');
    });
  });

  describe('extractProvider', () => {
    it('should extract provider from model ID', () => {
      expect(extractProvider('openai/gpt-4')).toBe('Openai');
      expect(extractProvider('anthropic/claude-3')).toBe('Anthropic');
    });

    it('should capitalize first letter', () => {
      expect(extractProvider('google/gemini')).toBe('Google');
    });

    it('should return Unknown for invalid model ID', () => {
      expect(extractProvider('')).toBe('Unknown');
      expect(extractProvider('/model')).toBe('Unknown');
    });
  });
});

