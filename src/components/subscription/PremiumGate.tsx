'use client';

import { ReactNode, useState } from 'react';
import { useSubscription } from '@/hooks/use-subscription';
import { useTranslation } from '@/hooks/use-translation';
import { UpgradePrompt } from './UpgradePrompt';
import type { SubscriptionPlan } from '@/lib/subscription/types';

interface PremiumGateProps {
  children: ReactNode;
  requiredPlan?: SubscriptionPlan;
  featureName?: string;
  fallback?: ReactNode;
}

function hasAccess(currentPlan: SubscriptionPlan, requiredPlan: SubscriptionPlan): boolean {
  if (requiredPlan === 'free') return true;
  if (requiredPlan === 'basic') return currentPlan === 'basic' || currentPlan === 'pro';
  if (requiredPlan === 'pro') return currentPlan === 'pro';
  return false;
}

export function PremiumGate({
  children,
  requiredPlan = 'basic',
  featureName,
  fallback,
}: PremiumGateProps): React.JSX.Element | null {
  const { plan, isLoading } = useSubscription();
  const { t } = useTranslation();
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  if (isLoading) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return null;
  }

  if (!hasAccess(plan, requiredPlan)) {
    return (
      <>
        {fallback || (
          <div className="flex items-center justify-center p-8 border border-dashed rounded-lg">
            <button
              type="button"
              onClick={() => setShowUpgradePrompt(true)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {featureName
                ? t('subscription.upgradeToAccess').replace('{feature}', featureName)
                : t('subscription.upgradeToAccessGeneric')}
            </button>
          </div>
        )}
        <UpgradePrompt
          open={showUpgradePrompt}
          onOpenChange={setShowUpgradePrompt}
          requiredPlan={requiredPlan}
          featureName={featureName}
        />
      </>
    );
  }

  return <>{children}</>;
}

