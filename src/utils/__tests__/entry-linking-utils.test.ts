import { describe, it, expect } from 'vitest';
import { parseEntryDate, getEntryPreview, validateLink, areEntriesLinked } from '../entry-linking-utils';

describe('entry-linking-utils', () => {
  describe('parseEntryDate', () => {
    it('should parse valid date string in yyyy-MM-dd format', () => {
      const result = parseEntryDate('2024-01-15');
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(0);
      expect(result.getDate()).toBe(15);
    });

    it('should fall back to Date constructor for invalid format', () => {
      const result = parseEntryDate('invalid-date');
      expect(result).toBeInstanceOf(Date);
    });

    it('should handle edge case dates', () => {
      const result = parseEntryDate('2024-12-31');
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(11);
      expect(result.getDate()).toBe(31);
    });
  });

  describe('getEntryPreview', () => {
    it('should return full content when shorter than maxLength', () => {
      const content = 'Short content';
      const result = getEntryPreview(content, 100);
      expect(result).toBe('Short content');
    });

    it('should truncate content longer than maxLength', () => {
      const content = 'a'.repeat(150);
      const result = getEntryPreview(content, 100);
      expect(result).toHaveLength(103);
      expect(result.endsWith('...')).toBe(true);
    });

    it('should return empty string for empty content', () => {
      const result = getEntryPreview('');
      expect(result).toBe('');
    });

    it('should use custom maxLength', () => {
      const content = 'a'.repeat(50);
      const result = getEntryPreview(content, 30);
      expect(result).toHaveLength(33);
      expect(result.endsWith('...')).toBe(true);
    });

    it('should trim whitespace before truncating', () => {
      const content = 'a'.repeat(100) + '   ';
      const result = getEntryPreview(content, 100);
      expect(result).toHaveLength(103);
      expect(result.endsWith('...')).toBe(true);
    });
  });

  describe('validateLink', () => {
    it('should return valid for different entry IDs', () => {
      const result = validateLink('entry-1', 'entry-2');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return invalid when linking entry to itself', () => {
      const result = validateLink('entry-1', 'entry-1');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('cannotLinkToSelf');
    });

    it('should return invalid when entries are already linked (from side)', () => {
      const result = validateLink('entry-1', 'entry-2', ['entry-2'], []);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('entryAlreadyLinked');
    });

    it('should return invalid when entries are already linked (to side)', () => {
      const result = validateLink('entry-1', 'entry-2', [], ['entry-1']);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('entryAlreadyLinked');
    });

    it('should return valid when linked arrays are undefined', () => {
      const result = validateLink('entry-1', 'entry-2', undefined, undefined);
      expect(result.valid).toBe(true);
    });
  });

  describe('areEntriesLinked', () => {
    it('should return true when entry1 has entry2 in linked IDs', () => {
      const result = areEntriesLinked('entry-1', 'entry-2', ['entry-2'], []);
      expect(result).toBe(true);
    });

    it('should return true when entry2 has entry1 in linked IDs', () => {
      const result = areEntriesLinked('entry-1', 'entry-2', [], ['entry-1']);
      expect(result).toBe(true);
    });

    it('should return false when entries are not linked', () => {
      const result = areEntriesLinked('entry-1', 'entry-2', ['entry-3'], ['entry-4']);
      expect(result).toBe(false);
    });

    it('should return false when linked arrays are undefined', () => {
      const result = areEntriesLinked('entry-1', 'entry-2', undefined, undefined);
      expect(result).toBe(false);
    });

    it('should return false when linked arrays are empty', () => {
      const result = areEntriesLinked('entry-1', 'entry-2', [], []);
      expect(result).toBe(false);
    });
  });
});
