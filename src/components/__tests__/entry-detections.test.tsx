import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EntryDetections } from '../entry-detections';
import { useTranslation } from '@/hooks/use-translation';

vi.mock('@/hooks/use-translation', () => ({
  useTranslation: vi.fn(),
}));

describe('EntryDetections', () => {
  beforeEach(() => {
    vi.mocked(useTranslation).mockReturnValue({
      t: (key: string) => key,
      language: 'en',
      isLoading: false,
      error: null,
    });
  });

  it('returns null when all props are empty or undefined', () => {
    const { container } = render(<EntryDetections />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when all arrays are empty', () => {
    const { container } = render(
      <EntryDetections places={[]} characters={[]} themes={[]} moods={[]} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders moods section when moods are provided', () => {
    render(<EntryDetections moods={['happy', 'calm']} />);
    
    expect(screen.getByText('moods')).toBeInTheDocument();
    expect(screen.getByText('happy')).toBeInTheDocument();
    expect(screen.getByText('calm')).toBeInTheDocument();
  });

  it('renders themes section when themes are provided', () => {
    render(<EntryDetections themes={['work', 'family']} />);
    
    expect(screen.getByText('themes')).toBeInTheDocument();
    expect(screen.getByText('work')).toBeInTheDocument();
    expect(screen.getByText('family')).toBeInTheDocument();
  });

  it('renders characters section when characters are provided', () => {
    render(<EntryDetections characters={['Marie', 'John']} />);
    
    expect(screen.getByText('characters')).toBeInTheDocument();
    expect(screen.getByText('Marie')).toBeInTheDocument();
    expect(screen.getByText('John')).toBeInTheDocument();
  });

  it('renders places section when places are provided', () => {
    render(<EntryDetections places={['Paris', 'London']} />);
    
    expect(screen.getByText('places')).toBeInTheDocument();
    expect(screen.getByText('Paris')).toBeInTheDocument();
    expect(screen.getByText('London')).toBeInTheDocument();
  });

  it('renders multiple sections when multiple data types are provided', () => {
    render(
      <EntryDetections
        moods={['happy']}
        themes={['work']}
        characters={['Marie']}
        places={['Paris']}
      />
    );
    
    expect(screen.getByText('moods')).toBeInTheDocument();
    expect(screen.getByText('themes')).toBeInTheDocument();
    expect(screen.getByText('characters')).toBeInTheDocument();
    expect(screen.getByText('places')).toBeInTheDocument();
  });

  it('renders moods with emojis when moodEmojis are provided', () => {
    const moodEmojis = { 'happy': '😊' };
    render(<EntryDetections moods={['happy']} moodEmojis={moodEmojis} />);
    
    expect(screen.getByText('😊')).toBeInTheDocument();
  });

  it('renders themes with emojis when themeEmojis are provided', () => {
    const themeEmojis = { 'work': '💼' };
    render(<EntryDetections themes={['work']} themeEmojis={themeEmojis} />);
    
    expect(screen.getByText('💼')).toBeInTheDocument();
  });

  it('applies className when provided', () => {
    const { container } = render(
      <EntryDetections moods={['happy']} className="custom-class" />
    );
    
    const element = container.querySelector('.custom-class');
    expect(element).toBeInTheDocument();
  });

  it('handles partial data correctly', () => {
    render(
      <EntryDetections
        moods={['happy']}
        themes={['work']}
      />
    );
    
    expect(screen.getByText('moods')).toBeInTheDocument();
    expect(screen.getByText('themes')).toBeInTheDocument();
    expect(screen.queryByText('characters')).not.toBeInTheDocument();
    expect(screen.queryByText('places')).not.toBeInTheDocument();
  });
});

