import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AiPromptSuggestion } from '../ai-prompt-suggestion';
import { useJournalPrompts } from '@/hooks/use-journal-prompts';
import { useTranslation } from '@/hooks/use-translation';

vi.mock('@/hooks/use-journal-prompts');
vi.mock('@/hooks/use-translation');

describe('AiPromptSuggestion', () => {
  const mockT = vi.fn((key: string) => key);
  const mockOnPromptSelected = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTranslation).mockReturnValue({
      t: mockT,
      language: 'en',
      isLoading: false,
      error: null,
    });
  });

  it('should return null when there is an error and no prompt', () => {
    vi.mocked(useJournalPrompts).mockReturnValue({
      prompt: null,
      isLoading: false,
      error: 'Error message',
      regenerate: vi.fn(),
    });

    const { container } = render(
      <AiPromptSuggestion recentEntries={[]} onPromptSelected={mockOnPromptSelected} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should return null when there is no prompt and not loading', () => {
    vi.mocked(useJournalPrompts).mockReturnValue({
      prompt: null,
      isLoading: false,
      error: null,
      regenerate: vi.fn(),
    });

    const { container } = render(
      <AiPromptSuggestion recentEntries={[]} onPromptSelected={mockOnPromptSelected} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should display loading state', () => {
    vi.mocked(useJournalPrompts).mockReturnValue({
      prompt: null,
      isLoading: true,
      error: null,
      regenerate: vi.fn(),
    });

    render(<AiPromptSuggestion recentEntries={[]} />);

    expect(screen.getByText('generatingPrompt')).toBeInTheDocument();
  });

  it('should display prompt when available', () => {
    const mockPrompt = 'What are you grateful for today?';
    vi.mocked(useJournalPrompts).mockReturnValue({
      prompt: mockPrompt,
      isLoading: false,
      error: null,
      regenerate: vi.fn(),
    });

    render(<AiPromptSuggestion recentEntries={[]} onPromptSelected={mockOnPromptSelected} />);

    expect(screen.getByText(mockPrompt)).toBeInTheDocument();
    expect(screen.getByText('useThisPrompt')).toBeInTheDocument();
  });

  it('should call onPromptSelected when use button is clicked', async () => {
    const user = userEvent.setup();
    const mockPrompt = 'Test prompt';
    vi.mocked(useJournalPrompts).mockReturnValue({
      prompt: mockPrompt,
      isLoading: false,
      error: null,
      regenerate: vi.fn(),
    });

    render(<AiPromptSuggestion recentEntries={[]} onPromptSelected={mockOnPromptSelected} />);

    const useButton = screen.getByText('useThisPrompt');
    await user.click(useButton);

    expect(mockOnPromptSelected).toHaveBeenCalledWith(mockPrompt);
  });

  it('should not show use button when onPromptSelected is not provided', () => {
    const mockPrompt = 'Test prompt';
    vi.mocked(useJournalPrompts).mockReturnValue({
      prompt: mockPrompt,
      isLoading: false,
      error: null,
      regenerate: vi.fn(),
    });

    render(<AiPromptSuggestion recentEntries={[]} />);

    expect(screen.queryByText('useThisPrompt')).not.toBeInTheDocument();
  });

  it('should call regenerate when regenerate button is clicked', async () => {
    const user = userEvent.setup();
    const mockRegenerate = vi.fn();
    vi.mocked(useJournalPrompts).mockReturnValue({
      prompt: 'Test prompt',
      isLoading: false,
      error: null,
      regenerate: mockRegenerate,
    });

    render(<AiPromptSuggestion recentEntries={[]} />);

    const regenerateButton = screen.getByText('regenerate');
    await user.click(regenerateButton);

    expect(mockRegenerate).toHaveBeenCalledTimes(1);
  });

  it('should disable regenerate button when loading', () => {
    vi.mocked(useJournalPrompts).mockReturnValue({
      prompt: 'Test prompt',
      isLoading: true,
      error: null,
      regenerate: vi.fn(),
    });

    render(<AiPromptSuggestion recentEntries={[]} />);

    const regenerateButton = screen.getByText('regenerate');
    expect(regenerateButton).toBeDisabled();
  });
});

