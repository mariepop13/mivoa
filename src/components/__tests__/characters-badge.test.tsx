import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CharactersBadge } from '../characters-badge';

describe('CharactersBadge', () => {
  it('returns null when characters is empty', () => {
    const { container } = render(<CharactersBadge characters={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when characters is undefined', () => {
    const { container } = render(<CharactersBadge />);
    expect(container.firstChild).toBeNull();
  });

  it('renders characters with Users icon', () => {
    render(<CharactersBadge characters={['Marie', 'John']} />);
    
    expect(screen.getByText('Marie')).toBeInTheDocument();
    expect(screen.getByText('John')).toBeInTheDocument();
  });

  it('sorts characters alphabetically', () => {
    render(<CharactersBadge characters={['John', 'Marie', 'Alice']} />);
    
    const badges = screen.getAllByText(/^(Alice|John|Marie)$/);
    expect(badges[0]).toHaveTextContent('Alice');
    expect(badges[1]).toHaveTextContent('John');
    expect(badges[2]).toHaveTextContent('Marie');
  });

  it('applies colorClass when provided', () => {
    const colorClass = 'bg-purple-100 text-purple-700';
    const { container } = render(<CharactersBadge characters={['Marie']} colorClass={colorClass} />);
    
    const badge = container.querySelector('.bg-purple-100');
    expect(badge).toBeInTheDocument();
  });

  it('handles long character names', () => {
    const longName = 'A'.repeat(100);
    render(<CharactersBadge characters={[longName]} />);
    
    expect(screen.getByText(longName)).toBeInTheDocument();
  });

  it('handles special characters in character names', () => {
    render(<CharactersBadge characters={['José', 'François', '李']} />);
    
    expect(screen.getByText('José')).toBeInTheDocument();
    expect(screen.getByText('François')).toBeInTheDocument();
    expect(screen.getByText('李')).toBeInTheDocument();
  });
});




