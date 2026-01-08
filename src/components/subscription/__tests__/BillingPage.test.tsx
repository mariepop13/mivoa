import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BillingPage } from '../BillingPage';
import { useSubscription } from '@/hooks/use-subscription';
import { useTranslation } from '@/hooks/use-translation';

vi.mock('@/hooks/use-subscription');
vi.mock('@/hooks/use-translation');

global.fetch = vi.fn();
global.window.location.href = '';

describe('BillingPage', () => {
  const mockT = vi.fn((key: string) => key);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTranslation).mockReturnValue({
      t: mockT,
      language: 'en',
      isLoading: false,
      error: null,
    });
    global.window.location.href = '';
  });

  it('should show loading state initially', () => {
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
      isLoading: true,
      error: null,
      refreshSubscription: vi.fn(),
      isPremium: false,
      isPro: false,
    });

    const { container } = render(<BillingPage />);
    const loader = container.querySelector('.animate-spin');
    expect(loader).toBeInTheDocument();
  });

  it('should fetch and display plans', async () => {
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

    const mockPlans = [
      {
        id: 'supporter' as const,
        name: 'Supporter',
        price: {
          monthly: 299,
          annual: 2999,
          monthlyFormatted: '$2.99',
          annualFormatted: '$29.99',
          annualSavings: 589,
          annualSavingsFormatted: '$5.89',
          savingsPercent: 17,
        },
        currency: 'USD' as const,
        features: ['Feature 1', 'Feature 2'],
      },
      {
        id: 'pro' as const,
        name: 'Pro',
        price: {
          monthly: 1999,
          annual: 19999,
          monthlyFormatted: '$19.99',
          annualFormatted: '$199.99',
          annualSavings: 3989,
          annualSavingsFormatted: '$39.89',
          savingsPercent: 17,
        },
        currency: 'USD' as const,
        features: ['Feature 1', 'Feature 2', 'Feature 3'],
      },
    ];

    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ plans: mockPlans }),
    } as Response);

    const { container } = render(<BillingPage />);
    
    await waitFor(() => {
      const loader = container.querySelector('.animate-spin');
      expect(loader).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/stripe/plans?currency=USD');
    });

    await waitFor(() => {
      const supporterElements = screen.getAllByText('subscription.supporter');
      expect(supporterElements.length).toBeGreaterThan(0);
    });

    await waitFor(() => {
      const proElements = screen.getAllByText('subscription.pro');
      expect(proElements.length).toBeGreaterThan(0);
    });
  });

  it('should handle plans API error', async () => {
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

    const mockFetch = vi.mocked(global.fetch);
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockFetch.mockResolvedValueOnce({
      ok: false,
    } as Response);

    render(<BillingPage />);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    consoleErrorSpy.mockRestore();
  });

  it('should call checkout API when upgrade is clicked', async () => {
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

    const mockPlans = [
      {
        id: 'pro' as const,
        name: 'Pro',
        price: {
          monthly: 1999,
          annual: 19999,
          monthlyFormatted: '$19.99',
          annualFormatted: '$199.99',
          annualSavings: 3989,
          annualSavingsFormatted: '$39.89',
          savingsPercent: 17,
        },
        currency: 'USD' as const,
        features: ['Feature 1', 'Feature 2', 'Feature 3'],
      },
    ];

    const mockFetch = vi.mocked(global.fetch);
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ plans: mockPlans }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'https://checkout.stripe.com/session' }),
      } as Response);

    const user = userEvent.setup();
    const { container } = render(<BillingPage />);

    await waitFor(() => {
      const loader = container.querySelector('.animate-spin');
      expect(loader).not.toBeInTheDocument();
    });

    await waitFor(() => {
      const proElements = screen.getAllByText('subscription.pro');
      expect(proElements.length).toBeGreaterThan(0);
    });

    const upgradeButtons = await screen.findAllByText('subscription.upgrade');
    const upgradeButton = upgradeButtons[0];
    await user.click(upgradeButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: 'pro',
          billingCycle: 'monthly',
          currency: 'USD',
        }),
      });
    });
  });

  it('should display current subscription section', async () => {
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

    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ plans: [] }),
    } as Response);

    const { container } = render(<BillingPage />);

    await waitFor(() => {
      const loader = container.querySelector('.animate-spin');
      expect(loader).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('subscription.currentSubscription')).toBeInTheDocument();
    });
  });

  it('should not show manage button for free plan', async () => {
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

    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ plans: [] }),
    } as Response);

    render(<BillingPage />);

    await waitFor(() => {
      expect(screen.queryByText('subscription.manageSubscription')).not.toBeInTheDocument();
    });
  });
});

