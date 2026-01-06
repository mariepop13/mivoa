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
        entriesPerMonth: 10,
        modelsAccess: [],
        exportEnabled: false,
        exportResolution: 'standard',
        advancedAnalysis: false,
        customTemplates: false,
      },
      isLoading: false,
      error: null,
      refreshSubscription: vi.fn(),
      isPremium: false,
      isBasic: false,
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
        entriesPerMonth: 10,
        modelsAccess: [],
        exportEnabled: false,
        exportResolution: 'standard',
        advancedAnalysis: false,
        customTemplates: false,
      },
      isLoading: false,
      error: null,
      refreshSubscription: vi.fn(),
      isPremium: false,
      isBasic: false,
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

  it('should allow basic plan access to basic features', () => {
    vi.mocked(useSubscription).mockReturnValue({
      plan: 'basic',
      status: 'active',
      usage: null,
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

    render(
      <PremiumGate requiredPlan="basic">
        <div>Basic Content</div>
      </PremiumGate>
    );

    expect(screen.getByText('Basic Content')).toBeInTheDocument();
  });

  it('should show fallback when loading', () => {
    vi.mocked(useSubscription).mockReturnValue({
      plan: 'free',
      status: 'free',
      usage: null,
      limits: {
        entriesPerMonth: 10,
        modelsAccess: [],
        exportEnabled: false,
        exportResolution: 'standard',
        advancedAnalysis: false,
        customTemplates: false,
      },
      isLoading: true,
      error: null,
      refreshSubscription: vi.fn(),
      isPremium: false,
      isBasic: false,
      isPro: false,
    });

    render(
      <PremiumGate requiredPlan="pro" fallback={<div>Loading...</div>}>
        <div>Premium Content</div>
      </PremiumGate>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should allow pro plan access to basic features', () => {
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

    render(
      <PremiumGate requiredPlan="basic">
        <div>Basic Content</div>
      </PremiumGate>
    );

    expect(screen.getByText('Basic Content')).toBeInTheDocument();
  });

  it('should allow free plan access to free features', () => {
    vi.mocked(useSubscription).mockReturnValue({
      plan: 'free',
      status: 'free',
      usage: null,
      limits: {
        entriesPerMonth: 10,
        modelsAccess: [],
        exportEnabled: false,
        exportResolution: 'standard',
        advancedAnalysis: false,
        customTemplates: false,
      },
      isLoading: false,
      error: null,
      refreshSubscription: vi.fn(),
      isPremium: false,
      isBasic: false,
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

