'use client';

import { useSubscription } from '@/hooks/use-subscription';
import { useTranslation } from '@/hooks/use-translation';

export function UsageIndicator(): React.JSX.Element | null {
  const { usage } = useSubscription();
  const { t } = useTranslation();

  if (!usage) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{t('subscription.usage')}</span>
        <span className="font-medium">
          {t('subscription.unlimitedEntries')}
        </span>
      </div>
    </div>
  );
}

