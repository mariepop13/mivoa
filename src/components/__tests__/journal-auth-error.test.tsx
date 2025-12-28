import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { JournalAuthError } from '../journal-auth-error';
import { useTranslation } from '@/hooks/use-translation';

vi.mock('@/hooks/use-translation');

describe('JournalAuthError', () => {
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

  it('should render the error message', () => {
    const errorMessage = 'Authentication failed';
    render(<JournalAuthError error={errorMessage} />);

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('should render the authentication error heading', () => {
    render(<JournalAuthError error="Test error" />);

    expect(screen.getByText('authenticationError')).toBeInTheDocument();
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('authenticationError');
  });

  it('should call useTranslation', () => {
    render(<JournalAuthError error="Test error" />);

    expect(useTranslation).toHaveBeenCalled();
    expect(mockT).toHaveBeenCalledWith('authenticationError');
  });
});

