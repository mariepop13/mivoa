import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SubscriptionStatus } from '../SubscriptionStatus';
import { useSubscription } from '@/hooks/use-subscription';
import { useTranslation } from '@/hooks/use-translation';

vi.mock('@/hooks/use-subscription');
vi.mock('@/hooks/use-translation');

describe('SubscriptionStatus', () => {
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

  it('should render current plan', () => {
    vi.mocked(useSubscription).mockReturnValue({
      plan: 'basic',
      status: 'active',
      usage: {
        entriesUsed: 50,
        entriesLimit: 100,
        lastResetDate: new Date(),
        nextResetDate: new Date(),
        modelUsage: {},
      },
      limits: {
        entriesPerMonth: 100,
        modelsAccess: [],
        exportEnabled: true,
        exportResolution: 'standard',
        advancedAnalysis: true,
        customTemplates: false,
      },
      isLoading: false,
      error: null,
      refreshSubscription: vi.fn(),
      isPremium: false,
      isBasic: true,
      isPro: false,
    });

    render(<SubscriptionStatus />);
    expect(screen.getByText('subscription.currentPlan')).toBeInTheDocument();
    expect(mockT).toHaveBeenCalledWith('subscription.basic');
  });

  it('should render status badge', () => {
    vi.mocked(useSubscription).mockReturnValue({
      plan: 'pro',
      status: 'active',
      usage: null,
      limits: {
        entriesPerMonth: -1,
        modelsAccess: [],
        exportEnabled: true,
        exportResolution: 'high',
        advancedAnalysis: true,
        customTemplates: true,
      },
      isLoading: false,
      error: null,
      refreshSubscription: vi.fn(),
      isPremium: true,
      isBasic: false,
      isPro: true,
    });

    render(<SubscriptionStatus />);
    expect(mockT).toHaveBeenCalledWith('subscription.status.active');
  });

  it('should render usage information when available', () => {
    vi.mocked(useSubscription).mockReturnValue({
      plan: 'basic',
      status: 'active',
      usage: {
        entriesUsed: 75,
        entriesLimit: 100,
        lastResetDate: new Date('2024-01-01'),
        nextResetDate: new Date('2024-02-01'),
        modelUsage: {},
      },
      limits: {
        entriesPerMonth: 100,
        modelsAccess: [],
        exportEnabled: true,
        exportResolution: 'standard',
        advancedAnalysis: true,
        customTemplates: false,
      },
      isLoading: false,
      error: null,
      refreshSubscription: vi.fn(),
      isPremium: false,
      isBasic: true,
      isPro: false,
    });

    render(<SubscriptionStatus />);
    expect(mockT).toHaveBeenCalledWith('subscription.entriesUsed');
    expect(mockT).toHaveBeenCalledWith('subscription.resetDate');
  });
});

