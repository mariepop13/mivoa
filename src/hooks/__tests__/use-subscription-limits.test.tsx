import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSubscriptionLimits } from '../use-subscription-limits';
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

vi.mock('../use-subscription-limits', async () => {
  const actual = await vi.importActual('../use-subscription-limits');
  return {
    ...actual,
    incrementEntryUsage: vi.fn(),
    checkAndResetIfNeeded: vi.fn(),
  };
});

const mockFirestore = { id: 'mock-firestore' } as unknown as Firestore;
const mockUser = { uid: 'test-user-id' } as Partial<User> as User;
const mockSubscriptionDocRef = { id: 'subscription-status' } as ReturnType<typeof doc>;
const mockUsageDocRef = { id: 'subscription-usage' } as ReturnType<typeof doc>;

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SubscriptionProvider>{children}</SubscriptionProvider>
);

describe('useSubscriptionLimits', () => {
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

  it('should return canCreateEntry true (entries are unlimited)', () => {
    vi.mocked(useDoc).mockReturnValueOnce({
      data: {
        id: 'subscription-status',
        plan: 'free',
        status: 'free',
      },
      isLoading: false,
      error: null,
    }).mockReturnValueOnce({
      data: {
        id: 'subscription-usage',
        entriesUsed: 1000,
        lastResetDate: { toDate: () => new Date() },
      },
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useSubscriptionLimits(), { wrapper });

    expect(result.current.canCreateEntry).toBe(true);
    expect(result.current.entriesRemaining).toBe(Infinity);
  });

  it('should return Infinity for unlimited plans', () => {
    vi.mocked(useDoc).mockReturnValueOnce({
      data: {
        id: 'subscription-status',
        plan: 'pro',
        status: 'active',
      },
      isLoading: false,
      error: null,
    }).mockReturnValueOnce({
      data: {
        id: 'subscription-usage',
        entriesUsed: 1000,
        lastResetDate: { toDate: () => new Date() },
      },
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useSubscriptionLimits(), { wrapper });

    expect(result.current.canCreateEntry).toBe(true);
    expect(result.current.entriesLimit).toBe(Infinity);
    expect(result.current.entriesRemaining).toBe(Infinity);
  });

  it('should return isLoading true when subscription is loading', () => {
    vi.mocked(useDoc).mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    const { result } = renderHook(() => useSubscriptionLimits(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.canCreateEntry).toBe(false);
  });
});

