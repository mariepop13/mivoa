import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatEmptyState } from '../chat-empty-state';
import { useTranslation } from '@/hooks/use-translation';

vi.mock('@/hooks/use-translation');

describe('ChatEmptyState', () => {
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

  it('should render the empty state message', () => {
    render(<ChatEmptyState />);

    expect(screen.getByText('chatInitializing')).toBeInTheDocument();
  });

  it('should render the Sparkles icon', () => {
    const { container } = render(<ChatEmptyState />);

    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('should call useTranslation', () => {
    render(<ChatEmptyState />);

    expect(useTranslation).toHaveBeenCalled();
    expect(mockT).toHaveBeenCalledWith('chatInitializing');
  });
});

