import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EntryContentForm } from '../entry-content-form';
import { useTranslation } from '@/hooks/use-translation';
import { AiPromptSuggestion } from '@/components/ai-prompt-suggestion';

vi.mock('@/hooks/use-translation');
vi.mock('@/components/ai-prompt-suggestion', () => ({
  AiPromptSuggestion: vi.fn(() => null),
}));

describe('EntryContentForm', () => {
  const mockT = vi.fn((key: string) => key);
  const mockOnContentChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTranslation).mockReturnValue({
      t: mockT,
      language: 'en',
      isLoading: false,
      error: null,
    });
  });

  it('should render textarea with content', () => {
    render(
      <EntryContentForm
        content="Test content"
        recentEntries={[]}
        onContentChange={mockOnContentChange}
      />
    );

    const textarea = screen.getByPlaceholderText('writeYourThoughts');
    expect(textarea).toHaveValue('Test content');
  });

  it('should call onContentChange when textarea value changes', async () => {
    const user = userEvent.setup();
    render(
      <EntryContentForm
        content=""
        recentEntries={[]}
        onContentChange={mockOnContentChange}
      />
    );

    const textarea = screen.getByPlaceholderText('writeYourThoughts');
    await user.type(textarea, 'N');

    expect(mockOnContentChange).toHaveBeenCalled();
    const {calls} = mockOnContentChange.mock;
    expect(calls.length).toBeGreaterThan(0);
    expect(calls[calls.length - 1]?.[0]).toBe('N');
  });

  it('should render title when provided', () => {
    render(
      <EntryContentForm
        content="Test content"
        title="Test Title"
        recentEntries={[]}
        onContentChange={mockOnContentChange}
      />
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('should not render title section when title is not provided', () => {
    const { container } = render(
      <EntryContentForm
        content="Test content"
        recentEntries={[]}
        onContentChange={mockOnContentChange}
      />
    );

    const titleSection = container.querySelector('h2');
    expect(titleSection).not.toBeInTheDocument();
  });

  it('should show AiPromptSuggestion when content is empty', () => {
    render(
      <EntryContentForm
        content=""
        recentEntries={[]}
        onContentChange={mockOnContentChange}
      />
    );

    expect(AiPromptSuggestion).toHaveBeenCalled();
    const callArgs = vi.mocked(AiPromptSuggestion).mock.calls[0];
    expect(callArgs?.[0]).toMatchObject({
      recentEntries: [],
      onPromptSelected: expect.any(Function),
    });
  });

  it('should not show AiPromptSuggestion when content is not empty', () => {
    render(
      <EntryContentForm
        content="Some content"
        recentEntries={[]}
        onContentChange={mockOnContentChange}
      />
    );

    expect(AiPromptSuggestion).not.toHaveBeenCalled();
  });

  it('should show AiPromptSuggestion when content has only whitespace', () => {
    render(
      <EntryContentForm
        content="   "
        recentEntries={[]}
        onContentChange={mockOnContentChange}
      />
    );

    expect(AiPromptSuggestion).toHaveBeenCalled();
  });

  it('should pass recentEntries to AiPromptSuggestion', () => {
    const recentEntries = [
      { content: 'Entry 1', date: '2024-01-01' },
      { content: 'Entry 2', date: '2024-01-02' },
    ];

    render(
      <EntryContentForm
        content=""
        recentEntries={recentEntries}
        onContentChange={mockOnContentChange}
      />
    );

    expect(AiPromptSuggestion).toHaveBeenCalled();
    const callArgs = vi.mocked(AiPromptSuggestion).mock.calls[0];
    expect(callArgs?.[0]).toMatchObject({
      recentEntries,
    });
  });

  it('should call onContentChange when prompt is selected', () => {
    let promptCallback: ((prompt: string) => void) | undefined;

    vi.mocked(AiPromptSuggestion).mockImplementation((props) => {
      promptCallback = props.onPromptSelected;
      return null;
    });

    render(
      <EntryContentForm
        content=""
        recentEntries={[]}
        onContentChange={mockOnContentChange}
      />
    );

    if (promptCallback) {
      promptCallback('Selected prompt');
    }

    expect(mockOnContentChange).toHaveBeenCalledWith('Selected prompt');
  });
});

