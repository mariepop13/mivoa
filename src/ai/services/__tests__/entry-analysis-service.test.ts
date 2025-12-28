import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeEntry } from '../entry-analysis-service';
import * as openrouterClient from '../openrouter-client';

vi.mock('../openrouter-client');

describe('entry-analysis-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('analyzes entry and returns structured result', async () => {
    const mockResponse = JSON.stringify({
      mood: 'happy',
      emotions: ['joy', 'gratitude'],
      themes: ['work', 'family'],
      keyTakeaways: ['Important insight'],
    });

    vi.mocked(openrouterClient.generateChatCompletion).mockResolvedValue(mockResponse);

    const result = await analyzeEntry('Test entry content', 'test-api-key', 'en', 'test-model');

    expect(result.mood).toBe('happy');
    expect(result.themes).toEqual(['work', 'family']);
    expect(result.keyTakeaways).toEqual(['Important insight']);
    expect(result.processedAt).toBeInstanceOf(Date);

    expect(openrouterClient.generateChatCompletion).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ role: 'system' }),
        expect.objectContaining({ role: 'user', content: expect.stringContaining('Test entry content') }),
      ]),
      'test-api-key',
      expect.objectContaining({ model: 'test-model' })
    );
  });

  it('handles French language', async () => {
    const mockResponse = JSON.stringify({
      mood: 'heureux',
      themes: ['travail'],
      keyTakeaways: ['Insight'],
    });

    vi.mocked(openrouterClient.generateChatCompletion).mockResolvedValue(mockResponse);

    const result = await analyzeEntry('Contenu de test', 'test-api-key', 'fr', 'test-model');

    expect(result).toBeDefined();
    expect(openrouterClient.generateChatCompletion).toHaveBeenCalled();
  });

  it('limits arrays to maximum counts', async () => {
    const mockResponse = JSON.stringify({
      mood: 'happy',
      emotions: ['1', '2', '3', '4', '5', '6', '7'],
      themes: ['1', '2', '3', '4', '5', '6'],
      keyTakeaways: ['1', '2', '3', '4'],
    });

    vi.mocked(openrouterClient.generateChatCompletion).mockResolvedValue(mockResponse);

    const result = await analyzeEntry('Test', 'test-api-key', 'en');

    expect(result.themes?.length).toBeLessThanOrEqual(5);
    expect(result.keyTakeaways?.length).toBeLessThanOrEqual(3);
    expect(result.processedAt).toBeInstanceOf(Date);
  });

  it('handles parsing errors gracefully', async () => {
    vi.mocked(openrouterClient.generateChatCompletion).mockResolvedValue('Invalid JSON response');

    const result = await analyzeEntry('Test', 'test-api-key', 'en');

    expect(result.mood).toBeUndefined();
    expect(result.themes).toBeUndefined();
    expect(result.keyTakeaways).toBeUndefined();
    expect(result.processedAt).toBeInstanceOf(Date);
  });

  it('throws error when API call fails', async () => {
    vi.mocked(openrouterClient.generateChatCompletion).mockRejectedValue(new Error('API Error'));

    await expect(analyzeEntry('Test', 'test-api-key', 'en')).rejects.toThrow('API Error');
  });
});

