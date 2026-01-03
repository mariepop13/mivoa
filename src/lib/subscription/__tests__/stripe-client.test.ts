import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getStripeClient, resetStripeClient } from '../stripe-client';

describe('stripe-client', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    resetStripeClient();
  });

  afterEach(() => {
    process.env = originalEnv;
    resetStripeClient();
  });

  describe('getStripeClient', () => {
    it('should throw error when STRIPE_SECRET_KEY is missing', () => {
      delete process.env.STRIPE_SECRET_KEY;
      expect(() => getStripeClient()).toThrow(
        'Missing required Stripe environment variable: STRIPE_SECRET_KEY'
      );
    });

    it('should throw error when STRIPE_SECRET_KEY has invalid format', () => {
      process.env.STRIPE_SECRET_KEY = 'invalid-key';
      expect(() => getStripeClient()).toThrow(
        'Invalid STRIPE_SECRET_KEY format. Stripe secret keys must start with "sk_" or "sk_test_".'
      );
    });

    it('should create Stripe client with valid test key', () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_valid_key_1234567890';
      const client = getStripeClient();
      expect(client).toBeDefined();
      expect(typeof client.customers).toBe('object');
    });

    it('should create Stripe client with valid live key', () => {
      process.env.STRIPE_SECRET_KEY = 'sk_live_valid_key_1234567890';
      const client = getStripeClient();
      expect(client).toBeDefined();
      expect(typeof client.customers).toBe('object');
    });

    it('should return same client instance on subsequent calls', () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_valid_key_1234567890';
      const client1 = getStripeClient();
      const client2 = getStripeClient();
      expect(client1).toBe(client2);
    });

    it('should create new client after reset', () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_valid_key_1234567890';
      const client1 = getStripeClient();
      resetStripeClient();
      const client2 = getStripeClient();
      expect(client1).not.toBe(client2);
    });
  });

  describe('resetStripeClient', () => {
    it('should reset client instance', () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_valid_key_1234567890';
      const client1 = getStripeClient();
      resetStripeClient();
      const client2 = getStripeClient();
      expect(client1).not.toBe(client2);
    });
  });
});
