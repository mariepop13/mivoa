'use client';

import { Progress } from '@/components/ui/progress';
import { useSubscription } from '@/hooks/use-subscription';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';

export function UsageIndicator(): React.JSX.Element | null {
  const { usage } = useSubscription();
  const { t } = useTranslation();

  if (!usage) {
    return null;
  }

  const isUnlimited = usage.entriesLimit === Infinity;
  const percentage = isUnlimited ? 0 : Math.min((usage.entriesUsed / usage.entriesLimit) * 100, 100);
  const isWarning = percentage >= 80 && !isUnlimited;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{t('subscription.usage')}</span>
        <span className={cn('font-medium', isWarning && 'text-destructive')}>
          {isUnlimited
            ? t('subscription.unlimited')
            : t('subscription.entriesUsed')
                .replace('{used}', String(usage.entriesUsed))
                .replace('{limit}', String(usage.entriesLimit))}
        </span>
      </div>
      {!isUnlimited && (
        <Progress
          value={percentage}
          className={cn('h-2', isWarning && '[&>div]:bg-destructive')}
        />
      )}
      {isWarning && (
        <p className="text-xs text-destructive">
          {t('subscription.usageWarning')}
        </p>
      )}
    </div>
  );
}

