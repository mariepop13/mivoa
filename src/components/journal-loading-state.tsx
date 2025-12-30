'use client';

import { useTranslation } from '@/hooks/use-translation';

export function JournalLoadingState(): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-muted-foreground">{t('loading')}</div>
    </main>
  );
}

