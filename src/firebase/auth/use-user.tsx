'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { useAuth } from '@/firebase';

export interface UseUserResult {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
}

export const useUser = (): UseUserResult => {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!auth) {
      setTimeout(() => setIsLoading(false), 0);
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (user: User | null) => {
        setUser(user);
        setIsLoading(false);
      },
      (error: Error) => {
        console.error('Auth state listener error:', error);
        setError(error);
        setUser(null);
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [auth]);

  return { user, isLoading, error };
};

