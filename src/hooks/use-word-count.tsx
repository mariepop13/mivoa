import { useMemo } from 'react';

interface UseWordCountResult {
  wordCount: number;
  characterCount: number;
}

export function useWordCount(text: string): UseWordCountResult {
  return useMemo(() => {
    const trimmed = text.trim();
    const characterCount = text.length;
    
    if (!trimmed) {
      return { wordCount: 0, characterCount };
    }

    const words = trimmed.split(/\s+/).filter((word) => word.length > 0);

    return {
      wordCount: words.length,
      characterCount,
    };
  }, [text]);
}

