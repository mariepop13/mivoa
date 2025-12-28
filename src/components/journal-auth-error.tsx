'use client';

import { useTranslation } from '@/hooks/use-translation';

interface JournalAuthErrorProps {
  error: string;
}

export function JournalAuthError({ error }: JournalAuthErrorProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center max-w-md px-4">
        <h1 className="text-2xl font-headline font-bold mb-4 text-destructive">
          {t('authenticationError')}
        </h1>
        <p className="text-muted-foreground mb-4">{error}</p>
      </div>
    </main>
  );
}

