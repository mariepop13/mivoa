import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useWordCount } from '../use-word-count';

describe('useWordCount', () => {
  it('should return 0 words and 0 characters for empty string', () => {
    const { result } = renderHook(() => useWordCount(''));

    expect(result.current.wordCount).toBe(0);
    expect(result.current.characterCount).toBe(0);
  });

  it('should return 0 words but character count for whitespace only', () => {
    const { result } = renderHook(() => useWordCount('   '));

    expect(result.current.wordCount).toBe(0);
    expect(result.current.characterCount).toBe(3);
  });

  it('should count single word correctly', () => {
    const { result } = renderHook(() => useWordCount('Hello'));

    expect(result.current.wordCount).toBe(1);
    expect(result.current.characterCount).toBe(5);
  });

  it('should count multiple words correctly', () => {
    const { result } = renderHook(() => useWordCount('Hello world'));

    expect(result.current.wordCount).toBe(2);
    expect(result.current.characterCount).toBe(11);
  });

  it('should ignore multiple spaces between words', () => {
    const { result } = renderHook(() => useWordCount('Hello     world'));

    expect(result.current.wordCount).toBe(2);
    expect(result.current.characterCount).toBe(15);
  });

  it('should handle newlines correctly', () => {
    const { result } = renderHook(() => useWordCount('Hello\nworld'));

    expect(result.current.wordCount).toBe(2);
    expect(result.current.characterCount).toBe(11);
  });

  it('should handle tabs correctly', () => {
    const { result } = renderHook(() => useWordCount('Hello\tworld'));

    expect(result.current.wordCount).toBe(2);
    expect(result.current.characterCount).toBe(11);
  });

  it('should handle special characters', () => {
    const text = 'Hello, world! How are you?';
    const { result } = renderHook(() => useWordCount(text));

    expect(result.current.wordCount).toBe(5);
    expect(result.current.characterCount).toBe(text.length);
  });

  it('should trim leading and trailing whitespace for word count', () => {
    const { result } = renderHook(() => useWordCount('  Hello world  '));

    expect(result.current.wordCount).toBe(2);
    expect(result.current.characterCount).toBe(15);
  });

  it('should handle long text with many words', () => {
    const longText = 'This is a very long text with many words that should be counted correctly by the word count hook';
    const { result } = renderHook(() => useWordCount(longText));

    const expectedWords = longText.trim().split(/\s+/).filter((word) => word.length > 0).length;
    expect(result.current.wordCount).toBe(expectedWords);
    expect(result.current.characterCount).toBe(longText.length);
  });

  it('should memoize result and update when text changes', () => {
    const { result, rerender } = renderHook(
      ({ text }) => useWordCount(text),
      {
        initialProps: { text: 'Hello' },
      }
    );

    expect(result.current.wordCount).toBe(1);

    rerender({ text: 'Hello world' });

    expect(result.current.wordCount).toBe(2);
    expect(result.current.characterCount).toBe(11);
  });
});

