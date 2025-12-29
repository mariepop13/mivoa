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
      moods: ['happy'],
      emotions: ['joy', 'gratitude'],
      themes: ['work', 'family'],
      themeEmojis: { 'work': '💼', 'family': '👨‍👩‍👧‍👦' },
      keyTakeaways: ['Important insight'],
      characters: ['Marie', 'John'],
    });

    vi.mocked(openrouterClient.generateChatCompletion).mockResolvedValue(mockResponse);

    const result = await analyzeEntry('Test entry content', 'test-api-key', 'en', 'test-model');

    expect(result.moods).toEqual(['happy']);
    expect(result.themes).toEqual(['work', 'family']);
    expect(result.themeEmojis).toEqual({ 'work': '💼', 'family': '👨‍👩‍👧‍👦' });
    expect(result.keyTakeaways).toEqual(['Important insight']);
    expect(result.characters).toEqual(['Marie', 'John']);
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
      characters: ['Marie'],
    });

    vi.mocked(openrouterClient.generateChatCompletion).mockResolvedValue(mockResponse);

    const result = await analyzeEntry('Contenu de test', 'test-api-key', 'fr', 'test-model');

    expect(result).toBeDefined();
    expect(result.characters).toEqual(['Marie']);
    expect(openrouterClient.generateChatCompletion).toHaveBeenCalled();
  });

  it('limits arrays to maximum counts', async () => {
    const mockResponse = JSON.stringify({
      mood: 'happy',
      emotions: ['1', '2', '3', '4', '5', '6', '7'],
      themes: ['1', '2', '3', '4', '5', '6'],
      keyTakeaways: ['1', '2', '3', '4'],
      characters: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
    });

    vi.mocked(openrouterClient.generateChatCompletion).mockResolvedValue(mockResponse);

    const result = await analyzeEntry('Test', 'test-api-key', 'en');

    expect(result.themes?.length).toBeLessThanOrEqual(5);
    expect(result.keyTakeaways?.length).toBeLessThanOrEqual(3);
    expect(result.characters?.length).toBeLessThanOrEqual(10);
    expect(result.processedAt).toBeInstanceOf(Date);
  });

  it('handles themeEmojis parsing', async () => {
    const mockResponse = JSON.stringify({
      mood: 'happy',
      themes: ['work', 'health'],
      themeEmojis: { 'work': '💼', 'health': '🏥' },
    });

    vi.mocked(openrouterClient.generateChatCompletion).mockResolvedValue(mockResponse);

    const result = await analyzeEntry('Test', 'test-api-key', 'en');

    expect(result.themeEmojis).toEqual({ 'work': '💼', 'health': '🏥' });
  });

  it('handles missing themeEmojis gracefully', async () => {
    const mockResponse = JSON.stringify({
      mood: 'happy',
      themes: ['work'],
    });

    vi.mocked(openrouterClient.generateChatCompletion).mockResolvedValue(mockResponse);

    const result = await analyzeEntry('Test', 'test-api-key', 'en');

    expect(result.themeEmojis).toBeUndefined();
  });

  it('filters invalid themeEmojis entries', async () => {
    const mockResponse = JSON.stringify({
      mood: 'happy',
      themes: ['work'],
      themeEmojis: { 'work': '💼', 'invalid': '', 'valid': '✅' },
    });

    vi.mocked(openrouterClient.generateChatCompletion).mockResolvedValue(mockResponse);

    const result = await analyzeEntry('Test', 'test-api-key', 'en');

    expect(result.themeEmojis).toEqual({ 'work': '💼', 'valid': '✅' });
  });

  it('handles parsing errors gracefully', async () => {
    vi.mocked(openrouterClient.generateChatCompletion).mockResolvedValue('Invalid JSON response');

    const result = await analyzeEntry('Test', 'test-api-key', 'en');

    expect(result.moods).toBeUndefined();
    expect(result.themes).toBeUndefined();
    expect(result.themeEmojis).toBeUndefined();
    expect(result.keyTakeaways).toBeUndefined();
    expect(result.characters).toBeUndefined();
    expect(result.processedAt).toBeInstanceOf(Date);
  });

  it('throws error when API call fails', async () => {
    vi.mocked(openrouterClient.generateChatCompletion).mockRejectedValue(new Error('API Error'));

    await expect(analyzeEntry('Test', 'test-api-key', 'en')).rejects.toThrow('API Error');
  });
});

