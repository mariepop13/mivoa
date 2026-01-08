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
      plan: 'supporter',
      status: 'active',
      usage: {
        entriesUsed: 50,
        entriesLimit: Infinity,
        lastResetDate: new Date(),
        nextResetDate: new Date(),
        modelUsage: {},
      },
      limits: {
        advancedAnalysis: false,
        multiEntryAnalysis: false,
        periodSummary: false,
        exportPDF: false,
        exportBackup: false,
        customTemplates: false,
        semanticSearch: false,
      },
      isLoading: false,
      error: null,
      refreshSubscription: vi.fn(),
      isPremium: false,
      isPro: false,
    });

    render(<SubscriptionStatus />);
    expect(screen.getByText('subscription.currentPlan')).toBeInTheDocument();
    expect(mockT).toHaveBeenCalledWith('subscription.supporter');
  });

  it('should render status badge', () => {
    vi.mocked(useSubscription).mockReturnValue({
      plan: 'pro',
      status: 'active',
      usage: null,
      limits: {
        advancedAnalysis: true,
        multiEntryAnalysis: true,
        periodSummary: true,
        exportPDF: true,
        exportBackup: true,
        customTemplates: true,
        semanticSearch: true,
      },
      isLoading: false,
      error: null,
      refreshSubscription: vi.fn(),
      isPremium: true,
      isPro: true,
    });

    render(<SubscriptionStatus />);
    expect(mockT).toHaveBeenCalledWith('subscription.status.active');
  });

  it('should render usage information when available', () => {
    vi.mocked(useSubscription).mockReturnValue({
      plan: 'supporter',
      status: 'active',
      usage: {
        entriesUsed: 75,
        entriesLimit: Infinity,
        lastResetDate: new Date('2024-01-01'),
        nextResetDate: new Date('2024-02-01'),
        modelUsage: {},
      },
      limits: {
        advancedAnalysis: false,
        multiEntryAnalysis: false,
        periodSummary: false,
        exportPDF: false,
        exportBackup: false,
        customTemplates: false,
        semanticSearch: false,
      },
      isLoading: false,
      error: null,
      refreshSubscription: vi.fn(),
      isPremium: false,
      isPro: false,
    });

    render(<SubscriptionStatus />);
    expect(mockT).toHaveBeenCalledWith('subscription.currentPlan');
  });
});

