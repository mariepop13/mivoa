'use client';

import { Suspense, type ReactElement } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/use-translation';
import { useOAuthCallback } from '@/hooks/use-oauth-callback';
import { LoaderCircle, CheckCircle2, XCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

function LoadingState() {
  const { t } = useTranslation();
  
  return (
    <div className="flex flex-col items-center gap-4">
      <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">
        {t('connectingToOpenRouter')}
      </p>
    </div>
  );
}

function SuccessState() {
  const { t } = useTranslation();
  
  return (
    <div className="flex flex-col items-center gap-4">
      <CheckCircle2 className="h-8 w-8 text-green-500" />
      <p className="text-sm font-medium text-foreground">
        {t('openRouterConnected')}
      </p>
      <p className="text-xs text-muted-foreground">
        {t('redirecting')}
      </p>
    </div>
  );
}

function ErrorState({ errorMessage }: { errorMessage: string | null }) {
  const { t } = useTranslation();
  const router = useRouter();
  
  return (
    <div className="flex flex-col items-center gap-4">
      <XCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm font-medium text-destructive">
        {t('openRouterConnectionFailed')}
      </p>
      {errorMessage && (
        <p className="text-xs text-muted-foreground">
          {errorMessage}
        </p>
      )}
      <button
        type="button"
        onClick={() => router.push('/')}
        className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {t('goBack')}
      </button>
    </div>
  );
}

function OpenRouterCallbackContent() {
  const { status, errorMessage } = useOAuthCallback();

  const renderState = (): ReactElement => {
    switch (status) {
      case 'loading':
        return <LoadingState />;
      case 'success':
        return <SuccessState />;
      case 'error':
        return <ErrorState errorMessage={errorMessage} />;
      default:
        return <LoadingState />;
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4 rounded-lg border border-border bg-card p-6 shadow-lg">
        {renderState()}
      </div>
    </div>
  );
}

export default function OpenRouterCallbackPage(): ReactElement {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="w-full max-w-md space-y-4 rounded-lg border border-border bg-card p-6 shadow-lg">
            <div className="flex flex-col items-center gap-4">
              <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          </div>
        </div>
      }
    >
      <OpenRouterCallbackContent />
    </Suspense>
  );
}

