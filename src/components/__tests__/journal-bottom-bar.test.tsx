import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { JournalBottomBar } from '../journal-bottom-bar';

describe('JournalBottomBar', () => {
  const defaultProps = {
    onViewModeChange: vi.fn(),
    onSidebarToggle: vi.fn(),
    shouldShowChat: false,
  };

  it('renders 3 navigation buttons', () => {
    render(<JournalBottomBar {...defaultProps} />);
    expect(screen.getByRole('button', { name: /entr/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /journal/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /chat/i })).toBeInTheDocument();
  });

  it('calls onSidebarToggle when Entries button is clicked', () => {
    render(<JournalBottomBar {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /entr/i }));
    expect(defaultProps.onSidebarToggle).toHaveBeenCalledOnce();
  });

  it('calls onViewModeChange with summary when Journal button is clicked', () => {
    render(<JournalBottomBar {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /journal/i }));
    expect(defaultProps.onViewModeChange).toHaveBeenCalledWith('summary');
  });

  it('calls onViewModeChange with chat when Chat button is clicked', () => {
    render(<JournalBottomBar {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /chat/i }));
    expect(defaultProps.onViewModeChange).toHaveBeenCalledWith('chat');
  });

  it('shows Journal button as active when shouldShowChat is false', () => {
    render(<JournalBottomBar {...defaultProps} shouldShowChat={false} />);
    const journalBtn = screen.getByRole('button', { name: /journal/i });
    expect(journalBtn).toHaveAttribute('aria-current', 'page');
  });

  it('shows Chat button as active when shouldShowChat is true', () => {
    render(<JournalBottomBar {...defaultProps} shouldShowChat={true} />);
    const chatBtn = screen.getByRole('button', { name: /chat/i });
    expect(chatBtn).toHaveAttribute('aria-current', 'page');
  });
});
