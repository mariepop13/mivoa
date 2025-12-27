'use client';

import { useEffect, useState, useContext, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { exchangeAuthCodeForApiKey } from '@/lib/openrouter-oauth';
import { OpenRouterApiKeyContext } from '@/context/OpenRouterApiKeyContext';
import { useTranslation } from '@/hooks/use-translation';
import { LoaderCircle, CheckCircle2, XCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

function OpenRouterCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setApiKey } = useContext(OpenRouterApiKeyContext);
  const { t } = useTranslation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        setErrorMessage(error);
        setStatus('error');
        return;
      }

      if (!code) {
        setErrorMessage(t('noAuthorizationCode'));
        setStatus('error');
        return;
      }

      try {
        const apiKey = await exchangeAuthCodeForApiKey(code, state || undefined);
        await setApiKey(apiKey);
        setStatus('success');
        
        timeoutId = setTimeout(() => {
          router.push('/');
        }, 2000);
      } catch (error) {
        console.error('Failed to exchange auth code:', error);
        setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
        setStatus('error');
      }
    };

    handleCallback();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [searchParams, setApiKey, router, t]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4 rounded-lg border border-border bg-card p-6 shadow-lg">
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-4">
            <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              {t('connectingToOpenRouter')}
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-4">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
            <p className="text-sm font-medium text-foreground">
              {t('openRouterConnected')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('redirecting')}
            </p>
          </div>
        )}

        {status === 'error' && (
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
              onClick={() => router.push('/')}
              className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              {t('goBack')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OpenRouterCallbackPage() {
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

