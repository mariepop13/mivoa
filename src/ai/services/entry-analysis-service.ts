import { generateChatCompletion } from './openrouter-client';
import { buildAnalysisPrompt } from '../utils/prompt-builders';
import type { EntryAnalysis } from '../types/journal';

interface AnalysisResult {
  mood?: string;
  emotions?: string[];
  themes?: string[];
  keyTakeaways?: string[];
}

function parseAnalysisResponse(response: string): AnalysisResult {
  try {
    const cleaned = response.trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]) as AnalysisResult;
    
    return {
      mood: parsed.mood?.toLowerCase(),
      emotions: Array.isArray(parsed.emotions) ? parsed.emotions.slice(0, 5) : [],
      themes: Array.isArray(parsed.themes) ? parsed.themes.slice(0, 5) : [],
      keyTakeaways: Array.isArray(parsed.keyTakeaways) ? parsed.keyTakeaways.slice(0, 3) : [],
    };
  } catch (error) {
    console.error('Failed to parse analysis response:', error);
    return {};
  }
}

export async function analyzeEntry(
  entryContent: string,
  apiKey: string,
  language: 'en' | 'fr'
): Promise<EntryAnalysis> {
  if (!entryContent.trim()) {
    return {
      processedAt: new Date(),
    };
  }

  const systemPrompt = language === 'fr'
    ? `Tu es un assistant qui analyse des entrées de journal pour extraire des informations structurées. Réponds UNIQUEMENT avec un objet JSON valide, sans texte supplémentaire.`
    : `You are an assistant that analyzes journal entries to extract structured information. Respond ONLY with a valid JSON object, no additional text.`;

  const userPrompt = buildAnalysisPrompt(entryContent, language);

  const response = await generateChatCompletion(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    apiKey,
    {
      temperature: 0.3,
      max_tokens: 500,
    }
  );

  const parsed = parseAnalysisResponse(response);

  return {
    mood: parsed.mood,
    emotions: parsed.emotions,
    themes: parsed.themes,
    keyTakeaways: parsed.keyTakeaways,
    processedAt: new Date(),
  };
}

