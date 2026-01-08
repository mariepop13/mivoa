import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PricingCard } from '../PricingCard';
import { useTranslation } from '@/hooks/use-translation';

vi.mock('@/hooks/use-translation');

describe('PricingCard', () => {
  const mockT = vi.fn((key: string) => key);
  const mockOnUpgrade = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTranslation).mockReturnValue({
      t: mockT,
      language: 'en',
      isLoading: false,
      error: null,
    });
  });

  it('should render plan name', () => {
    render(<PricingCard plan="supporter" />);
    expect(mockT).toHaveBeenCalledWith('subscription.supporter');
  });

  it('should render monthly price by default', () => {
    render(<PricingCard plan="supporter" />);
    expect(screen.getByText(/\$2\.99/)).toBeInTheDocument();
  });

  it('should switch to annual pricing when clicked', async () => {
    const user = userEvent.setup();
    render(<PricingCard plan="supporter" />);
    
    const annualButton = screen.getByText('subscription.annual');
    await user.click(annualButton);
    
    expect(screen.getByText(/\$29\.99/)).toBeInTheDocument();
  });

  it('should call onUpgrade when upgrade button is clicked', async () => {
    const user = userEvent.setup();
    render(<PricingCard plan="supporter" onUpgrade={mockOnUpgrade} />);
    
    const upgradeButton = screen.getByText('subscription.upgrade');
    await user.click(upgradeButton);
    
    expect(mockOnUpgrade).toHaveBeenCalledWith('supporter', 'monthly');
  });

  it('should show current plan badge when isCurrentPlan is true', () => {
    render(<PricingCard plan="supporter" isCurrentPlan />);
    expect(screen.getAllByText('subscription.currentPlan').length).toBeGreaterThan(0);
  });

  it('should render free plan correctly', () => {
    render(<PricingCard plan="free" />);
    expect(mockT).toHaveBeenCalledWith('subscription.free');
  });
});

