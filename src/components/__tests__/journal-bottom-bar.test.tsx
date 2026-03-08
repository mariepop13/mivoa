import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { JournalBottomBar } from '../journal-bottom-bar';

describe('JournalBottomBar', () => {
  const defaultProps = {
    onViewModeChange: vi.fn(),
    onSidebarToggle: vi.fn(),
    shouldShowChat: false,
  };

  it('renders 3 navigation tabs', () => {
    render(<JournalBottomBar {...defaultProps} />);
    expect(screen.getByRole('tab',{ name: /entrées/i })).toBeInTheDocument();
    expect(screen.getByRole('tab',{ name: /journal/i })).toBeInTheDocument();
    expect(screen.getByRole('tab',{ name: /chat/i })).toBeInTheDocument();
  });

  it('calls onSidebarToggle when Entrées tab is clicked', () => {
    render(<JournalBottomBar {...defaultProps} />);
    fireEvent.click(screen.getByRole('tab',{ name: /entrées/i }));
    expect(defaultProps.onSidebarToggle).toHaveBeenCalledOnce();
  });

  it('calls onViewModeChange with summary when Journal tab is clicked', () => {
    render(<JournalBottomBar {...defaultProps} />);
    fireEvent.click(screen.getByRole('tab',{ name: /journal/i }));
    expect(defaultProps.onViewModeChange).toHaveBeenCalledWith('summary');
  });

  it('calls onViewModeChange with chat when Chat tab is clicked', () => {
    render(<JournalBottomBar {...defaultProps} />);
    fireEvent.click(screen.getByRole('tab',{ name: /chat/i }));
    expect(defaultProps.onViewModeChange).toHaveBeenCalledWith('chat');
  });

  it('shows Journal tab as active when shouldShowChat is false', () => {
    render(<JournalBottomBar {...defaultProps} shouldShowChat={false} />);
    const journalTab = screen.getByRole('tab',{ name: /journal/i });
    expect(journalTab).toHaveAttribute('aria-selected', 'true');
  });

  it('shows Chat tab as active when shouldShowChat is true', () => {
    render(<JournalBottomBar {...defaultProps} shouldShowChat={true} />);
    const chatTab = screen.getByRole('tab',{ name: /chat/i });
    expect(chatTab).toHaveAttribute('aria-selected', 'true');
  });
});
