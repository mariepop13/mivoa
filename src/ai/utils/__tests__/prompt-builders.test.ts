import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildDailyPromptPrompt, buildContextualPromptPrompt, buildAnalysisPrompt } from '../prompt-builders';

vi.mock('date-fns', () => ({
  format: vi.fn((_date: Date, _format: string, _options?: { locale?: unknown }) => 'Monday, January 15, 2024'),
  enUS: {},
  fr: {},
}));

vi.mock('date-fns/locale', () => ({
  enUS: {},
  fr: {},
}));

describe('prompt-builders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('buildDailyPromptPrompt', () => {
    it('should build prompt in English without recent entries', () => {
      const result = buildDailyPromptPrompt([], 'en');

      expect(result).toContain('Generate a personalized journaling prompt');
      expect(result).toContain('Monday, January 15, 2024');
      expect(result).toContain('warm and engaging prompt');
    });

    it('should build prompt in French without recent entries', () => {
      const result = buildDailyPromptPrompt([], 'fr');

      expect(result).toContain("Génère une invite d'écriture personnalisée");
      expect(result).toContain('chaleureuse et engageante');
    });

    it('should build prompt with recent entries in English', () => {
      const recentEntries = [
        { content: 'Test content 1', date: '2024-01-14' },
        { content: 'Test content 2', date: '2024-01-13' },
      ];

      const result = buildDailyPromptPrompt(recentEntries, 'en');

      expect(result).toContain('recent entries for context');
      expect(result).toContain('Entry 1 (2024-01-14)');
      expect(result).toContain('Entry 2 (2024-01-13)');
      expect(result).toContain('Test content 1');
      expect(result).toContain('Test content 2');
    });

    it('should build prompt with recent entries in French', () => {
      const recentEntries = [
        { content: 'Contenu test', date: '2024-01-14' },
      ];

      const result = buildDailyPromptPrompt(recentEntries, 'fr');

      expect(result).toContain("Voici les entrées récentes de l'utilisateur");
      expect(result).toContain('Contenu test');
    });

    it('should limit recent entries to 5', () => {
      const recentEntries = Array.from({ length: 10 }, (_, i) => ({
        content: `Content ${i}`,
        date: `2024-01-${15 - i}`,
      }));

      const result = buildDailyPromptPrompt(recentEntries, 'en');

      expect(result.match(/Entry \d+/g)?.length).toBe(5);
    });

    it('should truncate long entry content', () => {
      const longContent = 'a'.repeat(300);
      const recentEntries = [
        { content: longContent, date: '2024-01-14' },
      ];

      const result = buildDailyPromptPrompt(recentEntries, 'en');

      expect(result).toContain(`${'a'.repeat(200)  }...`);
    });

    it('should include title when present', () => {
      const recentEntries = [
        { content: 'Content', title: 'Test Title', date: '2024-01-14' },
      ];

      const result = buildDailyPromptPrompt(recentEntries, 'en');

      expect(result).toContain('Title: Test Title');
    });
  });

  describe('buildContextualPromptPrompt', () => {
    it('should build contextual prompt in English', () => {
      const entryContent = 'I had a great day today';
      const result = buildContextualPromptPrompt(entryContent, 'en');

      expect(result).toContain('The user wrote this journal entry');
      expect(result).toContain(entryContent);
      expect(result).toContain('Generate a thoughtful follow-up question');
    });

    it('should build contextual prompt in French', () => {
      const entryContent = "J'ai passé une excellente journée";
      const result = buildContextualPromptPrompt(entryContent, 'fr');

      expect(result).toContain("L'utilisateur a écrit cette entrée");
      expect(result).toContain(entryContent);
      expect(result).toContain('Génère une question de suivi réfléchie');
    });
  });

  describe('buildAnalysisPrompt', () => {
    it('should build analysis prompt in English', () => {
      const entryContent = 'Today was a good day';
      const result = buildAnalysisPrompt(entryContent, 'en');

      expect(result).toContain('You are an assistant that analyzes journal entries');
      expect(result).toContain(entryContent);
      expect(result).toContain('"mood"');
      expect(result).toContain('"emotions"');
      expect(result).toContain('"themes"');
      expect(result).toContain('"keyTakeaways"');
    });

    it('should build analysis prompt in French', () => {
      const entryContent = "Aujourd'hui était une bonne journée";
      const result = buildAnalysisPrompt(entryContent, 'fr');

      expect(result).toContain("Tu es un assistant qui analyse des entrées de journal");
      expect(result).toContain(entryContent);
      expect(result).toContain('"mood"');
      expect(result).toContain('"emotions"');
      expect(result).toContain('"themes"');
      expect(result).toContain('humeur dominante');
    });
  });
});

