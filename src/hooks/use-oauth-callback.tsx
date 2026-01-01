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

async function handleOAuthCallback({
  code,
  state,
  error,
  setApiKey,
  setStatus,
  setErrorMessage,
  t,
  pushRoute,
}: {
  code: string | null;
  state: string | null;
  error: string | null;
  setApiKey: (key: string) => Promise<void>;
  setStatus: (status: OAuthCallbackStatus) => void;
  setErrorMessage: (error: string | null) => void;
  t: (key: string) => string;
  pushRoute: (path: string) => void;
}): Promise<NodeJS.Timeout | null> {
  if (error) {
    setErrorMessage(error);
    setStatus('error');
    return null;
  }

  if (!code) {
    setErrorMessage(t('noAuthorizationCode'));
    setStatus('error');
    return null;
  }

  try {
    const apiKey = await exchangeAuthCodeForApiKey(code, state || undefined);
    await setApiKey(apiKey);
    setStatus('success');

    return setTimeout(() => {
      pushRoute('/');
    }, REDIRECT_DELAY_MS);
  } catch (error) {
    console.error('Failed to exchange auth code:', error);
    setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
    setStatus('error');
    return null;
  }
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

    const processCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      timeoutId = await handleOAuthCallback({
        code,
        state,
        error,
        setApiKey,
        setStatus,
        setErrorMessage,
        t,
        pushRoute: router.push.bind(router),
      });
    };

    processCallback();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [searchParams, setApiKey, router, t]);

  return { status, errorMessage };
}

