'use client';

import { Sparkles } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';

export function ChatEmptyState(): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="text-center text-muted-foreground py-8">
      <Sparkles className="h-8 w-8 mx-auto mb-4 text-primary" />
      <p className="text-sm">{t('chatInitializing')}</p>
    </div>
  );
}

