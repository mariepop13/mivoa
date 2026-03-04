'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStorage } from '@/repositories/storage-provider';
import { LoginScreen } from '@/components/login-screen';
import { JournalLoadingState } from '@/components/journal-loading-state';

export default function AuthPage(): React.JSX.Element {
  const { user, isUserLoading: isLoading } = useStorage();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/');
    }
  }, [user, isLoading, router]);

  if (isLoading) return <JournalLoadingState />;
  return <LoginScreen />;
}
