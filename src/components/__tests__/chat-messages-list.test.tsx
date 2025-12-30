import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatMessagesList } from '../chat-messages-list';
import { useTranslation } from '@/hooks/use-translation';
import { ChatEmptyState } from '../chat-empty-state';
import { ChatTypingIndicator } from '../chat-typing-indicator';
import { ChatMessage } from '../chat-message';
import { Timestamp } from 'firebase/firestore';
import type { ChatMessage as ChatMessageType } from '@/ai/types/chat';

vi.mock('@/hooks/use-translation');
vi.mock('../chat-empty-state', () => ({
  ChatEmptyState: vi.fn(() => <div>Empty State</div>),
}));
vi.mock('../chat-typing-indicator', () => ({
  ChatTypingIndicator: vi.fn(() => <div>Typing...</div>),
}));
vi.mock('../chat-message', () => ({
  ChatMessage: vi.fn(({ message }) => <div>{message.content}</div>),
}));

describe('ChatMessagesList', () => {
  const mockT = vi.fn((key: string) => key);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTranslation).mockReturnValue({
      t: mockT,
      language: 'en',
      isLoading: false,
      error: null,
    });
  });

  it('should render ChatEmptyState when messages array is empty', () => {
    render(
      <ChatMessagesList messages={[]} isTyping={false} error={null} />
    );

    expect(ChatEmptyState).toHaveBeenCalled();
  });

  it('should not render ChatEmptyState when messages exist', () => {
    const messages: ChatMessageType[] = [
      {
        role: 'user',
        content: 'Hello',
        timestamp: new Date('2024-01-15T14:30:00Z'),
      },
    ];

    render(
      <ChatMessagesList messages={messages} isTyping={false} error={null} />
    );

    expect(ChatEmptyState).not.toHaveBeenCalled();
  });

  it('should render all messages', () => {
    const messages: ChatMessageType[] = [
      {
        role: 'user',
        content: 'Message 1',
        timestamp: new Date('2024-01-15T14:30:00Z'),
      },
      {
        role: 'assistant',
        content: 'Message 2',
        timestamp: new Date('2024-01-15T14:31:00Z'),
      },
    ];

    render(
      <ChatMessagesList messages={messages} isTyping={false} error={null} />
    );

    expect(screen.getByText('Message 1')).toBeInTheDocument();
    expect(screen.getByText('Message 2')).toBeInTheDocument();
    expect(ChatMessage).toHaveBeenCalledTimes(2);
  });

  it('should handle Firebase Timestamp in messages', () => {
    const MockTimestamp = class {
      toMillis() {
        return 1705327800000;
      }
    };
    
    const mockTimestamp = new MockTimestamp() as unknown as Timestamp;
    
    Object.setPrototypeOf(mockTimestamp, Timestamp.prototype);

    const messages: ChatMessageType[] = [
      {
        role: 'user',
        content: 'Test',
        timestamp: mockTimestamp,
      },
    ];

    render(
      <ChatMessagesList messages={messages} isTyping={false} error={null} />
    );

    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('should render ChatTypingIndicator when isTyping is true', () => {
    render(
      <ChatMessagesList messages={[]} isTyping={true} error={null} />
    );

    expect(ChatTypingIndicator).toHaveBeenCalled();
  });

  it('should not render ChatTypingIndicator when isTyping is false', () => {
    render(
      <ChatMessagesList messages={[]} isTyping={false} error={null} />
    );

    expect(ChatTypingIndicator).not.toHaveBeenCalled();
  });

  it('should render error message when error is provided', () => {
    const errorMessage = 'Test error';
    render(
      <ChatMessagesList messages={[]} isTyping={false} error={errorMessage} />
    );

    expect(screen.getByText(/error/i)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(errorMessage))).toBeInTheDocument();
  });

  it('should not render error message when error is null', () => {
    render(
      <ChatMessagesList messages={[]} isTyping={false} error={null} />
    );

    expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
  });

  it('should generate unique keys for messages', () => {
    const messages: ChatMessageType[] = [
      {
        role: 'user',
        content: 'Message 1',
        timestamp: new Date('2024-01-15T14:30:00Z'),
      },
      {
        role: 'assistant',
        content: 'Message 2',
        timestamp: new Date('2024-01-15T14:30:00Z'),
      },
    ];

    render(
      <ChatMessagesList messages={messages} isTyping={false} error={null} />
    );

    const {calls} = vi.mocked(ChatMessage).mock;
    expect(calls.length).toBeGreaterThanOrEqual(2);
  });
});

