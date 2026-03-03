'use client';

import { useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { OpenRouterApiKeyContext } from '@/context/OpenRouterApiKeyContext';
import { OpenRouterApiKeySetup } from '@/components/openrouter-api-key-setup';

export default function OnboardingPage(): React.JSX.Element {
  const router = useRouter();
  const { apiKey, isLoading } = useContext(OpenRouterApiKeyContext);

  useEffect(() => {
    if (!isLoading && apiKey) {
      router.replace('/');
    }
  }, [apiKey, isLoading, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-headline font-bold mb-2">Welcome to mivoa</h1>
          <p className="text-muted-foreground">
            Mivoa uses OpenRouter to power AI features. Connect your own API key to get started — your key is stored securely and never shared.
          </p>
        </div>
        <OpenRouterApiKeySetup onCompletion={() => router.push('/')} />
      </div>
    </main>
  );
}
