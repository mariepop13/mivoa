import { generateTextCompletion } from './openrouter-client';
import { buildDailyPromptPrompt, buildContextualPromptPrompt } from '../utils/prompt-builders';
import type { JournalPrompt, RecentEntry } from '../types/journal';
import { format } from 'date-fns';

export async function generateDailyPrompt(
  apiKey: string,
  recentEntries: RecentEntry[],
  language: 'en' | 'fr'
): Promise<JournalPrompt> {
  const prompt = buildDailyPromptPrompt(recentEntries, language);
  
  const response = await generateTextCompletion(prompt, apiKey, {
    temperature: 0.8,
    max_tokens: 200,
  });

  const dateKey = format(new Date(), 'yyyy-MM-dd');
  
  return {
    text: response.trim(),
    generatedAt: new Date(),
    dateKey,
  };
}

export async function generateContextualPrompt(
  entryContent: string,
  apiKey: string,
  language: 'en' | 'fr'
): Promise<string> {
  const prompt = buildContextualPromptPrompt(entryContent, language);
  
  const response = await generateTextCompletion(prompt, apiKey, {
    temperature: 0.7,
    max_tokens: 150,
  });

  return response.trim();
}

