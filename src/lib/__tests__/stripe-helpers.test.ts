import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getOrCreateStripeCustomer, getStripePriceId, formatSubscriptionResponse } from '../stripe-helpers';
import { getStripeClient } from '@/lib/subscription/stripe-client';
import type { SubscriptionData } from '@/lib/subscription/types';

vi.mock('@/lib/subscription/stripe-client');
vi.mock('@/lib/subscription/constants', () => ({
  getPriceId: vi.fn((plan, cycle, currency) => `price_${plan}_${cycle}_${currency}`),
}));

describe('stripe-helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getOrCreateStripeCustomer', () => {
    it('should return existing customer when found', async () => {
      const mockCustomer = { id: 'cus_existing', email: 'test@example.com' };
      const mockStripe = {
        customers: {
          list: vi.fn().mockResolvedValue({ data: [mockCustomer] }),
        },
      };

      vi.mocked(getStripeClient).mockReturnValue(mockStripe as any);

      const customer = await getOrCreateStripeCustomer('user-id', 'test@example.com');

      expect(customer).toBe(mockCustomer);
      expect(mockStripe.customers.list).toHaveBeenCalledWith({
        email: 'test@example.com',
        limit: 1,
      });
    });

    it('should create new customer when not found', async () => {
      const mockNewCustomer = { id: 'cus_new', email: 'test@example.com' };
      const mockStripe = {
        customers: {
          list: vi.fn().mockResolvedValue({ data: [] }),
          create: vi.fn().mockResolvedValue(mockNewCustomer),
        },
      };

      vi.mocked(getStripeClient).mockReturnValue(mockStripe as any);

      const customer = await getOrCreateStripeCustomer('user-id', 'test@example.com');

      expect(customer).toBe(mockNewCustomer);
      expect(mockStripe.customers.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        metadata: { userId: 'user-id' },
      });
    });

    it('should handle null email', async () => {
      const mockNewCustomer = { id: 'cus_new' };
      const mockStripe = {
        customers: {
          list: vi.fn().mockResolvedValue({ data: [] }),
          create: vi.fn().mockResolvedValue(mockNewCustomer),
        },
      };

      vi.mocked(getStripeClient).mockReturnValue(mockStripe as any);

      const customer = await getOrCreateStripeCustomer('user-id', null);

      expect(customer).toBe(mockNewCustomer);
      expect(mockStripe.customers.create).toHaveBeenCalledWith({
        email: undefined,
        metadata: { userId: 'user-id' },
      });
    });
  });

  describe('getStripePriceId', () => {
    it('should return price ID for basic monthly USD', () => {
      const priceId = getStripePriceId('basic', 'monthly', 'USD');
      expect(priceId).toBe('price_basic_monthly_USD');
    });

    it('should return price ID for pro annual CAD', () => {
      const priceId = getStripePriceId('pro', 'annual', 'CAD');
      expect(priceId).toBe('price_pro_annual_CAD');
    });

    it('should default to USD when currency not specified', () => {
      const priceId = getStripePriceId('basic', 'monthly');
      expect(priceId).toBe('price_basic_monthly_USD');
    });

    it('should throw error for free plan', () => {
      expect(() => getStripePriceId('free', 'monthly', 'USD')).toThrow(
        'Free plan does not have a Stripe price ID'
      );
    });
  });

  describe('formatSubscriptionResponse', () => {
    it('should format subscription data with Date objects', () => {
      const now = new Date();
      const data: SubscriptionData = {
        userId: 'user-id',
        plan: 'basic',
        status: 'active',
        billingCycle: 'monthly',
        stripeCustomerId: 'cus_test',
        stripeSubscriptionId: 'sub_test',
        currentPeriodStart: now,
        currentPeriodEnd: now,
        cancelAtPeriodEnd: false,
        createdAt: now,
        updatedAt: now,
      };

      const result = formatSubscriptionResponse(data);

      expect(result.plan).toBe('basic');
      expect(result.status).toBe('active');
      expect(result.billingCycle).toBe('monthly');
      expect(result.currentPeriodStart).toBe(now.toISOString());
      expect(result.currentPeriodEnd).toBe(now.toISOString());
    });

    it('should format subscription data with Date objects from ISO strings', () => {
      const timestamp = new Date().toISOString();
      const dateObj = new Date(timestamp);
      const data: SubscriptionData = {
        userId: 'user-id',
        plan: 'pro',
        status: 'active',
        billingCycle: 'annual',
        stripeCustomerId: 'cus_test',
        stripeSubscriptionId: 'sub_test',
        currentPeriodStart: dateObj,
        currentPeriodEnd: dateObj,
        cancelAtPeriodEnd: false,
        createdAt: dateObj,
        updatedAt: dateObj,
      };

      const result = formatSubscriptionResponse(data);

      expect(result.currentPeriodStart).toBe(timestamp);
      expect(result.currentPeriodEnd).toBe(timestamp);
    });

    it('should handle null timestamps', () => {
      const now = new Date();
      const data: SubscriptionData = {
        userId: 'user-id',
        plan: 'free',
        status: 'free',
        billingCycle: undefined,
        stripeCustomerId: undefined,
        stripeSubscriptionId: undefined,
        currentPeriodStart: undefined,
        currentPeriodEnd: undefined,
        cancelAtPeriodEnd: false,
        createdAt: now,
        updatedAt: now,
      };

      const result = formatSubscriptionResponse(data);

      expect(result.currentPeriodStart).toBeNull();
      expect(result.currentPeriodEnd).toBeNull();
    });
  });
});

