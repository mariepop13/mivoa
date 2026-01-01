import { describe, it, expect } from 'vitest';
import { parseEntryDate, getEntryPreview, validateLink, areEntriesLinked } from '../entry-linking-utils';

describe('entry-linking-utils', () => {
  describe('parseEntryDate', () => {
    it('should parse valid date string in yyyy-MM-dd format', () => {
      const dateString = '2024-01-15';
      const result = parseEntryDate(dateString);
      
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(0);
      expect(result.getDate()).toBe(15);
    });

    it('should parse date string with different date', () => {
      const dateString = '2023-12-31';
      const result = parseEntryDate(dateString);
      
      expect(result.getFullYear()).toBe(2023);
      expect(result.getMonth()).toBe(11);
      expect(result.getDate()).toBe(31);
    });

    it('should fallback to new Date() for invalid date string', () => {
      const dateString = 'invalid-date';
      const result = parseEntryDate(dateString);
      
      expect(result).toBeInstanceOf(Date);
    });

    it('should handle empty string', () => {
      const dateString = '';
      const result = parseEntryDate(dateString);
      
      expect(result).toBeInstanceOf(Date);
    });

    it('should handle malformed date string', () => {
      const dateString = '2024-13-45';
      const result = parseEntryDate(dateString);
      
      expect(result).toBeInstanceOf(Date);
    });
  });

  describe('getEntryPreview', () => {
    it('should return empty string for empty content', () => {
      const result = getEntryPreview('');
      expect(result).toBe('');
    });

    it('should return content as-is when shorter than maxLength', () => {
      const content = 'Short content';
      const result = getEntryPreview(content, 100);
      expect(result).toBe(content);
    });

    it('should return content as-is when exactly at maxLength', () => {
      const content = 'a'.repeat(100);
      const result = getEntryPreview(content, 100);
      expect(result).toBe(content);
    });

    it('should truncate content longer than maxLength', () => {
      const content = 'a'.repeat(150);
      const result = getEntryPreview(content, 100);
      
      expect(result.length).toBe(103);
      expect(result.endsWith('...')).toBe(true);
      expect(result.substring(0, 100)).toBe('a'.repeat(100));
    });

    it('should trim whitespace before truncation', () => {
      const content = '   ' + 'a'.repeat(150) + '   ';
      const result = getEntryPreview(content, 100);
      
      expect(result.endsWith('...')).toBe(true);
      expect(result.length).toBeLessThanOrEqual(103);
    });

    it('should use default maxLength of 100', () => {
      const content = 'a'.repeat(150);
      const result = getEntryPreview(content);
      
      expect(result.length).toBe(103);
      expect(result.endsWith('...')).toBe(true);
    });

    it('should handle custom maxLength', () => {
      const content = 'a'.repeat(50);
      const result = getEntryPreview(content, 30);
      
      expect(result.length).toBe(33);
      expect(result.endsWith('...')).toBe(true);
    });
  });

  describe('validateLink', () => {
    it('should validate a valid link between different entries', () => {
      const result = validateLink('entry-1', 'entry-2', [], []);
      
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should prevent self-linking', () => {
      const result = validateLink('entry-1', 'entry-1', [], []);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('cannotLinkToSelf');
    });

    it('should prevent linking when already linked in fromEntry direction', () => {
      const result = validateLink('entry-1', 'entry-2', ['entry-2'], []);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('entryAlreadyLinked');
    });

    it('should prevent linking when already linked in toEntry direction', () => {
      const result = validateLink('entry-1', 'entry-2', [], ['entry-1']);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('entryAlreadyLinked');
    });

    it('should prevent linking when already linked bidirectionally', () => {
      const result = validateLink('entry-1', 'entry-2', ['entry-2'], ['entry-1']);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('entryAlreadyLinked');
    });

    it('should handle undefined fromLinkedEntryIds', () => {
      const result = validateLink('entry-1', 'entry-2', undefined, []);
      
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should handle undefined toLinkedEntryIds', () => {
      const result = validateLink('entry-1', 'entry-2', [], undefined);
      
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should handle both linkedEntryIds as undefined', () => {
      const result = validateLink('entry-1', 'entry-2', undefined, undefined);
      
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should allow linking when fromLinkedEntryIds has other entries', () => {
      const result = validateLink('entry-1', 'entry-2', ['entry-3'], []);
      
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should allow linking when toLinkedEntryIds has other entries', () => {
      const result = validateLink('entry-1', 'entry-2', [], ['entry-3']);
      
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('areEntriesLinked', () => {
    it('should return true when linked in entry1 direction', () => {
      const result = areEntriesLinked('entry-1', 'entry-2', ['entry-2'], []);
      
      expect(result).toBe(true);
    });

    it('should return true when linked in entry2 direction', () => {
      const result = areEntriesLinked('entry-1', 'entry-2', [], ['entry-1']);
      
      expect(result).toBe(true);
    });

    it('should return true when linked bidirectionally', () => {
      const result = areEntriesLinked('entry-1', 'entry-2', ['entry-2'], ['entry-1']);
      
      expect(result).toBe(true);
    });

    it('should return false when not linked', () => {
      const result = areEntriesLinked('entry-1', 'entry-2', [], []);
      
      expect(result).toBe(false);
    });

    it('should return false when linkedEntryIds have other entries', () => {
      const result = areEntriesLinked('entry-1', 'entry-2', ['entry-3'], ['entry-4']);
      
      expect(result).toBe(false);
    });

    it('should handle undefined entry1LinkedIds', () => {
      const result = areEntriesLinked('entry-1', 'entry-2', undefined, ['entry-1']);
      
      expect(result).toBe(true);
    });

    it('should handle undefined entry2LinkedIds', () => {
      const result = areEntriesLinked('entry-1', 'entry-2', ['entry-2'], undefined);
      
      expect(result).toBe(true);
    });

    it('should return false when both linkedEntryIds are undefined', () => {
      const result = areEntriesLinked('entry-1', 'entry-2', undefined, undefined);
      
      expect(result).toBe(false);
    });

    it('should return false when entry1LinkedIds includes entry2 but check fails', () => {
      const result = areEntriesLinked('entry-1', 'entry-2', ['entry-2'], []);
      
      expect(result).toBe(true);
    });

    it('should handle case where entry1LinkedIds includes entry2Id but not strictly true', () => {
      const result = areEntriesLinked('entry-1', 'entry-2', ['entry-2'], []);
      
      expect(result).toBe(true);
    });
  });
});

