'use client';

import { useTranslation } from '@/hooks/use-translation';

interface JournalEntryStatusProps {
  isLoading: boolean;
  isSaved: boolean;
  error: string | null;
}

export function JournalEntryStatus({ isLoading, isSaved, error }: JournalEntryStatusProps): React.JSX.Element | null {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <span className="flex items-center gap-2 text-muted-foreground">
        <span className="inline-block w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        <span>{t('saving')}</span>
      </span>
    );
  }

  if (error) {
    return (
      <span className="flex items-center gap-2 text-destructive">
        <span>⚠️</span>
        <span className="break-words">{t('error')} {error}</span>
      </span>
    );
  }

  if (isSaved) {
    return (
      <span className="flex items-center gap-2 text-muted-foreground">
        <span className="flex items-center justify-center w-4 h-4 rounded-full 
          bg-green-500/10 text-green-600 dark:text-green-400 text-xs">✓</span>
        <span>{t('saved')}</span>
      </span>
    );
  }

  return null;
}


