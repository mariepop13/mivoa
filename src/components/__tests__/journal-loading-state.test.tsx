import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { JournalLoadingState } from '../journal-loading-state';
import { useTranslation } from '@/hooks/use-translation';

vi.mock('@/hooks/use-translation');

describe('JournalLoadingState', () => {
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

  it('should render the loading message', () => {
    render(<JournalLoadingState />);

    expect(screen.getByText('loading')).toBeInTheDocument();
  });

});

