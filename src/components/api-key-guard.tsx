'use client';

import { ReactNode, useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { OpenRouterApiKeyContext } from '@/context/OpenRouterApiKeyContext';
import { JournalLoadingState } from '@/components/journal-loading-state';

export function ApiKeyGuard({ children }: { children: ReactNode }): React.JSX.Element {
  const { apiKey, isLoading } = useContext(OpenRouterApiKeyContext);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !apiKey) {
      router.replace('/onboarding');
    }
  }, [apiKey, isLoading, router]);

  if (isLoading) return <JournalLoadingState />;
  return <>{children}</>;
}
