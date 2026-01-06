'use client';

import Link from 'next/link';
import { ArrowLeft, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/hooks/use-translation';

export default function SubscriptionCancelPage(): React.JSX.Element {
  const { t } = useTranslation();

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
              <XCircle className="h-16 w-16 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl">
              {t('subscription.cancelTitle')}
            </CardTitle>
            <CardDescription>
              {t('subscription.cancelDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('subscription.cancelMessage')}
            </p>
            <div className="flex gap-4 justify-center pt-4">
              <Button asChild>
                <Link href="/billing">{t('subscription.viewPlans')}</Link>
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

