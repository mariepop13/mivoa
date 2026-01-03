'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';

export default function PrivacyPage(): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('backToHome')}
        </Link>
        <h1 className="text-3xl font-headline font-bold mb-8">
          {t('privacy.title')}
        </h1>
        
        <div className="space-y-8 prose prose-slate dark:prose-invert max-w-none">
          <section>
            <h2 className="text-2xl font-headline font-semibold mb-4">
              {t('privacy.introduction')}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t('privacy.introductionContent')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-headline font-semibold mb-4">
              {t('privacy.dataCollection')}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t('privacy.dataCollectionContent')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-headline font-semibold mb-4">
              {t('privacy.thirdPartyServices')}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t('privacy.thirdPartyServicesContent')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-headline font-semibold mb-4">
              {t('privacy.userRights')}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t('privacy.userRightsContent')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-headline font-semibold mb-4">
              {t('privacy.cookies')}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t('privacy.cookiesContent')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-headline font-semibold mb-4">
              {t('privacy.contactPrivacy')}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t('privacy.contactPrivacyContent')}
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

