import { generateChatCompletion } from './openrouter-client';
import { buildAnalysisPrompt } from '../utils/prompt-builders';
import type { EntryAnalysis } from '../types/journal';

const MAX_MOODS_COUNT = 5;
const MAX_EMOTIONS_COUNT = 5;
const MAX_THEMES_COUNT = 5;
const MAX_KEY_TAKEAWAYS_COUNT = 3;
const MAX_PLACES_COUNT = 10;
const MAX_CHARACTERS_COUNT = 10;
const ANALYSIS_TEMPERATURE = 0.3;
const ANALYSIS_MAX_TOKENS = 500;

interface AnalysisResult {
  moods?: string[];
  moodEmojis?: Record<string, string>;
  subjectEmoji?: string;
  emotions?: string[];
  themes?: string[];
  themeEmojis?: Record<string, string>;
  keyTakeaways?: string[];
  places?: string[];
  characters?: string[];
}

function parsePlacesArray(places: unknown): string[] {
  if (!Array.isArray(places)) {
    return [];
  }
  return places
    .map((p) => typeof p === 'string' ? p.trim() : '')
    .filter((p) => p.length > 0)
    .slice(0, MAX_PLACES_COUNT);
}

function parseCharactersArray(characters: unknown): string[] {
  if (!Array.isArray(characters)) {
    return [];
  }
  return characters
    .map((c) => typeof c === 'string' ? c.trim() : '')
    .filter((c) => c.length > 0)
    .slice(0, MAX_CHARACTERS_COUNT);
}

function parseMoodsArray(moods: unknown): string[] {
  if (!Array.isArray(moods)) {
    return [];
  }
  return moods
    .map((m) => typeof m === 'string' ? m.trim().toLowerCase() : '')
    .filter((m) => m.length > 0)
    .slice(0, MAX_MOODS_COUNT);
}

function parseEmojiMap(emojiMap: unknown, toLowerCase = false): Record<string, string> | undefined {
  if (!emojiMap || typeof emojiMap !== 'object' || Array.isArray(emojiMap)) {
    return undefined;
  }
  
  const entries = Object.entries(emojiMap)
    .filter(([key, value]) => typeof key === 'string' && typeof value === 'string' && key.trim().length > 0 && value.trim().length > 0)
    .map(([key, value]) => [toLowerCase ? key.trim().toLowerCase() : key.trim(), value.trim()]);
  
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function parseSubjectEmoji(subjectEmoji: unknown): string | undefined {
  if (typeof subjectEmoji === 'string' && subjectEmoji.trim().length > 0) {
    return subjectEmoji.trim();
  }
  return undefined;
}

function parseSimpleArray(array: unknown, maxCount: number): string[] {
  if (!Array.isArray(array)) {
    return [];
  }
  return array
    .filter((item): item is string => typeof item === 'string')
    .slice(0, maxCount);
}

function parseAnalysisResponse(response: string): AnalysisResult {
  try {
    const cleaned = response.trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]) as AnalysisResult;
    
    const places = parsePlacesArray(parsed.places);
    const characters = parseCharactersArray(parsed.characters);
    const moods = parseMoodsArray(parsed.moods);
    const moodEmojis = parseEmojiMap(parsed.moodEmojis, true);
    const subjectEmoji = parseSubjectEmoji(parsed.subjectEmoji);
    const themeEmojis = parseEmojiMap(parsed.themeEmojis, false);
    const emotions = parseSimpleArray(parsed.emotions, MAX_EMOTIONS_COUNT);
    const themes = parseSimpleArray(parsed.themes, MAX_THEMES_COUNT);
    const keyTakeaways = parseSimpleArray(parsed.keyTakeaways, MAX_KEY_TAKEAWAYS_COUNT);

    return {
      moods: moods.length > 0 ? moods : undefined,
      moodEmojis,
      subjectEmoji,
      emotions,
      themes,
      themeEmojis,
      keyTakeaways,
      places,
      characters,
    };
  } catch (error) {
    console.error('Failed to parse analysis response:', error);
    return {};
  }
}

export async function analyzeEntry(
  entryContent: string,
  apiKey: string,
  language: 'en' | 'fr',
  model?: string
): Promise<EntryAnalysis> {
  if (!entryContent.trim()) {
    return {
      processedAt: new Date(),
    };
  }

  const systemPromptFr = `Tu es un assistant qui analyse des entrées de journal pour extraire 
    des informations structurées. Réponds UNIQUEMENT avec un objet JSON valide, sans texte 
    supplémentaire.`;
  const systemPromptEn = `You are an assistant that analyzes journal entries to extract 
    structured information. Respond ONLY with a valid JSON object, no additional text.`;
  const systemPrompt = language === 'fr' ? systemPromptFr : systemPromptEn;

  const userPrompt = buildAnalysisPrompt(entryContent, language);

  const response = await generateChatCompletion(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    apiKey,
    {
      model,
      temperature: ANALYSIS_TEMPERATURE,
      max_tokens: ANALYSIS_MAX_TOKENS,
    }
  );

  const parsed = parseAnalysisResponse(response);

  return {
    moods: parsed.moods,
    moodEmojis: parsed.moodEmojis,
    subjectEmoji: parsed.subjectEmoji,
    emotions: parsed.emotions,
    themes: parsed.themes,
    themeEmojis: parsed.themeEmojis,
    keyTakeaways: parsed.keyTakeaways,
    places: parsed.places,
    characters: parsed.characters,
    processedAt: new Date(),
  };
}

