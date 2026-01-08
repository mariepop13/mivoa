import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PremiumGate } from '../PremiumGate';
import { useSubscription } from '@/hooks/use-subscription';
import { useTranslation } from '@/hooks/use-translation';

vi.mock('@/hooks/use-subscription');
vi.mock('@/hooks/use-translation');

describe('PremiumGate', () => {
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

  it('should render children when user has access', () => {
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

    render(
      <PremiumGate requiredPlan="pro">
        <div>Premium Content</div>
      </PremiumGate>
    );

    expect(screen.getByText('Premium Content')).toBeInTheDocument();
  });

  it('should show upgrade prompt when user lacks access', async () => {
    vi.mocked(useSubscription).mockReturnValue({
      plan: 'free',
      status: 'free',
      usage: null,
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

    render(
      <PremiumGate requiredPlan="pro">
        <div>Premium Content</div>
      </PremiumGate>
    );

    const upgradeButton = screen.getByText('subscription.upgradeToAccessGeneric');
    expect(upgradeButton).toBeInTheDocument();
  });

  it('should show fallback when provided and user lacks access', () => {
    vi.mocked(useSubscription).mockReturnValue({
      plan: 'free',
      status: 'free',
      usage: null,
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

    render(
      <PremiumGate requiredPlan="pro" fallback={<div>Custom Fallback</div>}>
        <div>Premium Content</div>
      </PremiumGate>
    );

    expect(screen.getByText('Custom Fallback')).toBeInTheDocument();
    expect(screen.queryByText('Premium Content')).not.toBeInTheDocument();
  });

  it('should allow supporter plan access to pro features (no longer exists)', () => {
    vi.mocked(useSubscription).mockReturnValue({
      plan: 'supporter',
      status: 'active',
      usage: null,
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

    render(
      <PremiumGate requiredPlan="pro">
        <div>Pro Content</div>
      </PremiumGate>
    );

    expect(screen.queryByText('Pro Content')).not.toBeInTheDocument();
  });

  it('should show fallback when loading', () => {
    vi.mocked(useSubscription).mockReturnValue({
      plan: 'free',
      status: 'free',
      usage: null,
      limits: {
        advancedAnalysis: false,
        multiEntryAnalysis: false,
        periodSummary: false,
        exportPDF: false,
        exportBackup: false,
        customTemplates: false,
        semanticSearch: false,
      },
      isLoading: true,
      error: null,
      refreshSubscription: vi.fn(),
      isPremium: false,
      isPro: false,
    });

    render(
      <PremiumGate requiredPlan="pro" fallback={<div>Loading...</div>}>
        <div>Premium Content</div>
      </PremiumGate>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should allow pro plan access to pro features', () => {
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

    render(
      <PremiumGate requiredPlan="pro">
        <div>Pro Content</div>
      </PremiumGate>
    );

    expect(screen.getByText('Pro Content')).toBeInTheDocument();
  });

  it('should allow free plan access to free features', () => {
    vi.mocked(useSubscription).mockReturnValue({
      plan: 'free',
      status: 'free',
      usage: null,
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

    render(
      <PremiumGate requiredPlan="free">
        <div>Free Content</div>
      </PremiumGate>
    );

    expect(screen.getByText('Free Content')).toBeInTheDocument();
  });
});

