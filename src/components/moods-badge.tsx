'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';

const EMOJI_REGEX = /^[\p{Emoji}\p{Emoji_Presentation}\p{Emoji_Modifier_Base}\p{Emoji_Component}]+$/u;

function isEmoji(text: string): boolean {
  return EMOJI_REGEX.test(text.trim());
}

function getMoodEmoji(mood: string, moodEmojis?: Record<string, string>): string | null {
  if (isEmoji(mood)) {
    return mood;
  }
  if (moodEmojis && moodEmojis[mood]) {
    return moodEmojis[mood];
  }
  return null;
}

interface MoodsBadgeProps {
  moods?: string[];
  moodEmojis?: Record<string, string>;
  colorClass?: string;
  className?: string;
}

function MoodsBadgeComponent({ moods, moodEmojis, colorClass, className }: MoodsBadgeProps): React.JSX.Element | null {
  if (!moods || moods.length === 0) {
    return null;
  }

  const sortedMoods = [...moods].sort((a, b) => a.localeCompare(b));

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {sortedMoods.map((mood, index) => {
        const emoji = getMoodEmoji(mood, moodEmojis);
        return (
          <span
            key={`${mood}-${index}`}
            className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border', colorClass)}
            aria-label={`Mood: ${mood}`}
            title={mood}
          >
            {emoji && <span aria-hidden="true">{emoji}</span>}
            <span>{mood}</span>
          </span>
        );
      })}
    </div>
  );
}

export const MoodsBadge = memo(MoodsBadgeComponent);

