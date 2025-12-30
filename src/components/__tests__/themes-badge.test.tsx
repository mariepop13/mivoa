import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemesBadge } from '../themes-badge';

describe('ThemesBadge', () => {
  it('returns null when themes is empty', () => {
    const { container } = render(<ThemesBadge themes={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when themes is undefined', () => {
    const { container } = render(<ThemesBadge />);
    expect(container.firstChild).toBeNull();
  });

  it('renders themes without emoji when themeEmojis not provided', () => {
    render(<ThemesBadge themes={['work', 'family']} />);
    
    expect(screen.getByText('work')).toBeInTheDocument();
    expect(screen.getByText('family')).toBeInTheDocument();
    expect(screen.queryByText('🏷️')).not.toBeInTheDocument();
  });

  it('renders themes with provided emojis', () => {
    const themeEmojis = { 'work': '💼', 'family': '👨‍👩‍👧‍👦' };
    render(<ThemesBadge themes={['work', 'family']} themeEmojis={themeEmojis} />);
    
    expect(screen.getByText('work')).toBeInTheDocument();
    expect(screen.getByText('family')).toBeInTheDocument();
    expect(screen.getByText('💼')).toBeInTheDocument();
    expect(screen.getByText('👨‍👩‍👧‍👦')).toBeInTheDocument();
  });

  it('uses theme as emoji when theme is already an emoji', () => {
    render(<ThemesBadge themes={['💼', '🏥']} />);
    
    expect(screen.getAllByText('💼').length).toBeGreaterThan(0);
    expect(screen.getAllByText('🏥').length).toBeGreaterThan(0);
  });

  it('prioritizes themeEmojis over emoji detection', () => {
    const themeEmojis = { 'work': '🏢' };
    render(<ThemesBadge themes={['work']} themeEmojis={themeEmojis} />);
    
    expect(screen.getByText('work')).toBeInTheDocument();
    expect(screen.getByText('🏢')).toBeInTheDocument();
  });

  it('handles mixed themes with and without emojis', () => {
    const themeEmojis = { 'work': '💼' };
    render(<ThemesBadge themes={['💼', 'work', 'family']} themeEmojis={themeEmojis} />);
    
    expect(screen.getAllByText('💼').length).toBeGreaterThan(0);
    expect(screen.getByText('work')).toBeInTheDocument();
    expect(screen.getByText('family')).toBeInTheDocument();
  });
});

