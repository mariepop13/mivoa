'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/hooks/use-translation';

function SubscriptionSuccessContent(): React.JSX.Element {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (sessionId) {
      setIsLoading(false);
    }
  }, [sessionId]);

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-12 max-w-2xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('backToHome')}
        </Link>

        <Card className="text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl">
              {t('subscription.successTitle')}
            </CardTitle>
            <CardDescription>
              {t('subscription.successDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading && (
              <p className="text-sm text-muted-foreground">
                {t('subscription.processing')}
              </p>
            )}
            {sessionId && (
              <p className="text-xs text-muted-foreground">
                {t('subscription.sessionId')}: {sessionId}
              </p>
            )}
            <div className="flex gap-4 justify-center pt-4">
              <Button asChild>
                <Link href="/billing">{t('subscription.viewBilling')}</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/">{t('backToHome')}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function SubscriptionSuccessPage(): React.JSX.Element {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    }>
      <SubscriptionSuccessContent />
    </Suspense>
  );
}

