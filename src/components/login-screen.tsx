'use client';

import { useState } from 'react';
import { useAuth } from '@/firebase';
import { signInWithGoogle, initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { useTranslation } from '@/hooks/use-translation';

function useLoginHandlers(
  auth: ReturnType<typeof useAuth>,
  t: (key: string) => string,
  setIsLoading: (loading: boolean) => void,
  setErrorMessage: (error: string | null) => void
) {
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await signInWithGoogle(auth);
    } catch (error) {
      console.error('Login failed:', error);
      const message = error instanceof Error 
        ? `${t('signInFailed')} ${error.message}` 
        : t('signInFailedGeneric');
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnonymousLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await initiateAnonymousSignIn(auth);
    } catch (error) {
      console.error('Anonymous login failed:', error);
      const message = error instanceof Error 
        ? `${t('anonymousSignInFailed')} ${error.message}` 
        : t('anonymousSignInFailedGeneric');
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return { handleGoogleLogin, handleAnonymousLogin };
}

function LoginForm({
  isLoading,
  errorMessage,
  onGoogleLogin,
  onAnonymousLogin,
  t,
}: {
  isLoading: boolean;
  errorMessage: string | null;
  onGoogleLogin: () => void;
  onAnonymousLogin: () => void;
  t: (key: string) => string;
}): React.JSX.Element {
  return (
    <div className="space-y-3">
      {errorMessage && (
        <div role="alert" className="px-4 py-3 bg-destructive/10 text-destructive rounded-lg text-sm border border-destructive/20">
          {errorMessage}
        </div>
      )}
      
      <button
        onClick={onGoogleLogin}
        disabled={isLoading}
        className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? t('signingIn') : t('signInWithGoogle')}
      </button>
      
      <button
        onClick={onAnonymousLogin}
        disabled={isLoading}
        className="w-full px-4 py-3 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? t('signingIn') : t('continueAnonymously')}
      </button>
    </div>
  );
}

export function LoginScreen(): React.JSX.Element {
  const auth = useAuth();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { handleGoogleLogin, handleAnonymousLogin } = useLoginHandlers(
    auth,
    t,
    setIsLoading,
    setErrorMessage
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center max-w-md px-4">
        <h1 className="text-3xl font-headline font-bold mb-2">
          {t('appName')}
        </h1>
        <p className="text-muted-foreground mb-8">
          {t('appSubtitle')}
        </p>
        
        <LoginForm
          isLoading={isLoading}
          errorMessage={errorMessage}
          onGoogleLogin={handleGoogleLogin}
          onAnonymousLogin={handleAnonymousLogin}
          t={t}
        />
      </div>
    </main>
  );
}

