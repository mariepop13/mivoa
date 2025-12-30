import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateTextCompletion, generateChatCompletion } from '../openrouter-client';

global.fetch = vi.fn();

describe('openrouter-client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateTextCompletion', () => {
    it('should generate text completion successfully', async () => {
      const mockResponse = {
        id: 'test-id',
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Test response',
            },
            finish_reason: 'stop',
          },
        ],
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      } as unknown as Response);

      const result = await generateTextCompletion('test prompt', 'test-api-key');

      expect(fetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(result).toBe('Test response');
    });

    it('should use default model when not specified', async () => {
      const mockResponse = {
        id: 'test-id',
        choices: [{ message: { role: 'assistant', content: 'Response' }, finish_reason: 'stop' }],
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      } as unknown as Response);

      await generateTextCompletion('prompt', 'api-key');

      const callArgs = vi.mocked(fetch).mock.calls[0];
      const body = JSON.parse(callArgs[1]?.body as string);
      expect(body.model).toBe('google/gemini-3-flash-preview');
    });

    it('should use custom model when specified', async () => {
      const mockResponse = {
        id: 'test-id',
        choices: [{ message: { role: 'assistant', content: 'Response' }, finish_reason: 'stop' }],
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      } as unknown as Response);

      await generateTextCompletion('prompt', 'api-key', { model: 'custom-model' });

      const callArgs = vi.mocked(fetch).mock.calls[0];
      const body = JSON.parse(callArgs[1]?.body as string);
      expect(body.model).toBe('custom-model');
    });

    it('should use custom temperature and max_tokens', async () => {
      const mockResponse = {
        id: 'test-id',
        choices: [{ message: { role: 'assistant', content: 'Response' }, finish_reason: 'stop' }],
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      } as unknown as Response);

      await generateTextCompletion('prompt', 'api-key', {
        temperature: 0.5,
        max_tokens: 1000,
      });

      const callArgs = vi.mocked(fetch).mock.calls[0];
      const body = JSON.parse(callArgs[1]?.body as string);
      expect(body.temperature).toBe(0.5);
      expect(body.max_tokens).toBe(1000);
    });

    it('should retry on failure', async () => {
      const mockResponse = {
        id: 'test-id',
        choices: [{ message: { role: 'assistant', content: 'Success' }, finish_reason: 'stop' }],
      };

      vi.mocked(fetch)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(mockResponse),
        } as unknown as Response);

      const result = await generateTextCompletion('prompt', 'api-key');

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(result).toBe('Success');
    });

    it('should throw error after max retries', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

      await expect(generateTextCompletion('prompt', 'api-key')).rejects.toThrow('Network error');
      expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('should throw error when response has no choices', async () => {
      const mockResponse = {
        id: 'test-id',
        choices: [],
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      } as unknown as Response);

      await expect(generateTextCompletion('prompt', 'api-key')).rejects.toThrow('No choices in OpenRouter response');
    });

    it('should throw error when response has no content', async () => {
      const mockResponse = {
        id: 'test-id',
        choices: [
          {
            message: {
              role: 'assistant',
              content: '',
            },
            finish_reason: 'stop',
          },
        ],
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      } as unknown as Response);

      await expect(generateTextCompletion('prompt', 'api-key')).rejects.toThrow('No content in OpenRouter response');
    });

    it('should throw error on API error response', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 401,
        text: vi.fn().mockResolvedValue('Unauthorized'),
      } as unknown as Response);

      await expect(generateTextCompletion('prompt', 'api-key')).rejects.toThrow('OpenRouter API error: 401 Unauthorized');
    });
  });

  describe('generateChatCompletion', () => {
    it('should generate chat completion successfully', async () => {
      const mockResponse = {
        id: 'test-id',
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Chat response',
            },
            finish_reason: 'stop',
          },
        ],
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      } as unknown as Response);

      const messages = [
        { role: 'user' as const, content: 'Hello' },
        { role: 'assistant' as const, content: 'Hi' },
      ];

      const result = await generateChatCompletion(messages, 'test-api-key');

      expect(fetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
        })
      );
      expect(result).toBe('Chat response');
    });

    it('should use custom options', async () => {
      const mockResponse = {
        id: 'test-id',
        choices: [{ message: { role: 'assistant', content: 'Response' }, finish_reason: 'stop' }],
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      } as unknown as Response);

      await generateChatCompletion([{ role: 'user', content: 'test' }], 'api-key', {
        model: 'custom-model',
        temperature: 0.9,
        top_p: 0.95,
      });

      const callArgs = vi.mocked(fetch).mock.calls[0];
      const body = JSON.parse(callArgs[1]?.body as string);
      expect(body.model).toBe('custom-model');
      expect(body.temperature).toBe(0.9);
      expect(body.top_p).toBe(0.95);
    });
  });
});

