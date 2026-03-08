import { describe, it, expect } from 'vitest';
import { getEntryKind } from '../entry-kind';

describe('getEntryKind', () => {
  it('returns draft when isDraft is true', () => {
    expect(getEntryKind({ isDraft: true })).toBe('draft');
  });

  it('returns draft when both isDraft and conversationMode are true', () => {
    expect(getEntryKind({ isDraft: true, conversationMode: true })).toBe('draft');
  });

  it('returns conversation when conversationMode is true and isDraft is not set', () => {
    expect(getEntryKind({ conversationMode: true })).toBe('conversation');
  });

  it('returns conversation when conversationMode is true and isDraft is false', () => {
    expect(getEntryKind({ isDraft: false, conversationMode: true })).toBe('conversation');
  });

  it('returns text when no flags are set', () => {
    expect(getEntryKind({})).toBe('text');
  });

  it('returns text when both flags are false', () => {
    expect(getEntryKind({ isDraft: false, conversationMode: false })).toBe('text');
  });

  it('returns text when isDraft is undefined and conversationMode is undefined', () => {
    expect(getEntryKind({ isDraft: undefined, conversationMode: undefined })).toBe('text');
  });
});
