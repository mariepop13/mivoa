import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UpgradePrompt } from '../UpgradePrompt';
import { useSubscription } from '@/hooks/use-subscription';
import { useTranslation } from '@/hooks/use-translation';

vi.mock('@/hooks/use-subscription');
vi.mock('@/hooks/use-translation');

global.fetch = vi.fn();
global.window.location.href = '';

describe('UpgradePrompt', () => {
  const mockT = vi.fn((key: string) => key);
  const mockOnOpenChange = vi.fn();

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

  it('should render dialog when open', () => {
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

    render(<UpgradePrompt open onOpenChange={mockOnOpenChange} />);
    expect(screen.getByText('subscription.upgradeTitle')).toBeInTheDocument();
  });

  it('should show feature-specific title when featureName is provided', () => {
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
      <UpgradePrompt
        open
        onOpenChange={mockOnOpenChange}
        featureName="Advanced Analytics"
      />
    );
    expect(mockT).toHaveBeenCalledWith('subscription.upgradeRequired');
  });

  it('should show required plan description when requiredPlan is provided', () => {
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
      <UpgradePrompt
        open
        onOpenChange={mockOnOpenChange}
        requiredPlan="pro"
      />
    );
    expect(mockT).toHaveBeenCalledWith('subscription.upgradeDescription');
  });

  it('should show supporter and pro plans for free users', () => {
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

    render(<UpgradePrompt open onOpenChange={mockOnOpenChange} />);
    expect(screen.getByText('subscription.supporter')).toBeInTheDocument();
    expect(screen.getByText('subscription.pro')).toBeInTheDocument();
  });

  it('should show only pro plan for supporter users', () => {
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

    render(<UpgradePrompt open onOpenChange={mockOnOpenChange} />);
    expect(screen.queryByText('subscription.supporter')).not.toBeInTheDocument();
    expect(screen.getByText('subscription.pro')).toBeInTheDocument();
  });

  it('should call checkout API when upgrade is clicked', async () => {
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
      json: async () => ({ url: 'https://checkout.stripe.com/session' }),
    } as Response);

    const user = userEvent.setup();
    render(<UpgradePrompt open onOpenChange={mockOnOpenChange} />);

    const upgradeButtons = await screen.findAllByText('subscription.upgrade');
    await user.click(upgradeButtons[0]);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: 'supporter',
          billingCycle: 'monthly',
          currency: 'USD',
        }),
      });
    });
  });

  it('should handle checkout API errors', async () => {
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
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Checkout failed' }),
    } as Response);

    const user = userEvent.setup();
    render(<UpgradePrompt open onOpenChange={mockOnOpenChange} />);

    const upgradeButtons = await screen.findAllByText('subscription.upgrade');
    await user.click(upgradeButtons[0]);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    consoleErrorSpy.mockRestore();
  });

  it('should close dialog when cancel button is clicked', async () => {
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

    const user = userEvent.setup();
    render(<UpgradePrompt open onOpenChange={mockOnOpenChange} />);

    const cancelButton = screen.getByText('cancel');
    await user.click(cancelButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });
});

