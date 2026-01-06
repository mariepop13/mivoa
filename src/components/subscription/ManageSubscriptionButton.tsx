'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { useSubscription } from '@/hooks/use-subscription';
import { Loader2 } from 'lucide-react';

export function ManageSubscriptionButton(): React.JSX.Element | null {
  const { t } = useTranslation();
  const { plan, isLoading } = useSubscription();
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFreePlan = plan === 'free';

  const handleManageSubscription = async () => {
    if (isFreePlan) return;

    setIsLoadingPortal(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/create-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t('subscription.portalError'));
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      } else {
        throw new Error(t('subscription.portalError'));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('subscription.portalError');
      setError(errorMessage);
      setIsLoadingPortal(false);
    }
  };

  if (isLoading) {
    return (
      <Button variant="outline" disabled>
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        {t('loading')}
      </Button>
    );
  }

  if (isFreePlan) {
    return null;
  }

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        onClick={handleManageSubscription}
        disabled={isLoadingPortal}
        className="w-full"
      >
        {isLoadingPortal ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            {t('subscription.openingPortal')}
          </>
        ) : (
          t('subscription.manageSubscription')
        )}
      </Button>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

