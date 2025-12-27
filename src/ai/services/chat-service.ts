import { generateChatCompletion } from './openrouter-client';
import type { ChatMessage } from '../types/chat';

const CHAT_MAX_TOKENS = 1000;
const CHAT_TEMPERATURE = 0.8;

const SYSTEM_PROMPT_EN = `You are a thoughtful and empathetic journaling assistant. Your role is to help users reflect on their thoughts and feelings through conversation. Ask open-ended questions that encourage deeper reflection. Be warm, supportive, and genuinely curious about the user's experiences. Keep responses conversational and natural.`;

const SYSTEM_PROMPT_FR = `Tu es un assistant de journal intime attentionné et empathique. Ton rôle est d'aider les utilisateurs à réfléchir sur leurs pensées et émotions par la conversation. Pose des questions ouvertes qui encouragent une réflexion plus approfondie. Sois chaleureux, bienveillant et vraiment curieux des expériences de l'utilisateur. Garde les réponses conversationnelles et naturelles.`;

function buildConversationMessages(
  conversationHistory: ChatMessage[],
  language: 'en' | 'fr'
): Array<{ role: 'user' | 'assistant' | 'system'; content: string }> {
  const systemPrompt = language === 'fr' ? SYSTEM_PROMPT_FR : SYSTEM_PROMPT_EN;
  
  const messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [
    { role: 'system', content: systemPrompt },
  ];

  conversationHistory.forEach((msg) => {
    messages.push({
      role: msg.role,
      content: msg.content,
    });
  });

  return messages;
}

export async function sendChatMessage(
  conversationHistory: ChatMessage[],
  userMessage: string,
  apiKey: string,
  language: 'en' | 'fr'
): Promise<string> {
  const messages = buildConversationMessages(conversationHistory, language);
  messages.push({ role: 'user', content: userMessage });

  const response = await generateChatCompletion(messages, apiKey, {
    temperature: CHAT_TEMPERATURE,
    max_tokens: CHAT_MAX_TOKENS,
  });

  return response.trim();
}

export function generateInitialMessage(language: 'en' | 'fr'): string {
  if (language === 'fr') {
    return "Bonjour ! Je suis là pour t'aider à réfléchir sur ta journée. De quoi aimerais-tu parler aujourd'hui ? Qu'est-ce qui t'a marqué ou qui te préoccupe ?";
  }
  return "Hello! I'm here to help you reflect on your day. What would you like to talk about today? What stood out to you or what's on your mind?";
}

