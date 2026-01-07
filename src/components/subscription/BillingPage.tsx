'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SubscriptionStatus } from './SubscriptionStatus';
import { UsageIndicator } from './UsageIndicator';
import { ManageSubscriptionButton } from './ManageSubscriptionButton';
import { PricingCard } from './PricingCard';
import { useSubscription } from '@/hooks/use-subscription';
import { useTranslation } from '@/hooks/use-translation';
import type { SubscriptionPlan, BillingCycle, Currency } from '@/lib/subscription/types';
import { PLAN_LIMITS, UNLIMITED_ENTRIES } from '@/lib/subscription/constants';
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
              {plans?.map((planData) => (
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

      <Card>
        <CardHeader>
          <CardTitle>{t('subscription.planComparison')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('subscription.feature')}</TableHead>
                <TableHead className="text-center">{t('subscription.free')}</TableHead>
                <TableHead className="text-center">{t('subscription.supporter')}</TableHead>
                <TableHead className="text-center">{t('subscription.basic')}</TableHead>
                <TableHead className="text-center">{t('subscription.pro')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>{t('subscription.comparison.entriesPerMonth')}</TableCell>
                <TableCell className="text-center">{PLAN_LIMITS.free.entriesPerMonth}</TableCell>
                <TableCell className="text-center">{PLAN_LIMITS.supporter.entriesPerMonth}</TableCell>
                <TableCell className="text-center">{PLAN_LIMITS.basic.entriesPerMonth}</TableCell>
                <TableCell className="text-center">{PLAN_LIMITS.pro.entriesPerMonth === UNLIMITED_ENTRIES ? t('subscription.comparison.unlimited') : PLAN_LIMITS.pro.entriesPerMonth}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>{t('subscription.comparison.aiModels')}</TableCell>
                <TableCell className="text-center">{PLAN_LIMITS.free.modelsAccess.length}</TableCell>
                <TableCell className="text-center">{PLAN_LIMITS.supporter.modelsAccess.length}</TableCell>
                <TableCell className="text-center">{PLAN_LIMITS.basic.modelsAccess.length}</TableCell>
                <TableCell className="text-center">{t('subscription.comparison.all')}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>{t('subscription.comparison.export')}</TableCell>
                <TableCell className="text-center">{t('subscription.comparison.no')}</TableCell>
                <TableCell className="text-center">{t('subscription.comparison.no')}</TableCell>
                <TableCell className="text-center">{PLAN_LIMITS.basic.exportEnabled ? t('subscription.comparison.standard') : t('subscription.comparison.no')}</TableCell>
                <TableCell className="text-center">{PLAN_LIMITS.pro.exportEnabled ? t('subscription.comparison.high') : t('subscription.comparison.no')}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>{t('subscription.comparison.advancedAnalysis')}</TableCell>
                <TableCell className="text-center">{PLAN_LIMITS.free.advancedAnalysis ? t('subscription.comparison.yes') : t('subscription.comparison.no')}</TableCell>
                <TableCell className="text-center">{PLAN_LIMITS.supporter.advancedAnalysis ? t('subscription.comparison.yes') : t('subscription.comparison.no')}</TableCell>
                <TableCell className="text-center">{PLAN_LIMITS.basic.advancedAnalysis ? t('subscription.comparison.yes') : t('subscription.comparison.no')}</TableCell>
                <TableCell className="text-center">{PLAN_LIMITS.pro.advancedAnalysis ? t('subscription.comparison.yes') : t('subscription.comparison.no')}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>{t('subscription.comparison.customTemplates')}</TableCell>
                <TableCell className="text-center">{PLAN_LIMITS.free.customTemplates ? t('subscription.comparison.yes') : t('subscription.comparison.no')}</TableCell>
                <TableCell className="text-center">{PLAN_LIMITS.supporter.customTemplates ? t('subscription.comparison.yes') : t('subscription.comparison.no')}</TableCell>
                <TableCell className="text-center">{PLAN_LIMITS.basic.customTemplates ? t('subscription.comparison.yes') : t('subscription.comparison.no')}</TableCell>
                <TableCell className="text-center">{PLAN_LIMITS.pro.customTemplates ? t('subscription.comparison.yes') : t('subscription.comparison.no')}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

