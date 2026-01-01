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

interface OAuthCallbackHandlers {
  setApiKey: (key: string) => Promise<void>;
  setStatus: (status: OAuthCallbackStatus) => void;
  setErrorMessage: (error: string | null) => void;
  pushRoute: (path: string) => void;
}

interface OAuthCallbackParams {
  code: string | null;
  state: string | null;
  error: string | null;
}

function validateOAuthParams(
  params: OAuthCallbackParams,
  t: (key: string) => string
): { isValid: boolean; errorMessage?: string } {
  if (params.error) {
    return { isValid: false, errorMessage: params.error };
  }
  if (!params.code) {
    return { isValid: false, errorMessage: t('noAuthorizationCode') };
  }
  return { isValid: true };
}

async function handleOAuthSuccess(
  code: string,
  state: string | null,
  handlers: OAuthCallbackHandlers
): Promise<NodeJS.Timeout> {
  const apiKey = await exchangeAuthCodeForApiKey(code, state || undefined);
  await handlers.setApiKey(apiKey);
  handlers.setStatus('success');
  
  return setTimeout(() => {
    handlers.pushRoute('/');
  }, REDIRECT_DELAY_MS);
}

async function handleOAuthCallback({
  code,
  state,
  error,
  handlers,
  t,
}: {
  code: string | null;
  state: string | null;
  error: string | null;
  handlers: OAuthCallbackHandlers;
  t: (key: string) => string;
}): Promise<NodeJS.Timeout | null> {
  const validation = validateOAuthParams({ code, state, error }, t);
  if (!validation.isValid) {
    handlers.setErrorMessage(validation.errorMessage!);
    handlers.setStatus('error');
    return null;
  }

  try {
    return await handleOAuthSuccess(code!, state, handlers);
  } catch (error) {
    console.error('Failed to exchange auth code:', error);
    handlers.setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
    handlers.setStatus('error');
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
        handlers: {
          setApiKey,
          setStatus,
          setErrorMessage,
          pushRoute: router.push.bind(router),
        },
        t,
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

