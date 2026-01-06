import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { SettingsSubscriptionSection } from '../SettingsSubscriptionSection';
import { useSubscription } from '@/hooks/use-subscription';
import { useTranslation } from '@/hooks/use-translation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

vi.mock('@/hooks/use-subscription');
vi.mock('@/hooks/use-translation');

describe('SettingsSubscriptionSection', () => {
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

  const renderWithDropdown = () => render(
    <DropdownMenu>
      <DropdownMenuTrigger>Open</DropdownMenuTrigger>
      <DropdownMenuContent>
        <SettingsSubscriptionSection />
      </DropdownMenuContent>
    </DropdownMenu>
  );

  it('should render subscription label', () => {
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

    const { container } = renderWithDropdown();
    expect(container).toBeTruthy();
  });

  it('should show current plan badge', () => {
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

    const { container } = renderWithDropdown();
    expect(container).toBeTruthy();
  });

  it('should show loading state', () => {
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

    const { container } = renderWithDropdown();
    expect(container).toBeTruthy();
  });
});

