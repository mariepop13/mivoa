import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { SubscriptionProvider } from '../SubscriptionContext';
import { useSubscription } from '@/hooks/use-subscription';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { SubscriptionPlan, SubscriptionStatus } from '@/lib/subscription/types';

vi.mock('@/firebase');
vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    doc: vi.fn(),
  };
});

const mockFirestore = { id: 'mock-firestore' } as unknown as Firestore;
const mockUser = { uid: 'test-user-id' } as Partial<User> as User;
const mockSubscriptionDocRef = { id: 'subscription-status' } as ReturnType<typeof doc>;
const mockUsageDocRef = { id: 'subscription-usage' } as ReturnType<typeof doc>;

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SubscriptionProvider>{children}</SubscriptionProvider>
);

describe('SubscriptionContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useFirestore).mockReturnValue(mockFirestore);
    vi.mocked(useUser).mockReturnValue({
      user: mockUser,
      isLoading: false,
      error: null,
    });
    vi.mocked(doc).mockImplementation((firestore, path) => {
      if (path.includes('status')) {
        return mockSubscriptionDocRef as ReturnType<typeof doc>;
      }
      return mockUsageDocRef as ReturnType<typeof doc>;
    });
  });

  it('should provide default free plan when loading', () => {
    vi.mocked(useUser).mockReturnValue({
      user: null,
      isLoading: true,
      error: null,
    });
    vi.mocked(useDoc).mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    const { result } = renderHook(() => useSubscription(), { wrapper });

    expect(result.current.plan).toBe('free');
    expect(result.current.status).toBe('free');
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isPremium).toBe(false);
    expect(result.current.isBasic).toBe(false);
    expect(result.current.isPro).toBe(false);
  });

  it('should provide free plan when no subscription exists', async () => {
    vi.mocked(useDoc).mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useSubscription(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.plan).toBe('free');
    expect(result.current.status).toBe('free');
    expect(result.current.limits.entriesPerMonth).toBe(10);
    expect(result.current.usage).not.toBeNull();
    expect(result.current.usage?.entriesUsed).toBe(0);
    expect(result.current.usage?.entriesLimit).toBe(10);
    expect(result.current.isPremium).toBe(false);
    expect(result.current.isBasic).toBe(false);
    expect(result.current.isPro).toBe(false);
  });

  it('should load subscription data from Firestore', async () => {
    const mockSubscriptionData = {
      id: 'subscription-status',
      plan: 'basic' as SubscriptionPlan,
      status: 'active' as SubscriptionStatus,
      stripeCustomerId: 'cus_test',
      stripeSubscriptionId: 'sub_test',
      createdAt: { toDate: () => new Date('2024-01-01') },
      updatedAt: { toDate: () => new Date('2024-01-02') },
    };

    const mockUsageData = {
      id: 'subscription-usage',
      entriesUsed: 5,
      modelUsage: { 'gpt-4o-mini': 3 },
    };

    vi.mocked(useDoc).mockImplementation((docRef) => {
      if (docRef === mockSubscriptionDocRef) {
        return {
          data: mockSubscriptionData,
          isLoading: false,
          error: null,
        };
      }
      return {
        data: mockUsageData,
        isLoading: false,
        error: null,
      };
    });

    const { result } = renderHook(() => useSubscription(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.plan).toBe('basic');
    expect(result.current.status).toBe('active');
    expect(result.current.limits.entriesPerMonth).toBe(100);
    expect(result.current.usage).not.toBeNull();
    expect(result.current.usage?.entriesUsed).toBe(5);
    expect(result.current.isPremium).toBe(false);
    expect(result.current.isBasic).toBe(true);
    expect(result.current.isPro).toBe(false);
  });

  it('should calculate pro plan flags correctly', async () => {
    const mockSubscriptionData = {
      id: 'subscription-status',
      plan: 'pro' as SubscriptionPlan,
      status: 'active' as SubscriptionStatus,
      createdAt: { toDate: () => new Date('2024-01-01') },
      updatedAt: { toDate: () => new Date('2024-01-02') },
    };

    vi.mocked(useDoc).mockImplementation((docRef) => {
      if (docRef === mockSubscriptionDocRef) {
        return {
          data: mockSubscriptionData,
          isLoading: false,
          error: null,
        };
      }
      return {
        data: null,
        isLoading: false,
        error: null,
      };
    });

    const { result } = renderHook(() => useSubscription(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.plan).toBe('pro');
    expect(result.current.isPremium).toBe(true);
    expect(result.current.isBasic).toBe(false);
    expect(result.current.isPro).toBe(true);
    expect(result.current.limits.entriesPerMonth).toBe(-1);
  });

  it('should handle Firestore errors gracefully', async () => {
    const mockError = new Error('Firestore permission denied');

    vi.mocked(useDoc).mockReturnValue({
      data: null,
      isLoading: false,
      error: mockError,
    });

    const { result } = renderHook(() => useSubscription(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe(mockError);
    expect(result.current.plan).toBe('free');
    expect(result.current.status).toBe('free');
  });

  it('should handle unauthenticated user', async () => {
    vi.mocked(useUser).mockReturnValue({
      user: null,
      isLoading: false,
      error: null,
    });
    vi.mocked(useDoc).mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useSubscription(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.plan).toBe('free');
    expect(result.current.status).toBe('free');
    expect(result.current.usage).toBeNull();
  });

  it('should transform Firestore timestamps correctly', async () => {
    const mockDate = new Date('2024-01-15');
    const mockSubscriptionData = {
      id: 'subscription-status',
      plan: 'basic' as SubscriptionPlan,
      status: 'active' as SubscriptionStatus,
      currentPeriodStart: { toDate: () => new Date('2024-01-01') },
      currentPeriodEnd: { toDate: () => new Date('2024-02-01') },
      createdAt: { toDate: () => mockDate },
      updatedAt: { toDate: () => mockDate },
    };

    vi.mocked(useDoc).mockImplementation((docRef) => {
      if (docRef === mockSubscriptionDocRef) {
        return {
          data: mockSubscriptionData,
          isLoading: false,
          error: null,
        };
      }
      return {
        data: null,
        isLoading: false,
        error: null,
      };
    });

    const { result } = renderHook(() => useSubscription(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.plan).toBe('basic');
    expect(result.current.status).toBe('active');
  });

  it('should build usage stats from Firestore data', async () => {
    const mockSubscriptionData = {
      id: 'subscription-status',
      plan: 'basic' as SubscriptionPlan,
      status: 'active' as SubscriptionStatus,
      createdAt: { toDate: () => new Date('2024-01-01') },
      updatedAt: { toDate: () => new Date('2024-01-02') },
    };

    const mockUsageData = {
      id: 'subscription-usage',
      entriesUsed: 25,
      lastResetDate: { toDate: () => new Date('2024-01-01') },
      modelUsage: { 'gpt-4o-mini': 15, 'claude-3-sonnet': 10 },
    };

    vi.mocked(useDoc).mockImplementation((docRef) => {
      if (docRef === mockSubscriptionDocRef) {
        return {
          data: mockSubscriptionData,
          isLoading: false,
          error: null,
        };
      }
      return {
        data: mockUsageData,
        isLoading: false,
        error: null,
      };
    });

    const { result } = renderHook(() => useSubscription(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.usage).not.toBeNull();
    expect(result.current.usage?.entriesUsed).toBe(25);
    expect(result.current.usage?.entriesLimit).toBe(100);
    expect(result.current.usage?.modelUsage).toEqual({
      'gpt-4o-mini': 15,
      'claude-3-sonnet': 10,
    });
  });

  it('should provide refreshSubscription function', async () => {
    vi.mocked(useDoc).mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useSubscription(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(typeof result.current.refreshSubscription).toBe('function');
    await expect(result.current.refreshSubscription()).resolves.toBeUndefined();
  });

  it('should handle loading state from multiple sources', () => {
    vi.mocked(useUser).mockReturnValue({
      user: mockUser,
      isLoading: true,
      error: null,
    });
    vi.mocked(useDoc).mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useSubscription(), { wrapper });

    expect(result.current.isLoading).toBe(true);
  });

  it('should handle different subscription statuses', async () => {
    const statuses: SubscriptionStatus[] = ['active', 'canceled', 'past_due', 'trialing'];

    for (const status of statuses) {
      const mockSubscriptionData = {
        id: 'subscription-status',
        plan: 'basic' as SubscriptionPlan,
        status,
        createdAt: { toDate: () => new Date('2024-01-01') },
        updatedAt: { toDate: () => new Date('2024-01-02') },
      };

      vi.mocked(useDoc).mockImplementation((docRef) => {
        if (docRef === mockSubscriptionDocRef) {
          return {
            data: mockSubscriptionData,
            isLoading: false,
            error: null,
          };
        }
        return {
          data: null,
          isLoading: false,
          error: null,
        };
      });

      const { result } = renderHook(() => useSubscription(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.status).toBe(status);
    }
  });
});

