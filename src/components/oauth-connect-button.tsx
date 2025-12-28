'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { initiateOAuthFlow } from '@/lib/openrouter-oauth';
import { LoaderCircle, LogIn } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';

export function OAuthConnectButton(): React.JSX.Element {
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const { t } = useTranslation();

  const handleOAuthConnect = async () => {
    setIsOAuthLoading(true);
    try {
      const callbackUrl = `${window.location.origin}/auth/openrouter/callback`;
      await initiateOAuthFlow(callbackUrl);
    } catch (error) {
      console.error('Failed to initiate OAuth flow:', error);
      alert(`${t('oauthInitiationFailed')}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsOAuthLoading(false);
    }
  };

  return (
    <Button
      onClick={handleOAuthConnect}
      disabled={isOAuthLoading}
      className="w-full"
      variant="outline"
    >
      {isOAuthLoading ? (
        <>
          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          {t('connecting')}
        </>
      ) : (
        <>
          <LogIn className="mr-2 h-4 w-4" />
          {t('connectWithOpenRouter')}
        </>
      )}
    </Button>
  );
}

