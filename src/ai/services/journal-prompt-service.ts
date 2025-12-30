import { generateTextCompletion } from './openrouter-client';
import { buildDailyPromptPrompt, buildContextualPromptPrompt, buildTemplatePromptPrompt } from '../utils/prompt-builders';
import type { JournalPrompt, RecentEntry } from '../types/journal';
import type { EntryTemplate } from '@/hooks/use-entry-templates';
import { format } from 'date-fns';

const DEFAULT_TEMPERATURE = 0.8;
const VARIATION_TEMPERATURE = 0.9;
const CONTEXTUAL_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 200;
const CONTEXTUAL_MAX_TOKENS = 150;

export async function generateDailyPrompt(
  apiKey: string,
  recentEntries: RecentEntry[],
  language: 'en' | 'fr',
  model?: string
): Promise<JournalPrompt> {
  const prompt = buildDailyPromptPrompt(recentEntries, language);
  
  const response = await generateTextCompletion(prompt, apiKey, {
    model,
    temperature: DEFAULT_TEMPERATURE,
    max_tokens: DEFAULT_MAX_TOKENS,
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
  language: 'en' | 'fr',
  model?: string
): Promise<string> {
  const prompt = buildContextualPromptPrompt(entryContent, language);
  
  const response = await generateTextCompletion(prompt, apiKey, {
    model,
    temperature: CONTEXTUAL_TEMPERATURE,
    max_tokens: CONTEXTUAL_MAX_TOKENS,
  });

  return response.trim();
}

interface GenerateTemplatePromptParams {
  template: EntryTemplate;
  apiKey: string;
  language: 'en' | 'fr';
  model?: string;
  previousPrompt?: string;
}

export async function generateTemplatePrompt(
  params: GenerateTemplatePromptParams
): Promise<string> {
  const { template, apiKey, language, model, previousPrompt } = params;
  const prompt = buildTemplatePromptPrompt(template, language, previousPrompt);
  
  const response = await generateTextCompletion(prompt, apiKey, {
    model,
    temperature: VARIATION_TEMPERATURE,
    max_tokens: DEFAULT_MAX_TOKENS,
  });

  return response.trim();
}

