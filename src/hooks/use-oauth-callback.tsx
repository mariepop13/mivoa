import { useEffect, useState, useContext } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { exchangeAuthCodeForApiKey } from '@/lib/openrouter-oauth';
import { OpenRouterApiKeyContext } from '@/context/OpenRouterApiKeyContext';
import { useTranslation } from '@/hooks/use-translation';

const REDIRECT_DELAY_MS = 2000;

type OAuthCallbackStatus = 'loading' | 'success' | 'error';

interface UseOAuthCallbackResult {
  status: OAuthCallbackStatus;
  errorMessage: string | null;
}

export function useOAuthCallback(): UseOAuthCallbackResult {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setApiKey } = useContext(OpenRouterApiKeyContext);
  const { t } = useTranslation();
  const [status, setStatus] = useState<OAuthCallbackStatus>('loading');
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
        }, REDIRECT_DELAY_MS);
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

  return { status, errorMessage };
}

