import { generateChatCompletion } from './openrouter-client';
import type { ChatMessage, ConversationSummary } from '../types/chat';

const MAX_SUMMARY_TOKENS = 2000;
const DEFAULT_SUMMARY_TITLE = 'Journal Entry';
const MAX_INSIGHTS_COUNT = 5;

function parseSummaryResponse(response: string): ConversationSummary {
  try {
    const cleaned = response.trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]) as ConversationSummary;
    
    return {
      title: parsed.title || DEFAULT_SUMMARY_TITLE,
      content: parsed.content || '',
      insights: Array.isArray(parsed.insights) ? parsed.insights.slice(0, MAX_INSIGHTS_COUNT) : [],
    };
  } catch (error) {
    console.error('Failed to parse summary response:', error);
    throw new Error('Failed to parse summary response');
  }
}

function formatConversationText(conversationHistory: ChatMessage[]): string {
  return conversationHistory
    .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
    .join('\n\n');
}

function buildSystemPrompt(language: 'en' | 'fr'): string {
  const systemPromptFr = `Tu es un assistant qui génère des résumés de conversations de journal 
    intime. Crée un résumé cohérent et réfléchi de la conversation sous forme d'entrée de journal. 
    Réponds UNIQUEMENT avec un objet JSON valide, sans texte supplémentaire.`;
  const systemPromptEn = `You are an assistant that generates journal entry summaries from 
    conversations. Create a coherent and thoughtful summary of the conversation as a journal entry. 
    Respond ONLY with a valid JSON object, no additional text.`;
  return language === 'fr' ? systemPromptFr : systemPromptEn;
}

function buildUserPrompt(language: 'en' | 'fr', conversationText: string): string {
  const contentDescFr = 'contenu principal de l\'entrée de journal ' +
    '(narrative cohérente basée sur la conversation, 2-4 paragraphes)';
  const jsonSchemaFr = `{
  "title": "titre suggéré pour l'entrée (1-2 phrases courtes)",
  "content": "${contentDescFr}",
  "insights": ["points clés ou insights principaux (max 3-5, phrases courtes)"]
}`;

  const contentDescEn = 'main content of the journal entry ' +
    '(coherent narrative based on the conversation, 2-4 paragraphs)';
  const jsonSchemaEn = `{
  "title": "suggested title for the entry (1-2 short sentences)",
  "content": "${contentDescEn}",
  "insights": ["key points or main insights (max 3-5, short phrases)"]
}`;

  const userPromptFr = `Analyse cette conversation de journal intime et génère un résumé sous 
    forme d'entrée de journal au format JSON:\n\n${jsonSchemaFr}\n\nConversation:\n${conversationText}\n\n
    Réponds uniquement avec le JSON, rien d'autre.`;
  const userPromptEn = `Analyze this journaling conversation and generate a summary as a journal 
    entry in JSON format:\n\n${jsonSchemaEn}\n\nConversation:\n${conversationText}\n\n
    Respond only with JSON, nothing else.`;
  return language === 'fr' ? userPromptFr : userPromptEn;
}

export async function generateConversationSummary(
  conversationHistory: ChatMessage[],
  apiKey: string,
  language: 'en' | 'fr',
  model?: string
): Promise<ConversationSummary> {
  if (conversationHistory.length === 0) {
    throw new Error('Cannot generate summary from empty conversation');
  }

  const conversationText = formatConversationText(conversationHistory);
  const systemPrompt = buildSystemPrompt(language);
  const userPrompt = buildUserPrompt(language, conversationText);

  const response = await generateChatCompletion(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    apiKey,
    {
      model,
      temperature: 0.5,
      max_tokens: MAX_SUMMARY_TOKENS,
    }
  );

  return parseSummaryResponse(response);
}

