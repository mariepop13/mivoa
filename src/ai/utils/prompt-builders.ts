import { format } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import type { RecentEntry } from '../types/journal';

export function buildDailyPromptPrompt(
  recentEntries: RecentEntry[],
  language: 'en' | 'fr'
): string {
  const dateLocale = language === 'fr' ? fr : enUS;
  const today = format(new Date(), 'EEEE, MMMM d, yyyy', { locale: dateLocale });
  
  let prompt = language === 'fr' 
    ? `Génère une invite d'écriture personnalisée pour un journal intime pour aujourd'hui (${today}).`
    : `Generate a personalized journaling prompt for today (${today}).`;

  if (recentEntries.length > 0) {
    prompt += language === 'fr'
      ? `\n\nVoici les entrées récentes de l'utilisateur pour contexte (ne mentionne pas ces entrées directement dans l'invite) :\n\n`
      : `\n\nHere are the user's recent entries for context (don't mention these entries directly in the prompt):\n\n`;
    
    recentEntries.slice(0, 5).forEach((entry, index) => {
      prompt += `Entry ${index + 1} (${entry.date}):\n`;
      if (entry.title) {
        prompt += `Title: ${entry.title}\n`;
      }
      prompt += `Content: ${entry.content.substring(0, 200)}${entry.content.length > 200 ? '...' : ''}\n\n`;
    });

    prompt += language === 'fr'
      ? `Crée une invite qui encourage la réflexion et l'exploration de nouveaux thèmes ou perspectives, en tenant compte des schémas dans les entrées récentes.`
      : `Create a prompt that encourages reflection and exploration of new themes or perspectives, taking into account patterns in recent entries.`;
  } else {
    prompt += language === 'fr'
      ? `\n\nCrée une invite chaleureuse et engageante qui encourage l'utilisateur à réfléchir sur sa journée, ses pensées ou ses émotions.`
      : `\n\nCreate a warm and engaging prompt that encourages the user to reflect on their day, thoughts, or emotions.`;
  }

  prompt += language === 'fr'
    ? `\n\nRéponds uniquement avec l'invite elle-même, sans explications supplémentaires. L'invite doit être concise (1-2 phrases maximum), personnelle et réfléchie.`
    : `\n\nRespond only with the prompt itself, no additional explanations. The prompt should be concise (1-2 sentences maximum), personal, and thoughtful.`;

  return prompt;
}

export function buildContextualPromptPrompt(
  entryContent: string,
  language: 'en' | 'fr'
): string {
  const prompt = language === 'fr'
    ? `L'utilisateur a écrit cette entrée dans son journal:\n\n${entryContent}\n\nGénère une question de suivi réfléchie qui l'aiderait à approfondir sa réflexion. La question doit être ouverte, encourageante et pertinente au contexte. Réponds uniquement avec la question, sans explications.`
    : `The user wrote this journal entry:\n\n${entryContent}\n\nGenerate a thoughtful follow-up question that would help them deepen their reflection. The question should be open-ended, encouraging, and relevant to the context. Respond only with the question, no explanations.`;

  return prompt;
}

export function buildAnalysisPrompt(
  entryContent: string,
  language: 'en' | 'fr'
): string {
  const systemPrompt = language === 'fr'
    ? `Tu es un assistant qui analyse des entrées de journal pour extraire des informations structurées. Réponds UNIQUEMENT avec un objet JSON valide, sans texte supplémentaire.`
    : `You are an assistant that analyzes journal entries to extract structured information. Respond ONLY with a valid JSON object, no additional text.`;

  const userPrompt = language === 'fr'
    ? `Analyse cette entrée de journal et extrais les informations suivantes au format JSON:\n\n{
  "mood": "humeur dominante en un mot (ex: heureux, anxieux, reconnaissant, neutre)",
  "emotions": ["liste des émotions détectées (max 5)"],
  "themes": ["liste des thèmes principaux (ex: travail, relations, santé, croissance personnelle, max 5)"],
  "keyTakeaways": ["points clés ou insights principaux (max 3, phrases courtes)"]
}\n\nEntrée:\n${entryContent}\n\nRéponds uniquement avec le JSON, rien d'autre.`
    : `Analyze this journal entry and extract the following information as JSON:\n\n{
  "mood": "dominant mood in one word (e.g., happy, anxious, grateful, neutral)",
  "emotions": ["list of detected emotions (max 5)"],
  "themes": ["list of main themes (e.g., work, relationships, health, personal growth, max 5)"],
  "keyTakeaways": ["key points or main insights (max 3, short phrases)"]
}\n\nEntry:\n${entryContent}\n\nRespond only with JSON, nothing else.`;

  return `${systemPrompt}\n\n${userPrompt}`;
}

