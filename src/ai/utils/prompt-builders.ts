import { format } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import type { RecentEntry } from '../types/journal';
import type { EntryTemplate } from '@/hooks/use-entry-templates';

const MAX_RECENT_ENTRIES_FOR_CONTEXT = 5;
const MAX_ENTRY_PREVIEW_LENGTH = 200;
const MAX_PREVIOUS_PROMPT_LENGTH = 500;

function sanitizePreviousPrompt(prompt: string): string {
  let sanitized = prompt.trim();
  
  sanitized = sanitized.replace(/\\/g, '\\\\');
  sanitized = sanitized.replace(/"/g, '\\"');
  sanitized = sanitized.replace(/\n{3,}/g, '\n\n');
  sanitized = sanitized.slice(0, MAX_PREVIOUS_PROMPT_LENGTH);
  
  return sanitized;
}

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
    
    recentEntries.slice(0, MAX_RECENT_ENTRIES_FOR_CONTEXT).forEach((entry, index) => {
      prompt += `Entry ${index + 1} (${entry.date}):\n`;
      if (entry.title) {
        prompt += `Title: ${entry.title}\n`;
      }
      const truncatedContent = entry.content.substring(0, MAX_ENTRY_PREVIEW_LENGTH);
      const hasMore = entry.content.length > MAX_ENTRY_PREVIEW_LENGTH;
      prompt += `Content: ${truncatedContent}${hasMore ? '...' : ''}\n\n`;
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
  "moods": ["liste des humeurs détectées (ex: heureux, anxieux, reconnaissant, neutre, max 5)"],
  "moodEmojis": {"humeur1": "emoji1", "humeur2": "emoji2", ...},
  "subjectEmoji": "emoji représentant le sujet/titre principal de l'entrée",
  "emotions": ["liste des émotions détectées (max 5)"],
  "themes": ["liste des thèmes principaux (ex: travail, relations, santé, croissance personnelle, max 5)"],
  "themeEmojis": {"thème1": "emoji1", "thème2": "emoji2", ...},
  "keyTakeaways": ["points clés ou insights principaux (max 3, phrases courtes)"],
  "places": ["liste des lieux mentionnés (villes, pays, lieux spécifiques, max 10)"],
  "characters": ["liste des personnes mentionnées (noms, max 10)"]
}\n\nPour moodEmojis, analyse chaque humeur détectée et associe l'emoji le plus approprié et significatif qui représente le mieux cette humeur. Choisis des emojis pertinents et évocateurs. Si une humeur est déjà un emoji, utilise-le tel quel. Si aucun emoji approprié n'existe pour une humeur, omets-la de moodEmojis (ne mets pas d'emoji générique).\n\nPour subjectEmoji, choisis l'emoji qui représente le mieux le sujet/titre principal de l'entrée. C'est l'emoji qui sera affiché à côté du titre dans la liste. Si aucun emoji approprié n'existe, omets subjectEmoji.\n\nPour themeEmojis, analyse chaque thème et associe l'emoji le plus approprié et significatif qui représente le mieux ce thème. Choisis des emojis pertinents et évocateurs. Si un thème est déjà un emoji, utilise-le tel quel. Si aucun emoji approprié n'existe pour un thème, omets-le de themeEmojis (ne mets pas d'emoji générique comme 🏷️). Réponds uniquement avec le JSON, rien d'autre.\n\nEntrée:\n${entryContent}\n\nRéponds uniquement avec le JSON, rien d'autre.`
    : `Analyze this journal entry and extract the following information as JSON:\n\n{
  "moods": ["list of detected moods (e.g., happy, anxious, grateful, neutral, max 5)"],
  "moodEmojis": {"mood1": "emoji1", "mood2": "emoji2", ...},
  "subjectEmoji": "emoji representing the entry's main subject/title",
  "emotions": ["list of detected emotions (max 5)"],
  "themes": ["list of main themes (e.g., work, relationships, health, personal growth, max 5)"],
  "themeEmojis": {"theme1": "emoji1", "theme2": "emoji2", ...},
  "keyTakeaways": ["key points or main insights (max 3, short phrases)"],
  "places": ["list of mentioned places (cities, countries, specific locations, max 10)"],
  "characters": ["list of mentioned people (names, max 10)"]
}\n\nFor moodEmojis, analyze each detected mood and assign the most appropriate and meaningful emoji that best represents that mood. Choose relevant and evocative emojis. If a mood is already an emoji, use it as is. If no appropriate emoji exists for a mood, omit it from moodEmojis (do not use generic emojis).\n\nFor subjectEmoji, choose the emoji that best represents the entry's main subject/title. This is the emoji that will be displayed next to the title in the list. If no appropriate emoji exists, omit subjectEmoji.\n\nFor themeEmojis, analyze each theme and assign the most appropriate and meaningful emoji that best represents that theme. Choose relevant and evocative emojis. If a theme is already an emoji, use it as is. If no appropriate emoji exists for a theme, omit it from themeEmojis (do not use generic emojis like 🏷️). Respond only with JSON, nothing else.\n\nEntry:\n${entryContent}\n\nRespond only with JSON, nothing else.`;

  return `${systemPrompt}\n\n${userPrompt}`;
}

export function buildTemplatePromptPrompt(
  template: EntryTemplate,
  language: 'en' | 'fr',
  previousPrompt?: string
): string {
  const dateLocale = language === 'fr' ? fr : enUS;
  const today = format(new Date(), 'EEEE, MMMM d, yyyy', { locale: dateLocale });
  
  let variationInstruction = '';
  if (previousPrompt) {
    const sanitizedPrompt = sanitizePreviousPrompt(previousPrompt);
    variationInstruction = language === 'fr'
      ? `\n\nIMPORTANT: L'utilisateur a déjà vu cette suggestion précédente:\n"${sanitizedPrompt}"\n\nGénère une NOUVELLE variation COMPLÈTEMENT DIFFÉRENTE et créative. Utilise un angle, un ton, ou une approche totalement différent. Ne répète pas les mêmes idées ou formulations.`
      : `\n\nIMPORTANT: The user has already seen this previous suggestion:\n"${sanitizedPrompt}"\n\nGenerate a NEW COMPLETELY DIFFERENT and creative variation. Use a totally different angle, tone, or approach. Do not repeat the same ideas or formulations.`;
  }
  
  const prompt = language === 'fr'
    ? `L'utilisateur a sélectionné le template "${template.name}" pour son journal intime. Ce template a la structure suivante:\n\nTitre: ${template.title}\n\nStructure du contenu:\n${template.content}\n\nGénère une invite d'écriture personnalisée et engageante basée sur ce template pour aujourd'hui (${today}). L'invite doit encourager l'utilisateur à réfléchir et à écrire en suivant l'esprit et la structure du template, mais de manière personnalisée et adaptée à sa journée.${variationInstruction}`
    : `The user has selected the "${template.name}" template for their journal. This template has the following structure:\n\nTitle: ${template.title}\n\nContent structure:\n${template.content}\n\nGenerate a personalized and engaging writing prompt based on this template for today (${today}). The prompt should encourage the user to reflect and write following the spirit and structure of the template, but in a personalized way adapted to their day.${variationInstruction}`;

  const ending = language === 'fr'
    ? `\n\nRéponds uniquement avec l'invite elle-même, sans explications supplémentaires. L'invite doit être concise (1-2 phrases maximum), personnelle, réfléchie et adaptée au type de template.`
    : `\n\nRespond only with the prompt itself, no additional explanations. The prompt should be concise (1-2 sentences maximum), personal, thoughtful, and adapted to the template type.`;

  return prompt + ending;
}

