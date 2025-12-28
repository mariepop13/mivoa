import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateDailyPrompt, generateContextualPrompt } from '../journal-prompt-service';
import * as openrouterClient from '../openrouter-client';
import * as promptBuilders from '../../utils/prompt-builders';

vi.mock('../openrouter-client');
vi.mock('../../utils/prompt-builders');
vi.mock('date-fns', () => ({
  format: vi.fn((_date: Date) => '2024-01-15'),
}));

describe('journal-prompt-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateDailyPrompt', () => {
    it('should generate a daily prompt with default model', async () => {
      const mockPrompt = 'Generate a daily journal prompt';
      const mockResponse = 'What are you grateful for today?';
      const recentEntries: Array<{ content: string; title?: string; date: string }> = [];

      vi.mocked(promptBuilders.buildDailyPromptPrompt).mockReturnValue(mockPrompt);
      vi.mocked(openrouterClient.generateTextCompletion).mockResolvedValue(mockResponse);

      const result = await generateDailyPrompt('test-api-key', recentEntries, 'en');

      expect(promptBuilders.buildDailyPromptPrompt).toHaveBeenCalledWith(recentEntries, 'en');
      expect(openrouterClient.generateTextCompletion).toHaveBeenCalledWith(mockPrompt, 'test-api-key', {
        model: undefined,
        temperature: 0.8,
        max_tokens: 200,
      });
      expect(result.text).toBe(mockResponse);
      expect(result.dateKey).toBe('2024-01-15');
      expect(result.generatedAt).toBeInstanceOf(Date);
    });

    it('should generate a daily prompt with custom model', async () => {
      const mockPrompt = 'Generate a daily journal prompt';
      const mockResponse = 'Reflect on your day';
      const recentEntries: Array<{ content: string; title?: string; date: string }> = [];

      vi.mocked(promptBuilders.buildDailyPromptPrompt).mockReturnValue(mockPrompt);
      vi.mocked(openrouterClient.generateTextCompletion).mockResolvedValue(mockResponse);

      const result = await generateDailyPrompt('test-api-key', recentEntries, 'fr', 'custom-model');

      expect(openrouterClient.generateTextCompletion).toHaveBeenCalledWith(mockPrompt, 'test-api-key', {
        model: 'custom-model',
        temperature: 0.8,
        max_tokens: 200,
      });
      expect(result.text).toBe(mockResponse);
    });

    it('should trim the response text', async () => {
      const mockResponse = '  Prompt with spaces  ';
      vi.mocked(promptBuilders.buildDailyPromptPrompt).mockReturnValue('prompt');
      vi.mocked(openrouterClient.generateTextCompletion).mockResolvedValue(mockResponse);

      const result = await generateDailyPrompt('test-api-key', [], 'en');

      expect(result.text).toBe('Prompt with spaces');
    });
  });

  describe('generateContextualPrompt', () => {
    it('should generate a contextual prompt', async () => {
      const mockPrompt = 'Generate contextual prompt';
      const mockResponse = 'Continue your thoughts';
      const entryContent = 'I had a great day today';

      vi.mocked(promptBuilders.buildContextualPromptPrompt).mockReturnValue(mockPrompt);
      vi.mocked(openrouterClient.generateTextCompletion).mockResolvedValue(mockResponse);

      const result = await generateContextualPrompt(entryContent, 'test-api-key', 'en');

      expect(promptBuilders.buildContextualPromptPrompt).toHaveBeenCalledWith(entryContent, 'en');
      expect(openrouterClient.generateTextCompletion).toHaveBeenCalledWith(mockPrompt, 'test-api-key', {
        model: undefined,
        temperature: 0.7,
        max_tokens: 150,
      });
      expect(result).toBe(mockResponse);
    });

    it('should generate a contextual prompt with custom model', async () => {
      const mockResponse = 'Think about this';
      vi.mocked(promptBuilders.buildContextualPromptPrompt).mockReturnValue('prompt');
      vi.mocked(openrouterClient.generateTextCompletion).mockResolvedValue(mockResponse);

      const result = await generateContextualPrompt('content', 'test-api-key', 'fr', 'custom-model');

      expect(openrouterClient.generateTextCompletion).toHaveBeenCalledWith('prompt', 'test-api-key', {
        model: 'custom-model',
        temperature: 0.7,
        max_tokens: 150,
      });
      expect(result).toBe(mockResponse);
    });

    it('should trim the response text', async () => {
      const mockResponse = '  Trimmed response  ';
      vi.mocked(promptBuilders.buildContextualPromptPrompt).mockReturnValue('prompt');
      vi.mocked(openrouterClient.generateTextCompletion).mockResolvedValue(mockResponse);

      const result = await generateContextualPrompt('content', 'test-api-key', 'en');

      expect(result).toBe('Trimmed response');
    });
  });
});

