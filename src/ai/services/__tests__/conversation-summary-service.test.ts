import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateConversationSummary } from '../conversation-summary-service';
import * as openrouterClient from '../openrouter-client';
import type { ChatMessage } from '../../types/chat';

vi.mock('../openrouter-client');

describe('conversation-summary-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockConversationHistory: ChatMessage[] = [
    { role: 'user', content: 'Hello', timestamp: new Date() },
    { role: 'assistant', content: 'Hi there!', timestamp: new Date() },
    { role: 'user', content: 'How are you?', timestamp: new Date() },
  ];

  it('generates summary from conversation', async () => {
    const mockResponse = JSON.stringify({
      title: 'Test Summary',
      content: 'Summary content',
      insights: ['Insight 1', 'Insight 2'],
    });

    vi.mocked(openrouterClient.generateChatCompletion).mockResolvedValue(mockResponse);

    const result = await generateConversationSummary(
      mockConversationHistory,
      'test-api-key',
      'en',
      'test-model'
    );

    expect(result).toEqual({
      title: 'Test Summary',
      content: 'Summary content',
      insights: ['Insight 1', 'Insight 2'],
    });

    expect(openrouterClient.generateChatCompletion).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ role: 'system' }),
        expect.objectContaining({ role: 'user' }),
      ]),
      'test-api-key',
      expect.objectContaining({ model: 'test-model' })
    );
  });

  it('handles French language', async () => {
    const mockResponse = JSON.stringify({
      title: 'Résumé de test',
      content: 'Contenu du résumé',
      insights: ['Insight'],
    });

    vi.mocked(openrouterClient.generateChatCompletion).mockResolvedValue(mockResponse);

    const result = await generateConversationSummary(
      mockConversationHistory,
      'test-api-key',
      'fr',
      'test-model'
    );

    expect(result.title).toBe('Résumé de test');
    expect(openrouterClient.generateChatCompletion).toHaveBeenCalled();
  });

  it('uses default title when not provided', async () => {
    const mockResponse = JSON.stringify({
      content: 'Summary content',
    });

    vi.mocked(openrouterClient.generateChatCompletion).mockResolvedValue(mockResponse);

    const result = await generateConversationSummary(
      mockConversationHistory,
      'test-api-key',
      'en'
    );

    expect(result.title).toBe('Journal Entry');
    expect(result.content).toBe('Summary content');
  });

  it('limits insights to maximum count', async () => {
    const mockResponse = JSON.stringify({
      title: 'Test',
      content: 'Content',
      insights: ['1', '2', '3', '4', '5', '6', '7'],
    });

    vi.mocked(openrouterClient.generateChatCompletion).mockResolvedValue(mockResponse);

    const result = await generateConversationSummary(
      mockConversationHistory,
      'test-api-key',
      'en'
    );

    expect(result.insights?.length).toBeLessThanOrEqual(5);
  });

  it('throws error for empty conversation', async () => {
    await expect(
      generateConversationSummary([], 'test-api-key', 'en')
    ).rejects.toThrow('Cannot generate summary from empty conversation');
  });

  it('throws error when parsing fails', async () => {
    vi.mocked(openrouterClient.generateChatCompletion).mockResolvedValue('Invalid JSON');

    await expect(
      generateConversationSummary(mockConversationHistory, 'test-api-key', 'en')
    ).rejects.toThrow('Failed to parse summary response');
  });

  it('throws error when API call fails', async () => {
    vi.mocked(openrouterClient.generateChatCompletion).mockRejectedValue(new Error('API Error'));

    await expect(
      generateConversationSummary(mockConversationHistory, 'test-api-key', 'en')
    ).rejects.toThrow('API Error');
  });
});


