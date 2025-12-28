import { useState, useEffect } from 'react';
import { useAuth } from '@/firebase';
import { useUser } from '@/firebase/auth/use-user';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { isAppOfflineError } from '@/firebase/utils';

export function useJournalAuth() {
  const auth = useAuth();
  const { user, isLoading: authLoading } = useUser();
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    
    if (!authLoading && !user && auth) {
      initiateAnonymousSignIn(auth).catch((error) => {
        if (mounted) {
          if (isAppOfflineError(error)) {
            console.warn('Authentication failed: Application is offline. Please check your internet connection.');
            setAuthError('Application is offline. Please check your internet connection and try again.');
          } else {
            console.error('Failed to sign in anonymously:', error);
            setAuthError('Authentication failed. Please check your Firebase configuration.');
          }
        }
      });
    }
    
    return () => {
      mounted = false;
    };
  }, [auth, authLoading, user]);

  return {
    authError,
    authLoading,
    user,
  };
}

