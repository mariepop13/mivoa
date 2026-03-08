import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { JournalViewTabs } from '../journal-view-tabs';

describe('JournalViewTabs', () => {
  const defaultProps = {
    viewMode: 'summary' as const,
    onViewModeChange: vi.fn(),
  };

  it('shows no status badge when entryKind is undefined', () => {
    render(<JournalViewTabs {...defaultProps} />);
    expect(screen.queryByTestId('entry-status-badge')).toBeNull();
  });

  it('shows draft badge when entryKind is draft', () => {
    render(<JournalViewTabs {...defaultProps} entryKind="draft" />);
    expect(screen.getByTestId('entry-status-badge')).toBeInTheDocument();
    expect(screen.getByTestId('entry-status-badge')).toHaveTextContent(/brouillon|draft/i);
  });

  it('shows conversation badge when entryKind is conversation', () => {
    render(<JournalViewTabs {...defaultProps} entryKind="conversation" />);
    expect(screen.getByTestId('entry-status-badge')).toBeInTheDocument();
    expect(screen.getByTestId('entry-status-badge')).toHaveTextContent(/conversation/i);
  });
});
