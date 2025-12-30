import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MoodsBadge } from '../moods-badge';

describe('MoodsBadge', () => {
  it('returns null when moods is empty', () => {
    const { container } = render(<MoodsBadge moods={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when moods is undefined', () => {
    const { container } = render(<MoodsBadge />);
    expect(container.firstChild).toBeNull();
  });

  it('renders moods without emoji when not provided', () => {
    render(<MoodsBadge moods={['happy', 'anxious']} />);
    
    expect(screen.getByText('happy')).toBeInTheDocument();
    expect(screen.getByText('anxious')).toBeInTheDocument();
  });

  it('renders moods with provided emojis', () => {
    const moodEmojis = { 'happy': '😊', 'anxious': '😰' };
    render(<MoodsBadge moods={['happy', 'anxious']} moodEmojis={moodEmojis} />);
    
    expect(screen.getByText('happy')).toBeInTheDocument();
    expect(screen.getByText('anxious')).toBeInTheDocument();
    expect(screen.getByText('😊')).toBeInTheDocument();
    expect(screen.getByText('😰')).toBeInTheDocument();
  });

  it('uses mood as emoji when mood is already an emoji', () => {
    render(<MoodsBadge moods={['😊', '😰']} />);
    
    expect(screen.getAllByText('😊').length).toBeGreaterThan(0);
    expect(screen.getAllByText('😰').length).toBeGreaterThan(0);
  });

  it('prioritizes moodEmojis over emoji detection', () => {
    const moodEmojis = { 'happy': '😄' };
    render(<MoodsBadge moods={['happy']} moodEmojis={moodEmojis} />);
    
    expect(screen.getByText('happy')).toBeInTheDocument();
    expect(screen.getByText('😄')).toBeInTheDocument();
  });

  it('handles mixed moods with and without emojis', () => {
    const moodEmojis = { 'happy': '😊' };
    render(<MoodsBadge moods={['😊', 'happy', 'anxious']} moodEmojis={moodEmojis} />);
    
    expect(screen.getAllByText('😊').length).toBeGreaterThan(0);
    expect(screen.getByText('happy')).toBeInTheDocument();
    expect(screen.getByText('anxious')).toBeInTheDocument();
  });

  it('sorts moods alphabetically', () => {
    render(<MoodsBadge moods={['anxious', 'happy', 'calm']} />);
    
    const badges = screen.getAllByText(/^(anxious|happy|calm)$/);
    expect(badges[0]).toHaveTextContent('anxious');
    expect(badges[1]).toHaveTextContent('calm');
    expect(badges[2]).toHaveTextContent('happy');
  });

  it('applies colorClass when provided', () => {
    const colorClass = 'bg-yellow-100 text-yellow-700';
    const { container } = render(<MoodsBadge moods={['happy']} colorClass={colorClass} />);
    
    const badge = container.querySelector('.bg-yellow-100');
    expect(badge).toBeInTheDocument();
  });

  it('handles long mood names', () => {
    const longName = 'A'.repeat(100);
    render(<MoodsBadge moods={[longName]} />);
    
    expect(screen.getByText(longName)).toBeInTheDocument();
  });
});



