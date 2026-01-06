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
      isLoading: true,
      error: null,
      refreshSubscription: vi.fn(),
      isPremium: false,
      isBasic: true,
      isPro: false,
    });

    const { container } = render(<BillingPage />);
    const loader = container.querySelector('.animate-spin');
    expect(loader).toBeInTheDocument();
  });

  it('should fetch and display plans', async () => {
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

    const mockPlans = [
      {
        id: 'basic' as const,
        name: 'Basic',
        price: {
          monthly: 999,
          annual: 9999,
          monthlyFormatted: '$9.99',
          annualFormatted: '$99.99',
          annualSavings: 1989,
          annualSavingsFormatted: '$19.89',
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
      const basicElements = screen.getAllByText('subscription.basic');
      expect(basicElements.length).toBeGreaterThan(0);
      expect(screen.getByText('subscription.pro')).toBeInTheDocument();
    });
  });

  it('should handle plans API error', async () => {
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
    render(<BillingPage />);

    await waitFor(() => {
      expect(screen.getByText('subscription.pro')).toBeInTheDocument();
    });

    const upgradeButton = await screen.findByText('subscription.upgrade');
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

    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ plans: [] }),
    } as Response);

    render(<BillingPage />);

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

