'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SubscriptionStatus } from './SubscriptionStatus';
import { UsageIndicator } from './UsageIndicator';
import { ManageSubscriptionButton } from './ManageSubscriptionButton';
import { PricingCard } from './PricingCard';
import { useSubscription } from '@/hooks/use-subscription';
import { useTranslation } from '@/hooks/use-translation';
import type { SubscriptionPlan, BillingCycle, Currency } from '@/lib/subscription/types';
import { Loader2 } from 'lucide-react';

interface PlanData {
  id: SubscriptionPlan;
  name: string;
  price: {
    monthly: number;
    annual: number;
    monthlyFormatted: string;
    annualFormatted: string;
    annualSavings: number;
    annualSavingsFormatted: string;
    savingsPercent: number;
  };
  currency: Currency;
  features: string[];
}

export function BillingPage(): React.JSX.Element {
  const { t } = useTranslation();
  const { plan, isLoading: isSubscriptionLoading } = useSubscription();
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [currency] = useState<Currency>('USD');

  useEffect(() => {
    async function fetchPlans() {
      try {
        const response = await fetch(`/api/stripe/plans?currency=${currency}`);
        if (!response.ok) {
          throw new Error('Failed to fetch plans');
        }
        const data = await response.json();
        setPlans(data.plans);
      } catch (error) {
        console.error('Failed to load plans:', error);
      } finally {
        setIsLoadingPlans(false);
      }
    }

    fetchPlans();
  }, [currency]);

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
      }
    } catch (error) {
      console.error('Failed to create checkout session:', error);
    }
  };

  if (isSubscriptionLoading || isLoadingPlans) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{t('subscription.billing')}</h1>
        <p className="text-muted-foreground mt-2">{t('subscription.billingDescription')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>{t('subscription.currentSubscription')}</CardTitle>
            <CardDescription>{t('subscription.currentSubscriptionDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <SubscriptionStatus />
            <UsageIndicator />
            {plan !== 'free' && <ManageSubscriptionButton />}
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-4">{t('subscription.availablePlans')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plans.map((planData) => (
                <PricingCard
                  key={planData.id}
                  plan={planData.id}
                  currency={planData.currency}
                  isCurrentPlan={plan === planData.id}
                  onUpgrade={handleUpgrade}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

