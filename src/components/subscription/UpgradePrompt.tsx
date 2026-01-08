'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PricingCard } from './PricingCard';
import { useTranslation } from '@/hooks/use-translation';
import { useSubscription } from '@/hooks/use-subscription';
import type { SubscriptionPlan, BillingCycle, Currency } from '@/lib/subscription/types';

interface UpgradePromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requiredPlan?: SubscriptionPlan;
  featureName?: string;
}

export function UpgradePrompt({
  open,
  onOpenChange,
  requiredPlan,
  featureName,
}: UpgradePromptProps): React.JSX.Element {
  const { t } = useTranslation();
  const { plan } = useSubscription();
  const [currency] = useState<Currency>('USD');

  const handleUpgrade = async (planId: SubscriptionPlan, billingCycle: BillingCycle) => {
    if (planId === 'free') return;

    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          billingCycle,
          currency,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t('subscription.checkoutError'));
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      } else {
        throw new Error(t('subscription.checkoutError'));
      }
    } catch (error) {
      console.error('Failed to create checkout session:', error);
    }
  };

  const availablePlans: SubscriptionPlan[] = plan === 'free' ? ['supporter', 'pro'] : plan === 'supporter' ? ['pro'] : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {featureName
              ? t('subscription.upgradeRequired').replace('{feature}', featureName)
              : t('subscription.upgradeTitle')}
          </DialogTitle>
          <DialogDescription>
            {requiredPlan
              ? t('subscription.upgradeDescription').replace('{plan}', t(`subscription.${requiredPlan}`))
              : t('subscription.upgradeDescriptionGeneric')}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          {availablePlans.map((planId) => (
            <PricingCard
              key={planId}
              plan={planId}
              currency={currency}
              onUpgrade={handleUpgrade}
            />
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

