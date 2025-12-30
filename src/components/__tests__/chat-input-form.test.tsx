import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatInputForm } from '../chat-input-form';
import { useTranslation } from '@/hooks/use-translation';

vi.mock('@/hooks/use-translation');

describe('ChatInputForm', () => {
  const mockT = vi.fn((key: string) => key);
  const mockOnSend = vi.fn();
  const mockOnSummarize = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTranslation).mockReturnValue({
      t: mockT,
      language: 'en',
      isLoading: false,
      error: null,
    });
  });

  it('should render textarea and send button', () => {
    render(
      <ChatInputForm
        onSend={mockOnSend}
        isTyping={false}
        canSummarize={false}
        onSummarize={mockOnSummarize}
        isLoadingSummary={false}
      />
    );

    expect(screen.getByPlaceholderText('typeMessage')).toBeInTheDocument();
    expect(screen.getByLabelText('send')).toBeInTheDocument();
  });

  it('should update input value when typing', async () => {
    const user = userEvent.setup();
    render(
      <ChatInputForm
        onSend={mockOnSend}
        isTyping={false}
        canSummarize={false}
        onSummarize={mockOnSummarize}
        isLoadingSummary={false}
      />
    );

    const textarea = screen.getByPlaceholderText('typeMessage');
    await user.type(textarea, 'Hello world');

    expect(textarea).toHaveValue('Hello world');
  });

  it('should call onSend when send button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ChatInputForm
        onSend={mockOnSend}
        isTyping={false}
        canSummarize={false}
        onSummarize={mockOnSummarize}
        isLoadingSummary={false}
      />
    );

    const textarea = screen.getByPlaceholderText('typeMessage');
    await user.type(textarea, 'Test message');
    const sendButton = screen.getByLabelText('send');
    await user.click(sendButton);

    expect(mockOnSend).toHaveBeenCalledWith('Test message');
    expect(textarea).toHaveValue('');
  });

  it('should call onSend when Enter is pressed', async () => {
    const user = userEvent.setup();
    render(
      <ChatInputForm
        onSend={mockOnSend}
        isTyping={false}
        canSummarize={false}
        onSummarize={mockOnSummarize}
        isLoadingSummary={false}
      />
    );

    const textarea = screen.getByPlaceholderText('typeMessage');
    await user.type(textarea, 'Test message{Enter}');

    expect(mockOnSend).toHaveBeenCalledWith('Test message');
  });

  it('should not send when Shift+Enter is pressed', async () => {
    const user = userEvent.setup();
    render(
      <ChatInputForm
        onSend={mockOnSend}
        isTyping={false}
        canSummarize={false}
        onSummarize={mockOnSummarize}
        isLoadingSummary={false}
      />
    );

    const textarea = screen.getByPlaceholderText('typeMessage');
    await user.type(textarea, 'Line 1');
    await user.keyboard('{Shift>}{Enter}{/Shift}');
    await user.type(textarea, 'Line 2');

    expect(mockOnSend).not.toHaveBeenCalled();
    expect(textarea).toHaveValue('Line 1\nLine 2');
  });

  it('should disable send button when input is empty', () => {
    render(
      <ChatInputForm
        onSend={mockOnSend}
        isTyping={false}
        canSummarize={false}
        onSummarize={mockOnSummarize}
        isLoadingSummary={false}
      />
    );

    const sendButton = screen.getByLabelText('send');
    expect(sendButton).toBeDisabled();
  });

  it('should disable textarea and send button when isTyping is true', () => {
    render(
      <ChatInputForm
        onSend={mockOnSend}
        isTyping={true}
        canSummarize={false}
        onSummarize={mockOnSummarize}
        isLoadingSummary={false}
      />
    );

    const textarea = screen.getByPlaceholderText('typeMessage');
    const sendButton = screen.getByLabelText('send');

    expect(textarea).toBeDisabled();
    expect(sendButton).toBeDisabled();
  });

  it('should not send when isTyping is true', async () => {
    const user = userEvent.setup();
    render(
      <ChatInputForm
        onSend={mockOnSend}
        isTyping={true}
        canSummarize={false}
        onSummarize={mockOnSummarize}
        isLoadingSummary={false}
      />
    );

    const textarea = screen.getByPlaceholderText('typeMessage');
    await user.type(textarea, 'Test');

    expect(mockOnSend).not.toHaveBeenCalled();
  });

  it('should show summarize button when canSummarize is true', () => {
    render(
      <ChatInputForm
        onSend={mockOnSend}
        isTyping={false}
        canSummarize={true}
        onSummarize={mockOnSummarize}
        isLoadingSummary={false}
      />
    );

    expect(screen.getByText('summarizeConversation')).toBeInTheDocument();
  });

  it('should not show summarize button when canSummarize is false', () => {
    render(
      <ChatInputForm
        onSend={mockOnSend}
        isTyping={false}
        canSummarize={false}
        onSummarize={mockOnSummarize}
        isLoadingSummary={false}
      />
    );

    expect(screen.queryByText('summarizeConversation')).not.toBeInTheDocument();
  });

  it('should call onSummarize when summarize button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ChatInputForm
        onSend={mockOnSend}
        isTyping={false}
        canSummarize={true}
        onSummarize={mockOnSummarize}
        isLoadingSummary={false}
      />
    );

    const summarizeButton = screen.getByText('summarizeConversation');
    await user.click(summarizeButton);

    expect(mockOnSummarize).toHaveBeenCalledTimes(1);
  });

  it('should disable summarize button when isLoadingSummary is true', () => {
    render(
      <ChatInputForm
        onSend={mockOnSend}
        isTyping={false}
        canSummarize={true}
        onSummarize={mockOnSummarize}
        isLoadingSummary={true}
      />
    );

    const summarizeButton = screen.getByText('generatingSummary');
    expect(summarizeButton).toBeDisabled();
  });

  it('should show generatingSummary text when isLoadingSummary is true', () => {
    render(
      <ChatInputForm
        onSend={mockOnSend}
        isTyping={false}
        canSummarize={true}
        onSummarize={mockOnSummarize}
        isLoadingSummary={true}
      />
    );

    expect(screen.getByText('generatingSummary')).toBeInTheDocument();
    expect(screen.queryByText('summarizeConversation')).not.toBeInTheDocument();
  });
});

