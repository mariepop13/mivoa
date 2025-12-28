'use client';

import { useContext, useState } from 'react';
import { OpenRouterApiKeyContext } from '@/context/OpenRouterApiKeyContext';
import { useTranslation } from '@/hooks/use-translation';
import { ApiKeyStatus } from '@/components/api-key-status';
import { ApiKeyForm } from '@/components/api-key-form';
import { OAuthConnectButton } from '@/components/oauth-connect-button';

interface OpenRouterApiKeySetupProps {
  onCompletion?: () => void;
}

export function OpenRouterApiKeySetup({ onCompletion }: OpenRouterApiKeySetupProps): React.JSX.Element {
  const { apiKey, setApiKey, resetApiKey } = useContext(OpenRouterApiKeyContext);
  const { t } = useTranslation();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (submittedApiKey: string) => {
    setSubmitError(null);
    try {
      await setApiKey(submittedApiKey);
      if (onCompletion) {
        onCompletion();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save API key';
      setSubmitError(errorMessage);
      console.error('Error setting OpenRouter API key:', error);
    }
  };

  const handleReset = async () => {
    if (confirm(t('resetOpenRouterApiKeyConfirmDescription'))) {
      try {
        await resetApiKey();
      } catch (error) {
        console.error('Error resetting OpenRouter API key', error);
        alert('Failed to reset API key. Please try again.');
      }
    }
  };

  return (
    <div className="w-full space-y-4">
      <ApiKeyStatus onReset={handleReset} />
      {!apiKey && (
        <div className="space-y-4">
          {submitError && (
            <div role="alert" className="px-4 py-3 bg-destructive/10 text-destructive rounded-lg text-sm border border-destructive/20">
              {submitError}
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="flex-1 border-t border-border"></div>
            <span className="text-xs text-muted-foreground">{t('or')}</span>
            <div className="flex-1 border-t border-border"></div>
          </div>
          <OAuthConnectButton />
          <div className="flex items-center gap-2">
            <div className="flex-1 border-t border-border"></div>
            <span className="text-xs text-muted-foreground">{t('or')}</span>
            <div className="flex-1 border-t border-border"></div>
          </div>
          <ApiKeyForm onSubmit={handleSubmit} />
        </div>
      )}
    </div>
  );
}

