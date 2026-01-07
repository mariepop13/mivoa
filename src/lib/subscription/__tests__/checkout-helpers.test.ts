import { describe, it, expect, vi, beforeEach } from 'vitest';
import Stripe from 'stripe';
import { validateCheckoutRequest, createStripeCheckoutSession } from '../checkout-helpers';
import { getStripeClient } from '../stripe-client';
import { getStripePriceId } from '@/lib/stripe-helpers';

vi.mock('../stripe-client');
vi.mock('@/lib/stripe-helpers');

describe('checkout-helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateCheckoutRequest', () => {
    it('should return error when user is not authenticated', () => {
      const result = validateCheckoutRequest(
        { planId: 'basic', billingCycle: 'monthly' },
        null
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized');
    });

    it('should return error when planId is missing', () => {
      const result = validateCheckoutRequest(
        { billingCycle: 'monthly' } as any,
        'user-id'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('planId is required');
    });

    it('should return error when billingCycle is missing', () => {
      const result = validateCheckoutRequest(
        { planId: 'basic' } as any,
        'user-id'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('billingCycle is required');
    });

    it('should return error when planId is invalid', () => {
      const result = validateCheckoutRequest(
        { planId: 'invalid', billingCycle: 'monthly' },
        'user-id'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid planId. Must be "basic" or "pro"');
    });

    it('should return error when billingCycle is invalid', () => {
      const result = validateCheckoutRequest(
        { planId: 'basic', billingCycle: 'invalid' },
        'user-id'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid billingCycle. Must be "monthly" or "annual"');
    });

    it('should return error when currency is invalid', () => {
      const result = validateCheckoutRequest(
        { planId: 'basic', billingCycle: 'monthly', currency: 'EUR' },
        'user-id'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid currency. Must be "USD" or "CAD"');
    });

    it('should return success with priceId for valid basic monthly USD request', () => {
      vi.mocked(getStripePriceId).mockReturnValue('price_basic_monthly_usd');

      const result = validateCheckoutRequest(
        { planId: 'basic', billingCycle: 'monthly', currency: 'USD' },
        'user-id'
      );

      expect(result.success).toBe(true);
      expect(result.priceId).toBe('price_basic_monthly_usd');
      expect(result.planId).toBe('basic');
      expect(result.billingCycle).toBe('monthly');
      expect(result.currency).toBe('USD');
    });

    it('should return success with priceId for valid pro annual CAD request', () => {
      vi.mocked(getStripePriceId).mockReturnValue('price_pro_annual_cad');

      const result = validateCheckoutRequest(
        { planId: 'pro', billingCycle: 'annual', currency: 'CAD' },
        'user-id'
      );

      expect(result.success).toBe(true);
      expect(result.priceId).toBe('price_pro_annual_cad');
      expect(result.planId).toBe('pro');
      expect(result.billingCycle).toBe('annual');
      expect(result.currency).toBe('CAD');
    });

    it('should default to USD when currency is not provided', () => {
      vi.mocked(getStripePriceId).mockReturnValue('price_basic_monthly_usd');

      const result = validateCheckoutRequest(
        { planId: 'basic', billingCycle: 'monthly' },
        'user-id'
      );

      expect(result.success).toBe(true);
      expect(result.currency).toBe('USD');
    });

    it('should return error when getStripePriceId throws', () => {
      vi.mocked(getStripePriceId).mockImplementation(() => {
        throw new Error('Price ID not found');
      });

      const result = validateCheckoutRequest(
        { planId: 'basic', billingCycle: 'monthly' },
        'user-id'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Price ID not found');
    });
  });

  describe('createStripeCheckoutSession', () => {
    const mockCustomer: Stripe.Customer = {
      id: 'cus_test123',
      object: 'customer',
      created: 1234567890,
    } as Stripe.Customer;

    const mockSession: Stripe.Checkout.Session = {
      id: 'cs_test123',
      object: 'checkout.session',
      url: 'https://checkout.stripe.com/test',
    } as Stripe.Checkout.Session;

    it('should create checkout session successfully', async () => {
      const mockStripe = {
        checkout: {
          sessions: {
            create: vi.fn().mockResolvedValue(mockSession),
          },
        },
      };

      vi.mocked(getStripeClient).mockReturnValue(mockStripe as any);

      const url = await createStripeCheckoutSession({
        customer: mockCustomer,
        priceId: 'price_test',
        userId: 'user-id',
        planId: 'basic',
        billingCycle: 'monthly',
        origin: 'http://localhost:3000',
      });

      expect(url).toBe('https://checkout.stripe.com/test');
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith({
        customer: 'cus_test123',
        mode: 'subscription',
        line_items: [
          {
            price: 'price_test',
            quantity: 1,
          },
        ],
        success_url: 'http://localhost:3000/subscription/success?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'http://localhost:3000/subscription/cancel',
        metadata: {
          userId: 'user-id',
          planId: 'basic',
          billingCycle: 'monthly',
        },
        subscription_data: {
          metadata: {
            userId: 'user-id',
            planId: 'basic',
          },
        },
      });
    });

    it('should throw error when session URL is missing', async () => {
      const mockStripe = {
        checkout: {
          sessions: {
            create: vi.fn().mockResolvedValue({
              ...mockSession,
              url: null,
            }),
          },
        },
      };

      vi.mocked(getStripeClient).mockReturnValue(mockStripe as any);

      await expect(
        createStripeCheckoutSession({
          customer: mockCustomer,
          priceId: 'price_test',
          userId: 'user-id',
          planId: 'basic',
          billingCycle: 'monthly',
          origin: 'http://localhost:3000',
        })
      ).rejects.toThrow('Failed to create checkout session');
    });

    it('should use correct origin in success and cancel URLs', async () => {
      const mockStripe = {
        checkout: {
          sessions: {
            create: vi.fn().mockResolvedValue(mockSession),
          },
        },
      };

      vi.mocked(getStripeClient).mockReturnValue(mockStripe as any);

      await createStripeCheckoutSession({
        customer: mockCustomer,
        priceId: 'price_test',
        userId: 'user-id',
        planId: 'pro',
        billingCycle: 'annual',
        origin: 'https://example.com',
      });

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          success_url: 'https://example.com/subscription/success?session_id={CHECKOUT_SESSION_ID}',
          cancel_url: 'https://example.com/subscription/cancel',
        })
      );
    });
  });
});

