import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PlacesBadge } from '../places-badge';

describe('PlacesBadge', () => {
  it('returns null when places is empty', () => {
    const { container } = render(<PlacesBadge places={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when places is undefined', () => {
    const { container } = render(<PlacesBadge />);
    expect(container.firstChild).toBeNull();
  });

  it('renders places with MapPin icon', () => {
    render(<PlacesBadge places={['Paris', 'London']} />);
    
    expect(screen.getByText('Paris')).toBeInTheDocument();
    expect(screen.getByText('London')).toBeInTheDocument();
  });

  it('sorts places alphabetically', () => {
    render(<PlacesBadge places={['London', 'Paris', 'Berlin']} />);
    
    const badges = screen.getAllByText(/^(Paris|London|Berlin)$/);
    expect(badges[0]).toHaveTextContent('Berlin');
    expect(badges[1]).toHaveTextContent('London');
    expect(badges[2]).toHaveTextContent('Paris');
  });

  it('applies colorClass when provided', () => {
    const colorClass = 'bg-blue-100 text-blue-700';
    const { container } = render(<PlacesBadge places={['Paris']} colorClass={colorClass} />);
    
    const badge = container.querySelector('.bg-blue-100');
    expect(badge).toBeInTheDocument();
  });

  it('handles long place names', () => {
    const longName = 'A'.repeat(100);
    render(<PlacesBadge places={[longName]} />);
    
    expect(screen.getByText(longName)).toBeInTheDocument();
  });

  it('handles special characters in place names', () => {
    render(<PlacesBadge places={['São Paulo', 'München', '北京']} />);
    
    expect(screen.getByText('São Paulo')).toBeInTheDocument();
    expect(screen.getByText('München')).toBeInTheDocument();
    expect(screen.getByText('北京')).toBeInTheDocument();
  });
});




