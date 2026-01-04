import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSubscription } from '../use-subscription';
import { SubscriptionProvider } from '@/context/SubscriptionContext';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

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

describe('useSubscription', () => {
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
    vi.mocked(useDoc).mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });
  });

  it('should throw error when used outside provider', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useSubscription());
    }).toThrow('useSubscription must be used within SubscriptionProvider');

    consoleErrorSpy.mockRestore();
  });

  it('should return context values when used inside provider', () => {
    const { result } = renderHook(() => useSubscription(), { wrapper });

    expect(result.current).toBeDefined();
    expect(result.current.plan).toBeDefined();
    expect(result.current.status).toBeDefined();
    expect(result.current.limits).toBeDefined();
    expect(result.current.isLoading).toBeDefined();
    expect(result.current.error).toBeDefined();
    expect(result.current.refreshSubscription).toBeDefined();
    expect(result.current.isPremium).toBeDefined();
    expect(result.current.isBasic).toBeDefined();
    expect(result.current.isPro).toBeDefined();
  });

  it('should return correct values for free plan', () => {
    const { result } = renderHook(() => useSubscription(), { wrapper });

    expect(result.current.plan).toBe('free');
    expect(result.current.status).toBe('free');
    expect(result.current.limits.entriesPerMonth).toBe(10);
    expect(result.current.isPremium).toBe(false);
    expect(result.current.isBasic).toBe(false);
    expect(result.current.isPro).toBe(false);
  });

  it('should provide type-safe access to context', () => {
    const { result } = renderHook(() => useSubscription(), { wrapper });

    const subscription = result.current;

    expect(typeof subscription.plan).toBe('string');
    expect(typeof subscription.status).toBe('string');
    expect(typeof subscription.isLoading).toBe('boolean');
    expect(typeof subscription.isPremium).toBe('boolean');
    expect(typeof subscription.isBasic).toBe('boolean');
    expect(typeof subscription.isPro).toBe('boolean');
    expect(typeof subscription.refreshSubscription).toBe('function');
  });

  it('should allow destructuring of context values', () => {
    const { result } = renderHook(() => {
      const subscription = useSubscription();
      return {
        plan: subscription.plan,
        status: subscription.status,
        isLoading: subscription.isLoading,
      };
    }, { wrapper });

    expect(result.current.plan).toBe('free');
    expect(result.current.status).toBe('free');
    expect(result.current.isLoading).toBeDefined();
  });
});

