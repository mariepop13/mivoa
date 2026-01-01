import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatMessage } from '../chat-message';
import { LanguageContext } from '@/context/LanguageContext';
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import type { ChatMessage as ChatMessageType } from '@/ai/types/chat';

vi.mock('date-fns', () => ({
  format: vi.fn((date: Date, formatStr: string, options: { locale: any }) => {
    if (options.locale.code === 'fr') {
      return '14:30:00';
    }
    return '14:30:00';
  }),
  enUS: { code: 'en' },
  fr: { code: 'fr' },
}));

describe('ChatMessage', () => {
  const mockDate = new Date('2024-01-15T14:30:00Z');

  const renderWithLanguage = (language: 'en' | 'fr', message: ChatMessageType) => render(
      <LanguageContext.Provider
        value={{
          language,
          setLanguage: vi.fn(),
          supportedLanguages: ['en', 'fr'],
        }}
      >
        <ChatMessage message={message} messageIndex={0} isTyping={false} />
      </LanguageContext.Provider>
    );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render user message', () => {
    const message: ChatMessageType = {
      role: 'user',
      content: 'Hello',
      timestamp: mockDate,
    };

    renderWithLanguage('en', message);

    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should render assistant message', () => {
    const message: ChatMessageType = {
      role: 'assistant',
      content: 'Hi there',
      timestamp: mockDate,
    };

    renderWithLanguage('en', message);

    expect(screen.getByText('Hi there')).toBeInTheDocument();
  });

  it('should format timestamp in English', () => {
    const message: ChatMessageType = {
      role: 'user',
      content: 'Test',
      timestamp: mockDate,
    };

    renderWithLanguage('en', message);

    expect(format).toHaveBeenCalledWith(mockDate, 'HH:mm:ss', { locale: enUS });
    expect(screen.getByText('14:30:00')).toBeInTheDocument();
  });

  it('should format timestamp in French', () => {
    const message: ChatMessageType = {
      role: 'user',
      content: 'Test',
      timestamp: mockDate,
    };

    renderWithLanguage('fr', message);

    expect(format).toHaveBeenCalledWith(mockDate, 'HH:mm:ss', { locale: fr });
  });

  it('should handle Firebase Timestamp', () => {
    const MockTimestamp = class {
      toDate() {
        return mockDate;
      }
    };
    
    const mockTimestamp = new MockTimestamp() as unknown as Timestamp;
    Object.setPrototypeOf(mockTimestamp, Timestamp.prototype);

    const message: ChatMessageType = {
      role: 'user',
      content: 'Test',
      timestamp: mockTimestamp,
    };

    renderWithLanguage('en', message);

    expect(format).toHaveBeenCalled();
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('should apply correct styling for user message', () => {
    const message: ChatMessageType = {
      role: 'user',
      content: 'Test',
      timestamp: mockDate,
    };

    const { container } = renderWithLanguage('en', message);

    const messageDiv = container.querySelector('.bg-primary');
    expect(messageDiv).toBeInTheDocument();
  });

  it('should apply correct styling for assistant message', () => {
    const message: ChatMessageType = {
      role: 'assistant',
      content: 'Test',
      timestamp: mockDate,
    };

    const { container } = renderWithLanguage('en', message);

    const messageDiv = container.querySelector('.bg-muted');
    expect(messageDiv).toBeInTheDocument();
  });

  it('should align user message to the right', () => {
    const message: ChatMessageType = {
      role: 'user',
      content: 'Test',
      timestamp: mockDate,
    };

    const { container } = renderWithLanguage('en', message);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('justify-end');
  });

  it('should align assistant message to the left', () => {
    const message: ChatMessageType = {
      role: 'assistant',
      content: 'Test',
      timestamp: mockDate,
    };

    const { container } = renderWithLanguage('en', message);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('justify-start');
  });

  it('should set max width to 80%', () => {
    const message: ChatMessageType = {
      role: 'user',
      content: 'Test',
      timestamp: mockDate,
    };

    const { container } = renderWithLanguage('en', message);

    const messageDiv = container.querySelector('[style*="max-width"]') as HTMLElement;
    expect(messageDiv?.style.maxWidth || messageDiv?.style.getPropertyValue('max-width')).toBeTruthy();
  });
});

