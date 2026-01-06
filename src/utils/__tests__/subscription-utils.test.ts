import { describe, it, expect } from 'vitest';
import { formatPlanPrice, getCurrencySymbol, calculateAnnualSavings } from '../subscription-utils';

describe('subscription-utils', () => {
  describe('formatPlanPrice', () => {
    it('should format USD price correctly', () => {
      expect(formatPlanPrice(999, 'USD')).toBe('$9.99');
      expect(formatPlanPrice(1999, 'USD')).toBe('$19.99');
      expect(formatPlanPrice(0, 'USD')).toBe('$0.00');
    });

    it('should format CAD price correctly', () => {
      expect(formatPlanPrice(1399, 'CAD')).toBe('CA$13.99');
      expect(formatPlanPrice(2799, 'CAD')).toBe('CA$27.99');
    });

    it('should default to USD when currency not specified', () => {
      expect(formatPlanPrice(999)).toBe('$9.99');
    });
  });

  describe('getCurrencySymbol', () => {
    it('should return $ for USD', () => {
      expect(getCurrencySymbol('USD')).toBe('$');
    });

    it('should return CA$ for CAD', () => {
      expect(getCurrencySymbol('CAD')).toBe('CA$');
    });
  });

  describe('calculateAnnualSavings', () => {
    it('should calculate savings correctly', () => {
      const result = calculateAnnualSavings(999);
      expect(result.amount).toBe(999 * 2);
      expect(result.percentage).toBe(17);
    });

    it('should calculate savings for higher prices', () => {
      const result = calculateAnnualSavings(1999);
      expect(result.amount).toBe(1999 * 2);
      expect(result.percentage).toBe(17);
    });

    it('should return positive savings', () => {
      const result = calculateAnnualSavings(1000);
      expect(result.amount).toBeGreaterThan(0);
      expect(result.percentage).toBeGreaterThan(0);
    });
  });
});

