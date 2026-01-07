import { describe, it, expect } from 'vitest';
import {
  SUBSCRIPTION_PLANS,
  PLAN_LIMITS,
  PLAN_PRICING,
  PLAN_FEATURES,
  STRIPE_PRICE_ID_ENV_VARS,
  UNLIMITED_ENTRIES,
  getPriceId,
  getPlanLimitsWithCache,
} from '../constants';

describe('subscription constants', () => {
  describe('SUBSCRIPTION_PLANS', () => {
    it('should contain all plan types', () => {
      expect(SUBSCRIPTION_PLANS).toContain('free');
      expect(SUBSCRIPTION_PLANS).toContain('supporter');
      expect(SUBSCRIPTION_PLANS).toContain('basic');
      expect(SUBSCRIPTION_PLANS).toContain('pro');
      expect(SUBSCRIPTION_PLANS.length).toBe(4);
    });
  });

  describe('PLAN_LIMITS', () => {
    it('should define limits for all plans', () => {
      SUBSCRIPTION_PLANS.forEach((plan) => {
        expect(PLAN_LIMITS[plan]).toBeDefined();
        expect(PLAN_LIMITS[plan].entriesPerMonth).toBeDefined();
        expect(PLAN_LIMITS[plan].modelsAccess).toBeInstanceOf(Array);
        expect(typeof PLAN_LIMITS[plan].exportEnabled).toBe('boolean');
      });
    });

    it('should have increasing limits from free to pro', () => {
      expect(PLAN_LIMITS.free.entriesPerMonth).toBeLessThan(
        PLAN_LIMITS.basic.entriesPerMonth
      );
      expect(PLAN_LIMITS.pro.entriesPerMonth).toBe(UNLIMITED_ENTRIES);
    });

    it('should have more models for higher tiers', () => {
      expect(PLAN_LIMITS.free.modelsAccess.length).toBeLessThan(
        PLAN_LIMITS.basic.modelsAccess.length
      );
      expect(PLAN_LIMITS.basic.modelsAccess.length).toBeLessThanOrEqual(
        PLAN_LIMITS.pro.modelsAccess.length
      );
    });
  });

  describe('getPlanLimitsWithCache', () => {
    it('should return limits for free plan', () => {
      const limits = getPlanLimitsWithCache('free');
      expect(limits.entriesPerMonth).toBe(10);
      expect(limits.exportEnabled).toBe(false);
    });

    it('should return limits for basic plan', () => {
      const limits = getPlanLimitsWithCache('basic');
      expect(limits.entriesPerMonth).toBe(100);
      expect(limits.exportEnabled).toBe(true);
    });

    it('should return limits for pro plan', () => {
      const limits = getPlanLimitsWithCache('pro');
      expect(limits.entriesPerMonth).toBe(UNLIMITED_ENTRIES);
      expect(limits.exportEnabled).toBe(true);
    });

    it('should return same limits as PLAN_LIMITS', () => {
      SUBSCRIPTION_PLANS.forEach((plan) => {
        const cachedLimits = getPlanLimitsWithCache(plan);
        const directLimits = PLAN_LIMITS[plan];
        expect(cachedLimits).toEqual(directLimits);
      });
    });
  });

  describe('PLAN_PRICING', () => {
    it('should define pricing for all plans and cycles', () => {
      SUBSCRIPTION_PLANS.forEach((plan) => {
        expect(PLAN_PRICING[plan].monthly).toBeDefined();
        expect(PLAN_PRICING[plan].annual).toBeDefined();
        expect(PLAN_PRICING[plan].monthly.USD).toBeDefined();
        expect(PLAN_PRICING[plan].monthly.CAD).toBeDefined();
        expect(PLAN_PRICING[plan].annual.USD).toBeDefined();
        expect(PLAN_PRICING[plan].annual.CAD).toBeDefined();
      });
    });

    it('should have free plan at 0', () => {
      expect(PLAN_PRICING.free.monthly.USD).toBe(0);
      expect(PLAN_PRICING.free.annual.USD).toBe(0);
      expect(PLAN_PRICING.free.monthly.CAD).toBe(0);
      expect(PLAN_PRICING.free.annual.CAD).toBe(0);
    });

    it('should have positive prices for paid plans', () => {
      expect(PLAN_PRICING.basic.monthly.USD).toBeGreaterThan(0);
      expect(PLAN_PRICING.basic.annual.USD).toBeGreaterThan(0);
      expect(PLAN_PRICING.pro.monthly.USD).toBeGreaterThan(0);
      expect(PLAN_PRICING.pro.annual.USD).toBeGreaterThan(0);
    });

    it('should have annual pricing higher than monthly', () => {
      expect(PLAN_PRICING.basic.annual.USD).toBeGreaterThan(
        PLAN_PRICING.basic.monthly.USD
      );
      expect(PLAN_PRICING.pro.annual.USD).toBeGreaterThan(
        PLAN_PRICING.pro.monthly.USD
      );
    });
  });

  describe('PLAN_FEATURES', () => {
    it('should define features for all plans', () => {
      SUBSCRIPTION_PLANS.forEach((plan) => {
        expect(PLAN_FEATURES[plan]).toBeInstanceOf(Array);
        expect(PLAN_FEATURES[plan].length).toBeGreaterThan(0);
      });
    });

    it('should have more features for higher tiers', () => {
      expect(PLAN_FEATURES.free.length).toBeLessThanOrEqual(
        PLAN_FEATURES.basic.length
      );
      expect(PLAN_FEATURES.basic.length).toBeLessThanOrEqual(
        PLAN_FEATURES.pro.length
      );
    });
  });

  describe('STRIPE_PRICE_ID_ENV_VARS', () => {
    it('should define env var names for all plans, cycles, and currencies', () => {
      SUBSCRIPTION_PLANS.forEach((plan) => {
        expect(STRIPE_PRICE_ID_ENV_VARS[plan].monthly).toBeDefined();
        expect(STRIPE_PRICE_ID_ENV_VARS[plan].annual).toBeDefined();
        expect(STRIPE_PRICE_ID_ENV_VARS[plan].monthly.USD).toBeDefined();
        expect(STRIPE_PRICE_ID_ENV_VARS[plan].monthly.CAD).toBeDefined();
        expect(STRIPE_PRICE_ID_ENV_VARS[plan].annual.USD).toBeDefined();
        expect(STRIPE_PRICE_ID_ENV_VARS[plan].annual.CAD).toBeDefined();
      });
    });

    it('should have correct env var name format', () => {
      expect(STRIPE_PRICE_ID_ENV_VARS.basic.monthly.USD).toBe(
        'STRIPE_PRICE_ID_BASIC_MONTHLY_USD'
      );
      expect(STRIPE_PRICE_ID_ENV_VARS.pro.annual.CAD).toBe(
        'STRIPE_PRICE_ID_PRO_ANNUAL_CAD'
      );
    });
  });

  describe('getPriceId', () => {
    it('should return price ID from environment variable for basic monthly USD', () => {
      process.env.STRIPE_PRICE_ID_BASIC_MONTHLY_USD = 'price_basic_monthly_usd';
      const priceId = getPriceId('basic', 'monthly', 'USD');
      expect(priceId).toBe('price_basic_monthly_usd');
      delete process.env.STRIPE_PRICE_ID_BASIC_MONTHLY_USD;
    });

    it('should return price ID from environment variable for pro annual CAD', () => {
      process.env.STRIPE_PRICE_ID_PRO_ANNUAL_CAD = 'price_pro_annual_cad';
      const priceId = getPriceId('pro', 'annual', 'CAD');
      expect(priceId).toBe('price_pro_annual_cad');
      delete process.env.STRIPE_PRICE_ID_PRO_ANNUAL_CAD;
    });

    it('should default to USD when currency not specified', () => {
      process.env.STRIPE_PRICE_ID_BASIC_MONTHLY_USD = 'price_basic_monthly_usd';
      const priceId = getPriceId('basic', 'monthly');
      expect(priceId).toBe('price_basic_monthly_usd');
      delete process.env.STRIPE_PRICE_ID_BASIC_MONTHLY_USD;
    });

    it('should throw error when environment variable is missing', () => {
      const originalValue = process.env.STRIPE_PRICE_ID_BASIC_MONTHLY_USD;
      delete process.env.STRIPE_PRICE_ID_BASIC_MONTHLY_USD;
      
      try {
        expect(() => getPriceId('basic', 'monthly', 'USD')).toThrow(
          'Missing required Stripe price ID environment variables'
        );
      } finally {
        if (originalValue) {
          process.env.STRIPE_PRICE_ID_BASIC_MONTHLY_USD = originalValue;
        }
      }
    });

    it('should handle all plan, cycle, and currency combinations', () => {
      const combinations = [
        { plan: 'supporter' as const, cycle: 'monthly' as const, currency: 'USD' as const, env: 'STRIPE_PRICE_ID_SUPPORTER_MONTHLY_USD' },
        { plan: 'supporter' as const, cycle: 'monthly' as const, currency: 'CAD' as const, env: 'STRIPE_PRICE_ID_SUPPORTER_MONTHLY_CAD' },
        { plan: 'supporter' as const, cycle: 'annual' as const, currency: 'USD' as const, env: 'STRIPE_PRICE_ID_SUPPORTER_ANNUAL_USD' },
        { plan: 'supporter' as const, cycle: 'annual' as const, currency: 'CAD' as const, env: 'STRIPE_PRICE_ID_SUPPORTER_ANNUAL_CAD' },
        { plan: 'basic' as const, cycle: 'monthly' as const, currency: 'USD' as const, env: 'STRIPE_PRICE_ID_BASIC_MONTHLY_USD' },
        { plan: 'basic' as const, cycle: 'monthly' as const, currency: 'CAD' as const, env: 'STRIPE_PRICE_ID_BASIC_MONTHLY_CAD' },
        { plan: 'basic' as const, cycle: 'annual' as const, currency: 'USD' as const, env: 'STRIPE_PRICE_ID_BASIC_ANNUAL_USD' },
        { plan: 'basic' as const, cycle: 'annual' as const, currency: 'CAD' as const, env: 'STRIPE_PRICE_ID_BASIC_ANNUAL_CAD' },
        { plan: 'pro' as const, cycle: 'monthly' as const, currency: 'USD' as const, env: 'STRIPE_PRICE_ID_PRO_MONTHLY_USD' },
        { plan: 'pro' as const, cycle: 'monthly' as const, currency: 'CAD' as const, env: 'STRIPE_PRICE_ID_PRO_MONTHLY_CAD' },
        { plan: 'pro' as const, cycle: 'annual' as const, currency: 'USD' as const, env: 'STRIPE_PRICE_ID_PRO_ANNUAL_USD' },
        { plan: 'pro' as const, cycle: 'annual' as const, currency: 'CAD' as const, env: 'STRIPE_PRICE_ID_PRO_ANNUAL_CAD' },
      ];

      combinations.forEach(({ plan, cycle, currency, env }) => {
        const mockPriceId = `price_${plan}_${cycle}_${currency}`;
        process.env[env] = mockPriceId;
        const priceId = getPriceId(plan, cycle, currency);
        expect(priceId).toBe(mockPriceId);
        delete process.env[env];
      });
    });
  });
});

