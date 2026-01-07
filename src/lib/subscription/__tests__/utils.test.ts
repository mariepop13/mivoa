import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { convertTimestampToDate } from '../utils';

describe('subscription utils', () => {
  describe('convertTimestampToDate', () => {
    it('should return Date object when input is Date', () => {
      const date = new Date('2024-01-15T14:30:00Z');
      const result = convertTimestampToDate(date);
      
      expect(result).toBeInstanceOf(Date);
      expect(result).toBe(date);
      expect(result?.getTime()).toBe(date.getTime());
    });

    it('should convert Timestamp to Date', () => {
      const timestamp = Timestamp.fromDate(new Date('2024-01-15T14:30:00Z'));
      const result = convertTimestampToDate(timestamp);
      
      expect(result).toBeInstanceOf(Date);
      expect(result?.getTime()).toBe(timestamp.toDate().getTime());
    });

    it('should convert valid string to Date', () => {
      const dateString = '2024-01-15T14:30:00Z';
      const result = convertTimestampToDate(dateString);
      
      expect(result).toBeInstanceOf(Date);
      expect(result?.getTime()).toBe(new Date(dateString).getTime());
    });

    it('should return undefined for null', () => {
      const result = convertTimestampToDate(null);
      expect(result).toBeUndefined();
    });

    it('should return undefined for undefined', () => {
      const result = convertTimestampToDate(undefined);
      expect(result).toBeUndefined();
    });

    it('should return undefined for invalid string', () => {
      const result = convertTimestampToDate('invalid-date-string');
      expect(result).toBeUndefined();
    });

    it('should return undefined for invalid input type', () => {
      const result = convertTimestampToDate(12345);
      expect(result).toBeUndefined();
    });

    it('should return undefined for empty string', () => {
      const result = convertTimestampToDate('');
      expect(result).toBeUndefined();
    });

    it('should return undefined for false', () => {
      const result = convertTimestampToDate(false);
      expect(result).toBeUndefined();
    });
  });
});

