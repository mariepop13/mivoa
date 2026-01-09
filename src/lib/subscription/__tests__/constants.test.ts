import { describe, it, expect } from 'vitest';
import {
  SUBSCRIPTION_PLANS,
  PLAN_LIMITS,
  PLAN_PRICING,
  PLAN_FEATURES,
  STRIPE_PRICE_ID_ENV_VARS,
  getPriceId,
} from '../constants';

describe('subscription constants', () => {
  describe('SUBSCRIPTION_PLANS', () => {
    it('should contain all plan types', () => {
      expect(SUBSCRIPTION_PLANS).toContain('free');
      expect(SUBSCRIPTION_PLANS).toContain('supporter');
      expect(SUBSCRIPTION_PLANS).toContain('pro');
      expect(SUBSCRIPTION_PLANS.length).toBe(3);
    });
  });

  describe('PLAN_LIMITS', () => {
    it('should define limits for all plans', () => {
      SUBSCRIPTION_PLANS.forEach((plan) => {
        expect(PLAN_LIMITS[plan]).toBeDefined();
        expect(typeof PLAN_LIMITS[plan].advancedAnalysis).toBe('boolean');
        expect(typeof PLAN_LIMITS[plan].multiEntryAnalysis).toBe('boolean');
        expect(typeof PLAN_LIMITS[plan].periodSummary).toBe('boolean');
        expect(typeof PLAN_LIMITS[plan].exportPDF).toBe('boolean');
        expect(typeof PLAN_LIMITS[plan].exportBackup).toBe('boolean');
        expect(typeof PLAN_LIMITS[plan].customTemplates).toBe('boolean');
        expect(typeof PLAN_LIMITS[plan].semanticSearch).toBe('boolean');
      });
    });

    it('should have free and supporter plans with no Pro features', () => {
      expect(PLAN_LIMITS.free.advancedAnalysis).toBe(false);
      expect(PLAN_LIMITS.free.multiEntryAnalysis).toBe(false);
      expect(PLAN_LIMITS.free.exportPDF).toBe(false);
      expect(PLAN_LIMITS.supporter.advancedAnalysis).toBe(false);
      expect(PLAN_LIMITS.supporter.multiEntryAnalysis).toBe(false);
      expect(PLAN_LIMITS.supporter.exportPDF).toBe(false);
    });

    it('should have pro plan with all features enabled', () => {
      expect(PLAN_LIMITS.pro.advancedAnalysis).toBe(true);
      expect(PLAN_LIMITS.pro.multiEntryAnalysis).toBe(true);
      expect(PLAN_LIMITS.pro.periodSummary).toBe(true);
      expect(PLAN_LIMITS.pro.exportPDF).toBe(true);
      expect(PLAN_LIMITS.pro.exportBackup).toBe(true);
      expect(PLAN_LIMITS.pro.customTemplates).toBe(true);
      expect(PLAN_LIMITS.pro.semanticSearch).toBe(true);
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
      expect(PLAN_PRICING.supporter.monthly.USD).toBeGreaterThan(0);
      expect(PLAN_PRICING.supporter.annual.USD).toBeGreaterThan(0);
      expect(PLAN_PRICING.pro.monthly.USD).toBeGreaterThan(0);
      expect(PLAN_PRICING.pro.annual.USD).toBeGreaterThan(0);
    });

    it('should have annual pricing higher than monthly', () => {
      expect(PLAN_PRICING.supporter.annual.USD).toBeGreaterThan(
        PLAN_PRICING.supporter.monthly.USD
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
        PLAN_FEATURES.supporter.length
      );
      expect(PLAN_FEATURES.supporter.length).toBeLessThanOrEqual(
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
      expect(STRIPE_PRICE_ID_ENV_VARS.supporter.monthly.USD).toBe(
        'STRIPE_PRICE_ID_SUPPORTER_MONTHLY_USD'
      );
      expect(STRIPE_PRICE_ID_ENV_VARS.pro.annual.CAD).toBe(
        'STRIPE_PRICE_ID_PRO_ANNUAL_CAD'
      );
    });
  });

  describe('getPriceId', () => {
    it('should return price ID from environment variable for supporter monthly USD', () => {
      process.env.STRIPE_PRICE_ID_SUPPORTER_MONTHLY_USD = 'price_supporter_monthly_usd';
      const priceId = getPriceId('supporter', 'monthly', 'USD');
      expect(priceId).toBe('price_supporter_monthly_usd');
      delete process.env.STRIPE_PRICE_ID_SUPPORTER_MONTHLY_USD;
    });

    it('should return price ID from environment variable for pro annual CAD', () => {
      process.env.STRIPE_PRICE_ID_PRO_ANNUAL_CAD = 'price_pro_annual_cad';
      const priceId = getPriceId('pro', 'annual', 'CAD');
      expect(priceId).toBe('price_pro_annual_cad');
      delete process.env.STRIPE_PRICE_ID_PRO_ANNUAL_CAD;
    });

    it('should default to USD when currency not specified', () => {
      process.env.STRIPE_PRICE_ID_SUPPORTER_MONTHLY_USD = 'price_supporter_monthly_usd';
      const priceId = getPriceId('supporter', 'monthly');
      expect(priceId).toBe('price_supporter_monthly_usd');
      delete process.env.STRIPE_PRICE_ID_SUPPORTER_MONTHLY_USD;
    });

    it('should throw error when environment variable is missing', () => {
      const originalValue = process.env.STRIPE_PRICE_ID_SUPPORTER_MONTHLY_USD;
      delete process.env.STRIPE_PRICE_ID_SUPPORTER_MONTHLY_USD;
      
      try {
        expect(() => getPriceId('supporter', 'monthly', 'USD')).toThrow(
          'Missing required Stripe price ID environment variables'
        );
      } finally {
        if (originalValue) {
          process.env.STRIPE_PRICE_ID_SUPPORTER_MONTHLY_USD = originalValue;
        }
      }
    });

    it('should handle all plan, cycle, and currency combinations', () => {
      const combinations = [
        { plan: 'supporter' as const, cycle: 'monthly' as const, currency: 'USD' as const, env: 'STRIPE_PRICE_ID_SUPPORTER_MONTHLY_USD' },
        { plan: 'supporter' as const, cycle: 'monthly' as const, currency: 'CAD' as const, env: 'STRIPE_PRICE_ID_SUPPORTER_MONTHLY_CAD' },
        { plan: 'supporter' as const, cycle: 'annual' as const, currency: 'USD' as const, env: 'STRIPE_PRICE_ID_SUPPORTER_ANNUAL_USD' },
        { plan: 'supporter' as const, cycle: 'annual' as const, currency: 'CAD' as const, env: 'STRIPE_PRICE_ID_SUPPORTER_ANNUAL_CAD' },
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

