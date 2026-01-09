import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ManageSubscriptionButton } from '../ManageSubscriptionButton';
import { useSubscription } from '@/hooks/use-subscription';
import { useTranslation } from '@/hooks/use-translation';
import { useUser } from '@/firebase/auth/use-user';

vi.mock('@/hooks/use-subscription');
vi.mock('@/hooks/use-translation');
vi.mock('@/firebase/auth/use-user');

global.fetch = vi.fn();
global.window.location.href = '';

describe('ManageSubscriptionButton', () => {
  const mockT = vi.fn((key: string) => key);
  const mockGetIdToken = vi.fn().mockResolvedValue('mock-token');

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTranslation).mockReturnValue({
      t: mockT,
      language: 'en',
      isLoading: false,
      error: null,
    });
    vi.mocked(useUser).mockReturnValue({
      user: {
        uid: 'test-user-id',
        getIdToken: mockGetIdToken,
      } as any,
      isLoading: false,
      error: null,
    });
    global.window.location.href = '';
  });

  it('should return null for free plan', () => {
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

    const { container } = render(<ManageSubscriptionButton />);
    expect(container.firstChild).toBeNull();
  });

  it('should show loading state when subscription is loading', () => {
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

    render(<ManageSubscriptionButton />);
    expect(screen.getByText('loading')).toBeInTheDocument();
  });

  it('should call portal API and redirect on success', async () => {
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
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ url: 'https://billing.stripe.com/portal' }),
    } as Response);

    const user = userEvent.setup();
    render(<ManageSubscriptionButton />);

    const button = screen.getByText('subscription.manageSubscription');
    await user.click(button);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/stripe/create-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token',
        },
      });
    });
  });

  it('should show error message on API failure', async () => {
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
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Portal creation failed' }),
    } as Response);

    const user = userEvent.setup();
    render(<ManageSubscriptionButton />);

    const button = screen.getByText('subscription.manageSubscription');
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText('Portal creation failed')).toBeInTheDocument();
    });
  });

  it('should show loading state during portal creation', async () => {
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
    let resolveFetch: (value: Response) => void;
    const fetchPromise = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });
    mockFetch.mockReturnValueOnce(fetchPromise);

    const user = userEvent.setup();
    render(<ManageSubscriptionButton />);

    const button = screen.getByText('subscription.manageSubscription');
    await user.click(button);

    expect(screen.getByText('subscription.openingPortal')).toBeInTheDocument();

    resolveFetch!({
      ok: true,
      json: async () => ({ url: 'https://billing.stripe.com/portal' }),
    } as Response);
  });

  it('should handle network errors', async () => {
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
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const user = userEvent.setup();
    render(<ManageSubscriptionButton />);

    const button = screen.getByText('subscription.manageSubscription');
    await user.click(button);

    await waitFor(() => {
      const errorElement = screen.queryByText('Network error') || screen.queryByText('subscription.portalError');
      expect(errorElement).toBeInTheDocument();
    });
  });
});

