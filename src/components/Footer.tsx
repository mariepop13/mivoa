'use client';

import Link from 'next/link';
import { useTranslation } from '@/hooks/use-translation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export function Footer(): React.JSX.Element {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  const copyright = t('footer.copyright').replace('{year}', currentYear.toString());

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="space-y-4">
          <Alert className="border-primary/20 bg-primary/5">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {t('footer.alphaNotice')}
            </AlertDescription>
          </Alert>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              {copyright}
            </div>

            <nav className="flex flex-wrap justify-center gap-4 md:gap-6">
              <Link
                href="/privacy"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('footer.privacy')}
              </Link>
              <Link
                href="/legal"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('footer.legal')}
              </Link>
              <Link
                href="/contact"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('footer.contact')}
              </Link>
              <Link
                href="/about"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('footer.about')}
              </Link>
              <Link
                href="/terms"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('footer.terms')}
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}


