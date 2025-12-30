import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WordCountBadge } from '../word-count-badge';
import { useTranslation } from '@/hooks/use-translation';
import { useWordCount } from '@/hooks/use-word-count';

vi.mock('@/hooks/use-translation');
vi.mock('@/hooks/use-word-count');

describe('WordCountBadge', () => {
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

  it('should render word and character count', () => {
    vi.mocked(useWordCount).mockReturnValue({
      wordCount: 5,
      characterCount: 25,
    });

    render(<WordCountBadge content="This is a test content" />);

    const badge = screen.getByRole('status');
    expect(badge.textContent).toBe('5 words · 25 charactersCount');
  });

  it('should use singular form for 1 word', () => {
    vi.mocked(useWordCount).mockReturnValue({
      wordCount: 1,
      characterCount: 4,
    });

    render(<WordCountBadge content="Test" />);

    expect(mockT).toHaveBeenCalledWith('word');
    expect(mockT).not.toHaveBeenCalledWith('words');
  });

  it('should use plural form for multiple words', () => {
    vi.mocked(useWordCount).mockReturnValue({
      wordCount: 2,
      characterCount: 9,
    });

    render(<WordCountBadge content="Test content" />);

    expect(mockT).toHaveBeenCalledWith('words');
  });

  it('should use singular form for 1 character', () => {
    vi.mocked(useWordCount).mockReturnValue({
      wordCount: 1,
      characterCount: 1,
    });

    render(<WordCountBadge content="A" />);

    expect(mockT).toHaveBeenCalledWith('character');
    expect(mockT).not.toHaveBeenCalledWith('charactersCount');
  });

  it('should use plural form for multiple characters', () => {
    vi.mocked(useWordCount).mockReturnValue({
      wordCount: 1,
      characterCount: 5,
    });

    render(<WordCountBadge content="Hello" />);

    expect(mockT).toHaveBeenCalledWith('charactersCount');
  });

  it('should display formatted numbers with k notation for large numbers', () => {
    vi.mocked(useWordCount).mockReturnValue({
      wordCount: 1500,
      characterCount: 8000,
    });

    render(<WordCountBadge content="Large content" />);

    const badge = screen.getByRole('status');
    expect(badge.textContent).toBe('1.5k words · 8.0k charactersCount');
  });

  it('should handle empty content', () => {
    vi.mocked(useWordCount).mockReturnValue({
      wordCount: 0,
      characterCount: 0,
    });

    render(<WordCountBadge content="" />);

    const badge = screen.getByRole('status');
    expect(badge.textContent).toBe('0 words · 0 charactersCount');
    expect(mockT).toHaveBeenCalledWith('words');
    expect(mockT).toHaveBeenCalledWith('charactersCount');
  });

  it('should call useWordCount with content prop', () => {
    const content = 'Test content';
    render(<WordCountBadge content={content} />);

    expect(useWordCount).toHaveBeenCalledWith(content);
  });
});

