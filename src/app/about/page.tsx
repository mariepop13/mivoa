'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';

export default function AboutPage(): React.JSX.Element {
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
          {t('about.title')}
        </h1>
        
        <div className="space-y-8 prose prose-slate dark:prose-invert max-w-none">
          <section>
            <h2 className="text-2xl font-headline font-semibold mb-4">
              {t('about.description')}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t('about.descriptionContent')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-headline font-semibold mb-4">
              {t('about.creator')}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t('about.creatorContent')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-headline font-semibold mb-4">
              {t('about.mission')}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t('about.missionContent')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-headline font-semibold mb-4">
              {t('about.alphaStatus')}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t('about.alphaStatusContent')}
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

