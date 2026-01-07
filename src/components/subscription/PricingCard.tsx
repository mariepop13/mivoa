'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { PLAN_PRICING, PLAN_FEATURES } from '@/lib/subscription/constants';
import type { SubscriptionPlan, BillingCycle, Currency } from '@/lib/subscription/types';
import { cn } from '@/lib/utils';

interface PricingCardProps {
  plan: SubscriptionPlan;
  currency?: Currency;
  isCurrentPlan?: boolean;
  onUpgrade?: (planId: SubscriptionPlan, billingCycle: BillingCycle) => void;
}

function formatPrice(amount: number, currency: Currency): string {
  const symbols: Record<Currency, string> = {
    USD: '$',
    CAD: 'C$',
  };
  return `${symbols[currency]}${(amount / 100).toFixed(2)}`;
}

function getPlanName(plan: SubscriptionPlan, t: (key: string) => string): string {
  return t(`subscription.${plan}`);
}

export function PricingCard({
  plan,
  currency = 'USD',
  isCurrentPlan = false,
  onUpgrade,
}: PricingCardProps): React.JSX.Element {
  const { t } = useTranslation();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

  const pricing = PLAN_PRICING[plan];
  const features = PLAN_FEATURES[plan];
  const monthlyPrice = pricing.monthly[currency];
  const annualPrice = pricing.annual[currency];
  const annualSavings = monthlyPrice * 12 - annualPrice;
  const savingsPercent = monthlyPrice > 0 ? Math.round((annualSavings / (monthlyPrice * 12)) * 100) : 0;

  const currentPrice = billingCycle === 'monthly' ? monthlyPrice : annualPrice;
  const priceFormatted = formatPrice(currentPrice, currency);

  const handleUpgrade = () => {
    if (onUpgrade && plan !== 'free') {
      onUpgrade(plan, billingCycle);
    }
  };

  const isFree = plan === 'free';

  return (
    <Card
      className={cn(
        'relative flex flex-col',
        isCurrentPlan && 'border-primary shadow-lg',
        isFree && 'opacity-75'
      )}
    >
      {isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant="default">{t('subscription.currentPlan')}</Badge>
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-2xl">{getPlanName(plan, t)}</CardTitle>
        <CardDescription>
          {isFree ? t('subscription.freePlanDescription') : t('subscription.paidPlanDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <div className="space-y-2">
          {!isFree && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={cn(
                  'px-3 py-1 text-sm rounded-md transition-colors',
                  billingCycle === 'monthly'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                )}
              >
                {t('subscription.monthly')}
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('annual')}
                className={cn(
                  'px-3 py-1 text-sm rounded-md transition-colors',
                  billingCycle === 'annual'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                )}
              >
                {t('subscription.annual')}
              </button>
            </div>
          )}
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold">{priceFormatted}</span>
            {!isFree && (
              <span className="text-muted-foreground">/{t('subscription.perMonth')}</span>
            )}
          </div>
          {!isFree && billingCycle === 'annual' && savingsPercent > 0 && (
            <div className="text-sm text-green-600 dark:text-green-400">
              {t('subscription.savePercent').replace('{percent}', String(savingsPercent))}
            </div>
          )}
        </div>
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <span className="text-sm">{t(`subscription.features.${feature}`)}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        {isCurrentPlan ? (
          <Button variant="outline" className="w-full" disabled>
            {t('subscription.currentPlan')}
          </Button>
        ) : isFree ? (
          <Button variant="outline" className="w-full" disabled>
            {t('subscription.freePlan')}
          </Button>
        ) : (
          <Button className="w-full" onClick={handleUpgrade}>
            {t('subscription.upgrade')}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

