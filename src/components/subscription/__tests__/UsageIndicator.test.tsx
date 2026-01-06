import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UsageIndicator } from '../UsageIndicator';
import { useSubscription } from '@/hooks/use-subscription';
import { useTranslation } from '@/hooks/use-translation';

vi.mock('@/hooks/use-subscription');
vi.mock('@/hooks/use-translation');

describe('UsageIndicator', () => {
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

  it('should render usage information', () => {
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

    render(<UsageIndicator />);
    expect(screen.getByText('subscription.usage')).toBeInTheDocument();
  });

  it('should show warning when usage exceeds 80%', () => {
    vi.mocked(useSubscription).mockReturnValue({
      plan: 'basic',
      status: 'active',
      usage: {
        entriesUsed: 85,
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

    render(<UsageIndicator />);
    expect(screen.getByText('subscription.usageWarning')).toBeInTheDocument();
  });

  it('should show unlimited for pro plan', () => {
    vi.mocked(useSubscription).mockReturnValue({
      plan: 'pro',
      status: 'active',
      usage: {
        entriesUsed: 0,
        entriesLimit: Infinity,
        lastResetDate: new Date(),
        nextResetDate: new Date(),
        modelUsage: {},
      },
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

    render(<UsageIndicator />);
    expect(screen.getByText('subscription.unlimited')).toBeInTheDocument();
  });

  it('should return null when usage is not available', () => {
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

    const { container } = render(<UsageIndicator />);
    expect(container.firstChild).toBeNull();
  });
});

