import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { JournalChat } from '../journal-chat';
import { useChatConversation } from '@/hooks/use-chat-conversation';
import { LanguageContext, SUPPORTED_LANGUAGES } from '@/context/LanguageContext';

vi.mock('@/hooks/use-chat-conversation');
vi.mock('@/hooks/use-translation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockOnSummarize = vi.fn();

const mockMessages = [
  {
    role: 'assistant' as const,
    content: 'Initial message',
    timestamp: new Date('2024-01-15T10:00:00Z'),
  },
  {
    role: 'user' as const,
    content: 'User message',
    timestamp: new Date('2024-01-15T10:01:00Z'),
  },
];

const renderWithContext = (props = {}) => render(
    <LanguageContext.Provider value={{ language: 'en', setLanguage: vi.fn(), supportedLanguages: SUPPORTED_LANGUAGES }}>
      <JournalChat onSummarize={mockOnSummarize} {...props} />
    </LanguageContext.Provider>
  );

const createMockUseChatConversationReturn = (overrides = {}) => ({
  messages: [],
  isTyping: false,
  error: null,
  sendMessage: vi.fn().mockResolvedValue(undefined),
  resetConversation: vi.fn().mockResolvedValue(undefined),
  loadConversation: vi.fn(),
  editMessage: vi.fn().mockResolvedValue(undefined),
  regenerateFrom: vi.fn().mockResolvedValue(undefined),
  deleteMessage: vi.fn().mockResolvedValue(undefined),
  isEditing: false,
  isRegenerating: false,
  draftId: null,
  ...overrides,
});

describe('JournalChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useChatConversation).mockReturnValue(createMockUseChatConversationReturn());
  });

  it('renders chat interface', () => {
    renderWithContext();
    expect(screen.getByPlaceholderText('typeMessage')).toBeInTheDocument();
  });

  it('displays messages', () => {
    vi.mocked(useChatConversation).mockReturnValue(createMockUseChatConversationReturn({
      messages: mockMessages,
    }));

    renderWithContext();
    expect(screen.getByText('Initial message')).toBeInTheDocument();
    expect(screen.getByText('User message')).toBeInTheDocument();
  });

  it('sends message when send button is clicked', async () => {
    const mockSendMessage = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useChatConversation).mockReturnValue(createMockUseChatConversationReturn({
      sendMessage: mockSendMessage,
    }));

    renderWithContext();
    const textarea = screen.getByPlaceholderText('typeMessage');
    const sendButton = screen.getByRole('button', { name: /send/i });

    fireEvent.change(textarea, { target: { value: 'Test message' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith('Test message');
    });
  });

  it('sends message when Enter key is pressed', async () => {
    const mockSendMessage = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useChatConversation).mockReturnValue(createMockUseChatConversationReturn({
      sendMessage: mockSendMessage,
    }));

    renderWithContext();
    const textarea = screen.getByPlaceholderText('typeMessage');

    fireEvent.change(textarea, { target: { value: 'Test message' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith('Test message');
    });
  });

  it('does not send message when Shift+Enter is pressed', () => {
    const mockSendMessage = vi.fn();
    vi.mocked(useChatConversation).mockReturnValue(createMockUseChatConversationReturn({
      sendMessage: mockSendMessage,
    }));

    renderWithContext();
    const textarea = screen.getByPlaceholderText('typeMessage');

    fireEvent.change(textarea, { target: { value: 'Test message' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });

    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it('displays error message', () => {
    vi.mocked(useChatConversation).mockReturnValue(createMockUseChatConversationReturn({
      error: 'Test error',
    }));

    renderWithContext();
    expect(screen.getByText(/error.*Test error/i)).toBeInTheDocument();
  });

  it('shows summarize button when there are enough messages', () => {
    vi.mocked(useChatConversation).mockReturnValue(createMockUseChatConversationReturn({
      messages: mockMessages,
    }));

    renderWithContext();
    expect(screen.getByText('summarizeConversation')).toBeInTheDocument();
  });

  it('calls onSummarize when summarize button is clicked', () => {
    vi.mocked(useChatConversation).mockReturnValue(createMockUseChatConversationReturn({
      messages: mockMessages,
    }));

    renderWithContext();
    const summarizeButton = screen.getByText('summarizeConversation');
    fireEvent.click(summarizeButton);

    expect(mockOnSummarize).toHaveBeenCalledWith([
      {
        role: 'assistant',
        content: 'Initial message',
        timestamp: expect.any(Date),
      },
      {
        role: 'user',
        content: 'User message',
        timestamp: expect.any(Date),
      },
    ], null);
  });

  it('disables input when typing', () => {
    vi.mocked(useChatConversation).mockReturnValue(createMockUseChatConversationReturn({
      isTyping: true,
    }));

    renderWithContext();
    const textarea = screen.getByPlaceholderText('typeMessage');
    expect(textarea).toBeDisabled();
  });

  it('shows loading state for summary generation', () => {
    vi.mocked(useChatConversation).mockReturnValue(createMockUseChatConversationReturn({
      messages: mockMessages,
    }));

    renderWithContext({ isLoadingSummary: true });
    expect(screen.getByText('generatingSummary')).toBeInTheDocument();
  });
});

