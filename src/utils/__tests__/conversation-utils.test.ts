import { describe, it, expect } from 'vitest';
import { truncateConversation, canEditMessage } from '../conversation-utils';
import type { ChatMessage } from '@/ai/types/chat';

describe('conversation-utils', () => {
  describe('truncateConversation', () => {
    const createMessages = (count: number): ChatMessage[] => {
      return Array.from({ length: count }, (_, i) => ({
        role: i % 2 === 0 ? ('user' as const) : ('assistant' as const),
        content: `Message ${i}`,
        timestamp: new Date(),
      }));
    };

    it('should return all messages when index is at end', () => {
      const messages = createMessages(5);
      const result = truncateConversation(messages, 4);
      expect(result).toHaveLength(5);
      expect(result).toEqual(messages);
    });

    it('should truncate to specified index', () => {
      const messages = createMessages(5);
      const result = truncateConversation(messages, 2);
      expect(result).toHaveLength(3);
      expect(result).toEqual(messages.slice(0, 3));
    });

    it('should return all messages when index is negative', () => {
      const messages = createMessages(5);
      const result = truncateConversation(messages, -1);
      expect(result).toHaveLength(5);
      expect(result).toEqual(messages);
    });

    it('should return all messages when index is out of bounds', () => {
      const messages = createMessages(5);
      const result = truncateConversation(messages, 10);
      expect(result).toHaveLength(5);
      expect(result).toEqual(messages);
    });

    it('should handle empty array', () => {
      const result = truncateConversation([], 0);
      expect(result).toHaveLength(0);
    });

    it('should include message at index', () => {
      const messages = createMessages(5);
      const result = truncateConversation(messages, 2);
      expect(result[2]).toEqual(messages[2]);
    });
  });

  describe('canEditMessage', () => {
    const createUserMessage = (): ChatMessage => ({
      role: 'user',
      content: 'User message',
      timestamp: new Date(),
    });

    const createAssistantMessage = (): ChatMessage => ({
      role: 'assistant',
      content: 'Assistant message',
      timestamp: new Date(),
    });

    it('should return false when typing', () => {
      const message = createUserMessage();
      const result = canEditMessage(message, true);
      expect(result).toBe(false);
    });

    it('should return false for assistant message', () => {
      const message = createAssistantMessage();
      const result = canEditMessage(message, false);
      expect(result).toBe(false);
    });

    it('should return true for user message when not typing', () => {
      const message = createUserMessage();
      const result = canEditMessage(message, false);
      expect(result).toBe(true);
    });

    it('should return false for assistant message even when not typing', () => {
      const message = createAssistantMessage();
      const result = canEditMessage(message, false);
      expect(result).toBe(false);
    });
  });
});

