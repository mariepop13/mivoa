import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendChatMessage, generateInitialMessage } from '../chat-service';
import * as openrouterClient from '../openrouter-client';

vi.mock('../openrouter-client');

describe('chat-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendChatMessage', () => {
    it('sends message with correct options', async () => {
      const mockResponse = 'AI response';
      vi.spyOn(openrouterClient, 'generateChatCompletion').mockResolvedValue(mockResponse);

      const options = {
        conversationHistory: [],
        userMessage: 'Hello',
        apiKey: 'test-key',
        language: 'en' as const,
        model: 'test-model',
      };

      const result = await sendChatMessage(options);

      expect(openrouterClient.generateChatCompletion).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ role: 'system' }),
          expect.objectContaining({ role: 'user', content: 'Hello' }),
        ]),
        'test-key',
        expect.objectContaining({
          model: 'test-model',
          temperature: 0.8,
          max_tokens: 1000,
        })
      );
      expect(result).toBe(mockResponse.trim());
    });

    it('includes conversation history in messages', async () => {
      vi.spyOn(openrouterClient, 'generateChatCompletion').mockResolvedValue('Response');

      const options = {
        conversationHistory: [
          { role: 'user' as const, content: 'First message', timestamp: new Date() },
          { role: 'assistant' as const, content: 'First response', timestamp: new Date() },
        ],
        userMessage: 'Second message',
        apiKey: 'test-key',
        language: 'en' as const,
      };

      await sendChatMessage(options);

      expect(openrouterClient.generateChatCompletion).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ role: 'system' }),
          expect.objectContaining({ role: 'user', content: 'First message' }),
          expect.objectContaining({ role: 'assistant', content: 'First response' }),
          expect.objectContaining({ role: 'user', content: 'Second message' }),
        ]),
        'test-key',
        expect.any(Object)
      );
    });

    it('uses French system prompt when language is fr', async () => {
      vi.spyOn(openrouterClient, 'generateChatCompletion').mockResolvedValue('Response');

      const options = {
        conversationHistory: [],
        userMessage: 'Bonjour',
        apiKey: 'test-key',
        language: 'fr' as const,
      };

      await sendChatMessage(options);

      const callArgs = vi.mocked(openrouterClient.generateChatCompletion).mock.calls[0];
      const messages = callArgs[0];
      const systemMessage = messages.find((msg) => msg.role === 'system');

      expect(systemMessage?.content).toContain('journal intime');
    });
  });

  describe('generateInitialMessage', () => {
    it('returns English message for en language', () => {
      const message = generateInitialMessage('en');
      expect(message).toContain('Hello');
      expect(message).toContain('reflect');
    });

    it('returns French message for fr language', () => {
      const message = generateInitialMessage('fr');
      expect(message).toContain('Bonjour');
      expect(message).toContain('réfléchir');
    });
  });
});


