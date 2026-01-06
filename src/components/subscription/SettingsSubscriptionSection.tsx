'use client';

import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/use-subscription';
import { useTranslation } from '@/hooks/use-translation';
import { ManageSubscriptionButton } from './ManageSubscriptionButton';
import { UsageIndicator } from './UsageIndicator';
import { Loader2 } from 'lucide-react';

export function SettingsSubscriptionSection(): React.JSX.Element {
  const { plan, isLoading } = useSubscription();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="space-y-1 p-1">
        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 px-2">
          {t('subscription.subscription')}
        </label>
        <DropdownMenuItem disabled className="flex items-center justify-center">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        </DropdownMenuItem>
      </div>
    );
  }

  return (
    <div className="space-y-1 p-1">
      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 px-2">
        {t('subscription.subscription')}
      </label>
      <div className="px-2 py-2 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium">{t('subscription.currentPlan')}</span>
          <Badge variant={plan === 'free' ? 'outline' : 'default'}>
            {t(`subscription.${plan}`)}
          </Badge>
        </div>
        <UsageIndicator />
        {plan !== 'free' && (
          <div className="pt-2">
            <ManageSubscriptionButton />
          </div>
        )}
      </div>
    </div>
  );
}

