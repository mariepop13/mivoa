'use client';

import { useTranslation } from '@/hooks/use-translation';
import { useWordCount } from '@/hooks/use-word-count';
import { formatNumber } from '@/utils/word-count-utils';

interface WordCountBadgeProps {
  content: string;
}

export function WordCountBadge({ content }: WordCountBadgeProps): React.JSX.Element {
  const { t } = useTranslation();
  const { wordCount, characterCount } = useWordCount(content);

  const wordLabel = wordCount === 1 ? t('word') : t('words');
  const characterLabel = characterCount === 1 ? t('character') : t('charactersCount');
  const ariaLabel = `${formatNumber(wordCount)} ${wordLabel}, ${formatNumber(characterCount)} ${characterLabel}`;

  return (
    <div 
      className="text-xs text-muted-foreground"
      role="status"
      aria-label={ariaLabel}
    >
      {formatNumber(wordCount)} {wordLabel} · {formatNumber(characterCount)} {characterLabel}
    </div>
  );
}

