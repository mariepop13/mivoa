import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { JournalEntryStatus } from '../journal-entry-status';
import { useTranslation } from '@/hooks/use-translation';

vi.mock('@/hooks/use-translation');

describe('JournalEntryStatus', () => {
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

  it('should return null when not loading, not saved, and no error', () => {
    const { container } = render(
      <JournalEntryStatus isLoading={false} isSaved={false} error={null} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should display loading state', () => {
    const { container } = render(<JournalEntryStatus isLoading={true} isSaved={false} error={null} />);

    expect(screen.getByText('saving')).toBeInTheDocument();
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should display saved state', () => {
    render(<JournalEntryStatus isLoading={false} isSaved={true} error={null} />);

    expect(screen.getByText('saved')).toBeInTheDocument();
    const checkmark = screen.getByText('✓');
    expect(checkmark).toBeInTheDocument();
  });

  it('should display error state', () => {
    const errorMessage = 'Test error message';
    render(
      <JournalEntryStatus isLoading={false} isSaved={false} error={errorMessage} />
    );

    expect(screen.getByText(/error/i)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(errorMessage))).toBeInTheDocument();
    const warning = screen.getByText('⚠️');
    expect(warning).toBeInTheDocument();
  });

  it('should prioritize loading over saved state', () => {
    render(<JournalEntryStatus isLoading={true} isSaved={true} error={null} />);

    expect(screen.getByText('saving')).toBeInTheDocument();
    expect(screen.queryByText('saved')).not.toBeInTheDocument();
  });

  it('should prioritize error over saved state', () => {
    render(
      <JournalEntryStatus isLoading={false} isSaved={true} error="Error occurred" />
    );

    expect(screen.getByText(/error/i)).toBeInTheDocument();
    expect(screen.queryByText('saved')).not.toBeInTheDocument();
  });
});

