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

    render(<UsageIndicator />);
    expect(screen.getByText('subscription.usage')).toBeInTheDocument();
    expect(screen.getByText('subscription.unlimitedEntries')).toBeInTheDocument();
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

    render(<UsageIndicator />);
    expect(screen.getByText('subscription.unlimitedEntries')).toBeInTheDocument();
  });

  it('should return null when usage is not available', () => {
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

    const { container } = render(<UsageIndicator />);
    expect(container.firstChild).toBeNull();
  });
});

