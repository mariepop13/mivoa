'use client';

import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/use-subscription';
import { useTranslation } from '@/hooks/use-translation';
import type { SubscriptionStatus as SubscriptionStatusType } from '@/lib/subscription/types';

function getStatusBadgeVariant(status: SubscriptionStatusType): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'active':
    case 'trialing':
      return 'default';
    case 'canceled':
    case 'past_due':
    case 'incomplete_expired':
    case 'unpaid':
      return 'destructive';
    case 'incomplete':
      return 'secondary';
    default:
      return 'outline';
  }
}

function formatDate(date: Date | undefined): string {
  if (!date) return '';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function SubscriptionStatus(): React.JSX.Element {
  const { plan, status, usage } = useSubscription();
  const { t } = useTranslation();

  const getStatusLabel = (statusValue: SubscriptionStatusType): string => {
    return t(`subscription.status.${statusValue}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{t('subscription.currentPlan')}</p>
          <p className="text-2xl font-bold">{t(`subscription.${plan}`)}</p>
        </div>
        <Badge variant={getStatusBadgeVariant(status)}>
          {getStatusLabel(status)}
        </Badge>
      </div>
      {usage?.nextResetDate && (
        <p className="text-xs text-muted-foreground">
          {t('subscription.resetDate').replace('{date}', formatDate(usage.nextResetDate))}
        </p>
      )}
    </div>
  );
}

