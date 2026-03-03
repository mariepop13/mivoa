'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { LoginScreen } from '@/components/login-screen';
import { JournalLoadingState } from '@/components/journal-loading-state';

export default function AuthPage(): React.JSX.Element {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/');
    }
  }, [user, isLoading, router]);

  if (isLoading) return <JournalLoadingState />;
  return <LoginScreen />;
}
