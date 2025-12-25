'use client';

import { useState } from 'react';
import { useAuth } from '@/firebase';
import { signInWithGoogle, initiateAnonymousSignIn } from '@/firebase/non-blocking-login';

export function LoginScreen() {
  const auth = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle(auth);
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnonymousLogin = async () => {
    setIsLoading(true);
    try {
      await initiateAnonymousSignIn(auth);
    } catch (error) {
      console.error('Anonymous login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center max-w-md px-4">
        <h1 className="text-3xl font-headline font-bold mb-2">
          Mivoa
        </h1>
        <p className="text-muted-foreground mb-8">
          Your AI-assisted journal
        </p>
        
        <div className="space-y-3">
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing in...' : 'Sign in with Google'}
          </button>
          
          <button
            onClick={handleAnonymousLogin}
            disabled={isLoading}
            className="w-full px-4 py-3 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing in...' : 'Continue anonymously'}
          </button>
        </div>
      </div>
    </main>
  );
}

