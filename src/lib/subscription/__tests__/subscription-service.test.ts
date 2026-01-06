import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchSubscription,
  validateSubscription,
  calculateUsageResetDate,
  getDefaultSubscription,
  getSubscriptionWithUsage,
  validatePlanId,
  validateBillingCycle,
} from '../subscription-service';
import { getPlanLimits } from '../feature-gate';
import type { SubscriptionData, SubscriptionPlan } from '../types';
import { UNLIMITED_ENTRIES } from '../constants';

vi.mock('@/firebase', () => ({
  initializeFirebase: vi.fn(() => ({
    firestore: {
      collection: vi.fn(),
      doc: vi.fn(),
    },
  })),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  doc: vi.fn((firestore, path) => ({ path, firestore })),
  getDoc: vi.fn(),
}));

describe('subscription-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getPlanLimits', () => {
    it('should return limits for free plan', () => {
      const limits = getPlanLimits('free');
      expect(limits.entriesPerMonth).toBe(10);
      expect(limits.modelsAccess).toContain('gpt-3.5-turbo');
      expect(limits.exportEnabled).toBe(false);
      expect(limits.advancedAnalysis).toBe(false);
    });

    it('should return limits for basic plan', () => {
      const limits = getPlanLimits('basic');
      expect(limits.entriesPerMonth).toBe(100);
      expect(limits.modelsAccess).toContain('claude-3-sonnet');
      expect(limits.exportEnabled).toBe(true);
      expect(limits.advancedAnalysis).toBe(true);
    });

    it('should return limits for pro plan', () => {
      const limits = getPlanLimits('pro');
      expect(limits.entriesPerMonth).toBe(UNLIMITED_ENTRIES);
      expect(limits.modelsAccess).toContain('claude-3-opus');
      expect(limits.exportEnabled).toBe(true);
      expect(limits.exportResolution).toBe('high');
      expect(limits.customTemplates).toBe(true);
    });
  });

  describe('validateSubscription', () => {
    it('should return false for null subscription', () => {
      expect(validateSubscription(null)).toBe(false);
    });

    it('should return false for invalid plan', () => {
      const subscription = {
        ...getDefaultSubscription('user1'),
        plan: 'invalid' as SubscriptionPlan,
      };
      expect(validateSubscription(subscription)).toBe(false);
    });

    it('should return false for invalid status', () => {
      const subscription = {
        ...getDefaultSubscription('user1'),
        status: 'invalid' as any,
      };
      expect(validateSubscription(subscription)).toBe(false);
    });

    it('should return false for active subscription without stripeSubscriptionId', () => {
      const subscription: SubscriptionData = {
        ...getDefaultSubscription('user1'),
        status: 'active',
      };
      expect(validateSubscription(subscription)).toBe(false);
    });

    it('should return true for valid free subscription', () => {
      const subscription = getDefaultSubscription('user1');
      expect(validateSubscription(subscription)).toBe(true);
    });

    it('should return true for valid active subscription with stripeSubscriptionId', () => {
      const subscription: SubscriptionData = {
        ...getDefaultSubscription('user1'),
        status: 'active',
        stripeSubscriptionId: 'sub_123',
        plan: 'basic',
      };
      expect(validateSubscription(subscription)).toBe(true);
    });

    it('should return true for valid canceled subscription', () => {
      const subscription: SubscriptionData = {
        ...getDefaultSubscription('user1'),
        status: 'canceled',
        plan: 'basic',
      };
      expect(validateSubscription(subscription)).toBe(true);
    });

    it('should return true for all valid subscription statuses', () => {
      const validStatuses: Array<SubscriptionData['status']> = [
        'free',
        'active',
        'canceled',
        'past_due',
        'trialing',
        'incomplete',
        'incomplete_expired',
        'unpaid',
      ];

      validStatuses.forEach((status) => {
        const subscription: SubscriptionData = {
          ...getDefaultSubscription('user1'),
          status,
          plan: 'basic',
          ...(status === 'active' && { stripeSubscriptionId: 'sub_123' }),
        };
        expect(validateSubscription(subscription)).toBe(true);
      });
    });
  });

  describe('getDefaultSubscription', () => {
    it('should return default free subscription', () => {
      const subscription = getDefaultSubscription('user123');
      expect(subscription.userId).toBe('user123');
      expect(subscription.plan).toBe('free');
      expect(subscription.status).toBe('free');
      expect(subscription.createdAt).toBeInstanceOf(Date);
      expect(subscription.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('calculateUsageResetDate', () => {
    it('should calculate reset dates from null (first time)', () => {
      const result = calculateUsageResetDate(null);
      expect(result.lastResetDate).toBeInstanceOf(Date);
      expect(result.nextResetDate).toBeInstanceOf(Date);
      expect(result.nextResetDate.getDate()).toBe(1);
      expect(result.nextResetDate.getHours()).toBe(0);
      expect(result.nextResetDate.getMinutes()).toBe(0);
    });

    it('should calculate reset dates from last reset date', () => {
      const lastReset = new Date('2024-01-15T10:00:00Z');
      const result = calculateUsageResetDate(lastReset);
      expect(result.lastResetDate).toEqual(lastReset);
      expect(result.nextResetDate).toBeInstanceOf(Date);
      expect(result.nextResetDate.getDate()).toBe(1);
    });

    it('should calculate next reset in future month', () => {
      const now = new Date();
      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const result = calculateUsageResetDate(null);
      expect(result.nextResetDate.getTime()).toBeGreaterThan(currentMonth.getTime());
    });

    it('should handle month boundaries correctly', () => {
      const lastReset = new Date('2024-01-31T00:00:00Z');
      const result = calculateUsageResetDate(lastReset);
      expect(result.nextResetDate.getMonth()).toBeGreaterThan(0);
      expect(result.nextResetDate.getDate()).toBe(1);
    });

    it('should handle lastReset in the future month correctly', () => {
      const now = new Date();
      const futureDate = new Date(now);
      futureDate.setMonth(futureDate.getMonth() + 1);
      futureDate.setDate(15);
      
      const result = calculateUsageResetDate(futureDate);
      expect(result.lastResetDate).toEqual(futureDate);
      const expectedNextReset = new Date(futureDate);
      expectedNextReset.setMonth(expectedNextReset.getMonth() + 1);
      expectedNextReset.setDate(1);
      expectedNextReset.setHours(0, 0, 0, 0);
      expect(result.nextResetDate).toEqual(expectedNextReset);
    });

    it('should use lastResetNextMonth when it is greater than nextReset', () => {
      const now = new Date();
      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const futureDate = new Date(currentMonth);
      futureDate.setMonth(futureDate.getMonth() + 2);
      futureDate.setDate(15);
      futureDate.setHours(0, 0, 0, 0);
      
      const result = calculateUsageResetDate(futureDate);
      expect(result.lastResetDate).toEqual(futureDate);
      const expectedNextReset = new Date(futureDate);
      expectedNextReset.setMonth(expectedNextReset.getMonth() + 1);
      expectedNextReset.setDate(1);
      expectedNextReset.setHours(0, 0, 0, 0);
      expect(result.nextResetDate.getTime()).toBeGreaterThanOrEqual(expectedNextReset.getTime());
    });
  });

  describe('fetchSubscription', () => {
    it('should return null when subscription does not exist', async () => {
      const { getDoc } = await import('firebase/firestore');
      vi.mocked(getDoc).mockResolvedValue({
        exists: vi.fn(() => false),
        data: vi.fn(),
      } as any);

      const result = await fetchSubscription('user123');
      expect(result).toBeNull();
    });

    it('should return subscription data when exists', async () => {
      const { getDoc } = await import('firebase/firestore');
      const mockDate = {
        toDate: () => new Date('2024-01-01T00:00:00Z'),
      };

      vi.mocked(getDoc).mockResolvedValue({
        exists: vi.fn(() => true),
        data: vi.fn(() => ({
          plan: 'basic',
          status: 'active',
          stripeCustomerId: 'cus_123',
          stripeSubscriptionId: 'sub_123',
          createdAt: mockDate,
          updatedAt: mockDate,
        })),
      } as any);

      const result = await fetchSubscription('user123');
      expect(result).not.toBeNull();
      expect(result?.plan).toBe('basic');
      expect(result?.status).toBe('active');
      expect(result?.stripeCustomerId).toBe('cus_123');
    });

    it('should handle subscription data with all optional fields', async () => {
      const { getDoc } = await import('firebase/firestore');
      const mockDate = {
        toDate: () => new Date('2024-01-01T00:00:00Z'),
      };

      vi.mocked(getDoc).mockResolvedValue({
        exists: vi.fn(() => true),
        data: vi.fn(() => ({
          plan: 'pro',
          status: 'active',
          stripeCustomerId: 'cus_123',
          stripeSubscriptionId: 'sub_123',
          stripePriceId: 'price_123',
          currentPeriodStart: mockDate,
          currentPeriodEnd: mockDate,
          cancelAtPeriodEnd: true,
          canceledAt: mockDate,
          trialEnd: mockDate,
          billingCycle: 'annual',
          createdAt: mockDate,
          updatedAt: mockDate,
        })),
      } as any);

      const result = await fetchSubscription('user123');
      expect(result).not.toBeNull();
      expect(result?.plan).toBe('pro');
      expect(result?.status).toBe('active');
      expect(result?.stripePriceId).toBe('price_123');
      expect(result?.cancelAtPeriodEnd).toBe(true);
      expect(result?.billingCycle).toBe('annual');
      expect(result?.currentPeriodStart).toBeInstanceOf(Date);
      expect(result?.currentPeriodEnd).toBeInstanceOf(Date);
      expect(result?.canceledAt).toBeInstanceOf(Date);
      expect(result?.trialEnd).toBeInstanceOf(Date);
    });

    it('should handle subscription data with missing optional fields', async () => {
      const { getDoc } = await import('firebase/firestore');
      const mockDate = {
        toDate: () => new Date('2024-01-01T00:00:00Z'),
      };

      vi.mocked(getDoc).mockResolvedValue({
        exists: vi.fn(() => true),
        data: vi.fn(() => ({
          plan: 'basic',
          status: 'free',
          createdAt: mockDate,
          updatedAt: mockDate,
        })),
      } as any);

      const result = await fetchSubscription('user123');
      expect(result).not.toBeNull();
      expect(result?.plan).toBe('basic');
      expect(result?.status).toBe('free');
      expect(result?.stripeCustomerId).toBeUndefined();
      expect(result?.stripeSubscriptionId).toBeUndefined();
      expect(result?.currentPeriodStart).toBeUndefined();
      expect(result?.currentPeriodEnd).toBeUndefined();
      expect(result?.cancelAtPeriodEnd).toBeUndefined();
    });

    it('should default to free plan and status when missing', async () => {
      const { getDoc } = await import('firebase/firestore');
      const mockDate = {
        toDate: () => new Date('2024-01-01T00:00:00Z'),
      };

      vi.mocked(getDoc).mockResolvedValue({
        exists: vi.fn(() => true),
        data: vi.fn(() => ({
          createdAt: mockDate,
          updatedAt: mockDate,
        })),
      } as any);

      const result = await fetchSubscription('user123');
      expect(result).not.toBeNull();
      expect(result?.plan).toBe('free');
      expect(result?.status).toBe('free');
    });

    it('should handle Firestore errors when fetching subscription', async () => {
      const { getDoc } = await import('firebase/firestore');
      const firestoreError = new Error('Firestore connection error');
      vi.mocked(getDoc).mockRejectedValue(firestoreError);

      await expect(fetchSubscription('user123')).rejects.toThrow('Firestore connection error');
    });
  });

  describe('getSubscriptionWithUsage', () => {
    it('should return default subscription when none exists', async () => {
      const { getDoc } = await import('firebase/firestore');
      vi.mocked(getDoc)
        .mockResolvedValueOnce({
          exists: vi.fn(() => false),
          data: vi.fn(),
        } as any)
        .mockResolvedValueOnce({
          exists: vi.fn(() => false),
          data: vi.fn(),
        } as any);

      const result = await getSubscriptionWithUsage('user123');
      expect(result.plan).toBe('free');
      expect(result.status).toBe('free');
      expect(result.limits.entriesPerMonth).toBe(10);
      expect(result.usage.entriesUsed).toBe(0);
      expect(result.usage.entriesLimit).toBe(10);
    });

    it('should return subscription with usage stats', async () => {
      const { getDoc } = await import('firebase/firestore');
      const mockDate = {
        toDate: () => new Date('2024-01-01T00:00:00Z'),
      };

      vi.mocked(getDoc)
        .mockResolvedValueOnce({
          exists: vi.fn(() => true),
          data: vi.fn(() => ({
            plan: 'basic',
            status: 'active',
            stripeSubscriptionId: 'sub_123',
            createdAt: mockDate,
            updatedAt: mockDate,
          })),
        } as any)
        .mockResolvedValueOnce({
          exists: vi.fn(() => true),
          data: vi.fn(() => ({
            entriesUsed: 25,
            modelUsage: { 'gpt-4': 10 },
            lastResetDate: mockDate,
          })),
        } as any);

      const result = await getSubscriptionWithUsage('user123');
      expect(result.plan).toBe('basic');
      expect(result.limits.entriesPerMonth).toBe(100);
      expect(result.usage.entriesUsed).toBe(25);
      expect(result.usage.entriesLimit).toBe(100);
      expect(result.usage.modelUsage).toEqual({ 'gpt-4': 10 });
    });

    it('should handle unlimited plan correctly', async () => {
      const { getDoc } = await import('firebase/firestore');
      const mockDate = {
        toDate: () => new Date('2024-01-01T00:00:00Z'),
      };

      vi.mocked(getDoc)
        .mockResolvedValueOnce({
          exists: vi.fn(() => true),
          data: vi.fn(() => ({
            plan: 'pro',
            status: 'active',
            stripeSubscriptionId: 'sub_123',
            createdAt: mockDate,
            updatedAt: mockDate,
          })),
        } as any)
        .mockResolvedValueOnce({
          exists: vi.fn(() => false),
          data: vi.fn(),
        } as any);

      const result = await getSubscriptionWithUsage('user123');
      expect(result.plan).toBe('pro');
      expect(result.usage.entriesLimit).toBe(Infinity);
    });

    it('should handle Firestore error in getUsageStats and return fallback', async () => {
      const { getDoc } = await import('firebase/firestore');
      const mockDate = {
        toDate: () => new Date('2024-01-01T00:00:00Z'),
      };

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      vi.mocked(getDoc)
        .mockResolvedValueOnce({
          exists: vi.fn(() => true),
          data: vi.fn(() => ({
            plan: 'basic',
            status: 'active',
            stripeSubscriptionId: 'sub_123',
            createdAt: mockDate,
            updatedAt: mockDate,
          })),
        } as any)
        .mockRejectedValueOnce(new Error('Firestore error'));

      const result = await getSubscriptionWithUsage('user123');

      expect(result.plan).toBe('basic');
      expect(result.usage.entriesUsed).toBe(0);
      expect(result.usage.entriesLimit).toBe(100);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to fetch usage stats from Firestore',
        expect.objectContaining({
          userId: 'user123',
          plan: 'basic',
          error: 'Firestore error',
        })
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle non-Error exceptions in getUsageStats', async () => {
      const { getDoc } = await import('firebase/firestore');
      const mockDate = {
        toDate: () => new Date('2024-01-01T00:00:00Z'),
      };
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      vi.mocked(getDoc)
        .mockResolvedValueOnce({
          exists: vi.fn(() => true),
          data: vi.fn(() => ({
            plan: 'basic',
            status: 'active',
            stripeSubscriptionId: 'sub_123',
            createdAt: mockDate,
            updatedAt: mockDate,
          })),
        } as any)
        .mockRejectedValueOnce('String error');

      const result = await getSubscriptionWithUsage('user123');

      expect(result.plan).toBe('basic');
      expect(result.usage.entriesUsed).toBe(0);
      expect(result.usage.entriesLimit).toBe(100);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to fetch usage stats from Firestore',
        expect.objectContaining({
          userId: 'user123',
          plan: 'basic',
          error: 'String error',
        })
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('validatePlanId', () => {
    it('should return true for valid plan IDs', () => {
      expect(validatePlanId('free')).toBe(true);
      expect(validatePlanId('basic')).toBe(true);
      expect(validatePlanId('pro')).toBe(true);
    });

    it('should return false for invalid plan IDs', () => {
      expect(validatePlanId('invalid')).toBe(false);
      expect(validatePlanId('premium')).toBe(false);
      expect(validatePlanId('')).toBe(false);
      expect(validatePlanId('FREE')).toBe(false);
    });
  });

  describe('validateBillingCycle', () => {
    it('should return true for valid billing cycles', () => {
      expect(validateBillingCycle('monthly')).toBe(true);
      expect(validateBillingCycle('annual')).toBe(true);
    });

    it('should return false for invalid billing cycles', () => {
      expect(validateBillingCycle('invalid')).toBe(false);
      expect(validateBillingCycle('month')).toBe(false);
      expect(validateBillingCycle('year')).toBe(false);
      expect(validateBillingCycle('')).toBe(false);
      expect(validateBillingCycle('MONTHLY')).toBe(false);
    });
  });
});
