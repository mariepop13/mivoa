'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { BillingPage } from '@/components/subscription/BillingPage';

export default function BillingPageRoute(): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <div className="container mx-auto px-4 py-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('backToHome')}
          </Link>
        </div>
        <BillingPage />
      </main>
    </div>
  );
}

