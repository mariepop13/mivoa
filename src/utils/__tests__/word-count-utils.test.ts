import { describe, it, expect } from 'vitest';
import { formatNumber } from '../word-count-utils';

describe('word-count-utils', () => {
  describe('formatNumber', () => {
    it('should return number as string for values less than 1000', () => {
      expect(formatNumber(0)).toBe('0');
      expect(formatNumber(523)).toBe('523');
      expect(formatNumber(999)).toBe('999');
    });

    it('should format numbers >= 1000 with "k" notation', () => {
      expect(formatNumber(1000)).toBe('1.0k');
      expect(formatNumber(1500)).toBe('1.5k');
      expect(formatNumber(2300)).toBe('2.3k');
      expect(formatNumber(8567)).toBe('8.6k');
    });

    it('should handle very large numbers', () => {
      expect(formatNumber(1523456)).toBe('1523.5k');
      expect(formatNumber(999999)).toBe('1000.0k');
    });

    it('should return "0" for negative numbers', () => {
      expect(formatNumber(-1)).toBe('0');
      expect(formatNumber(-100)).toBe('0');
      expect(formatNumber(-1000)).toBe('0');
    });

    it('should return "0" for NaN', () => {
      expect(formatNumber(NaN)).toBe('0');
    });

    it('should return "0" for Infinity', () => {
      expect(formatNumber(Infinity)).toBe('0');
      expect(formatNumber(-Infinity)).toBe('0');
    });
  });
});

