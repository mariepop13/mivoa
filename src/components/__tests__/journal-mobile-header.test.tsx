import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JournalMobileHeader } from '../journal-mobile-header';
import { useTranslation } from '@/hooks/use-translation';

vi.mock('@/hooks/use-translation');

describe('JournalMobileHeader', () => {
  const mockOnSidebarToggle = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTranslation).mockReturnValue({
      t: (key: string) => key,
      language: 'en',
      isLoading: false,
      error: null,
    });
  });

  it('should render the title', () => {
    render(<JournalMobileHeader title="Test Title" onSidebarToggle={mockOnSidebarToggle} isSidebarOpen={false} />);

    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('should render the toggle button', () => {
    render(<JournalMobileHeader title="Test Title" onSidebarToggle={mockOnSidebarToggle} isSidebarOpen={false} />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('should call onSidebarToggle when toggle button is clicked', async () => {
    const user = userEvent.setup();
    render(<JournalMobileHeader title="Test Title" onSidebarToggle={mockOnSidebarToggle} isSidebarOpen={false} />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(mockOnSidebarToggle).toHaveBeenCalledTimes(1);
  });

  it('should render the menu icon', () => {
    render(<JournalMobileHeader title="Test Title" onSidebarToggle={mockOnSidebarToggle} isSidebarOpen={false} />);

    expect(screen.getByText('☰')).toBeInTheDocument();
  });
});

