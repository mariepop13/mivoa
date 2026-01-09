'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';

const EMOJI_REGEX = /^[\p{Emoji}\p{Emoji_Presentation}\p{Emoji_Modifier_Base}\p{Emoji_Component}]+$/u;

function isEmoji(text: string): boolean {
  return EMOJI_REGEX.test(text.trim());
}

function getThemeEmoji(theme: string, themeEmojis?: Record<string, string>): string | null {
  if (isEmoji(theme)) {
    return theme;
  }
  if (themeEmojis && themeEmojis[theme]) {
    return themeEmojis[theme];
  }
  return null;
}

interface ThemesBadgeProps {
  themes?: string[];
  themeEmojis?: Record<string, string>;
  colorClass?: string;
  className?: string;
}

function ThemesBadgeComponent({ themes, themeEmojis, colorClass, className }: ThemesBadgeProps): React.JSX.Element | null {
  if (!themes || themes.length === 0) {
    return null;
  }

  const sortedThemes = [...themes].sort((a, b) => a.localeCompare(b));

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {sortedThemes.map((theme, index) => {
        const emoji = getThemeEmoji(theme, themeEmojis);
        return (
        <span
          key={`${theme}-${index}`}
          className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border', colorClass)}
          aria-label={`Theme: ${theme}`}
          title={theme}
        >
            {emoji && <span aria-hidden="true">{emoji}</span>}
          <span>{theme}</span>
        </span>
        );
      })}
    </div>
  );
}

export const ThemesBadge = memo(ThemesBadgeComponent);
