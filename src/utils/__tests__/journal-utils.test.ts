import { describe, it, expect } from 'vitest';
import { formatEntryTime, getEntryTitle } from '../journal-utils';
import type { JournalEntryData } from '@/hooks/use-journal-entries';

describe('journal-utils', () => {
  describe('formatEntryTime', () => {
    it('should format Date object', () => {
      const date = new Date('2024-01-15T14:30:00Z');
      const entry = {
        id: 'entry-1',
        createdAt: date,
        updatedAt: date,
        content: 'Test',
        title: '',
        date: '2024-01-15',
      } as unknown as JournalEntryData & { id: string };

      const result = formatEntryTime(entry);

      expect(result).toMatch(/\d{2}:\d{2}:\d{2}/);
    });

    it('should format date string', () => {
      const entry = {
        id: 'entry-1',
        createdAt: '2024-01-15T14:30:00Z',
        updatedAt: '2024-01-15T14:30:00Z',
        content: 'Test',
        title: '',
        date: '2024-01-15',
      } as unknown as JournalEntryData & { id: string };

      const result = formatEntryTime(entry);

      expect(result).toMatch(/\d{2}:\d{2}:\d{2}/);
    });

    it('should return empty string for invalid date', () => {
      const entry = {
        id: 'entry-1',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        createdAt: null as any,
        updatedAt: new Date(),
        content: 'Test',
        title: '',
        date: '2024-01-15',
      } as unknown as JournalEntryData & { id: string };

      const result = formatEntryTime(entry);

      expect(result).toBe('');
    });

    it('should handle invalid date string', () => {
      const entry = {
        id: 'entry-1',
        createdAt: 'invalid-date',
        updatedAt: new Date(),
        content: 'Test',
        title: '',
        date: '2024-01-15',
      } as unknown as JournalEntryData & { id: string };

      const result = formatEntryTime(entry);

      expect(result).toBe('');
    });
  });

  describe('getEntryTitle', () => {
    it('should return entry title when available', () => {
      const entry = {
        id: 'entry-1',
        content: 'Content',
        title: 'My Title',
        date: '2024-01-15',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as JournalEntryData & { id: string };

      const result = getEntryTitle(entry, []);

      expect(result).toBe('My Title');
    });

    it('should return formatted time when title is not available but entry exists', () => {
      const date = new Date('2024-01-15T14:30:00Z');
      const entry = {
        id: 'entry-1',
        content: 'Content',
        title: '',
        date: '2024-01-15',
        createdAt: date,
        updatedAt: date,
      } as unknown as JournalEntryData & { id: string };

      const result = getEntryTitle(entry, []);

      expect(result).toMatch(/\d{2}:\d{2}:\d{2}/);
    });

    it('should return formatted time of first entry when entry is undefined', () => {
      const date = new Date('2024-01-15T14:30:00Z');
      const allEntries = [
        {
          id: 'entry-1',
          content: 'Content',
          title: '',
          date: '2024-01-15',
          createdAt: date,
          updatedAt: date,
        },
      ] as unknown as (JournalEntryData & { id: string })[];

      const result = getEntryTitle(undefined, allEntries);

      expect(result).toMatch(/\d{2}:\d{2}:\d{2}/);
    });

    it('should return empty string when entry is undefined and no entries exist', () => {
      const result = getEntryTitle(undefined, []);

      expect(result).toBe('');
    });

    it('should return empty string when entry is undefined and entries is null', () => {
      const result = getEntryTitle(undefined, null);

      expect(result).toBe('');
    });

    it('should prioritize title over time', () => {
      const entry = {
        id: 'entry-1',
        content: 'Content',
        title: 'Custom Title',
        date: '2024-01-15',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as JournalEntryData & { id: string };

      const result = getEntryTitle(entry, []);

      expect(result).toBe('Custom Title');
    });
  });
});

