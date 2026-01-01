import type { ChatMessage } from '@/ai/types/chat';

export function truncateConversation(
  messages: ChatMessage[],
  upToIndex: number
): ChatMessage[] {
  if (upToIndex < 0 || upToIndex >= messages.length) {
    return messages;
  }
  return messages.slice(0, upToIndex + 1);
}

export function canEditMessage(
  message: ChatMessage,
  isTyping: boolean
): boolean {
  if (isTyping) {
    return false;
  }
  if (message.role !== 'user') {
    return false;
  }
  return true;
}

