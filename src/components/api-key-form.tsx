'use client';

import { Button } from '@/components/ui/button';
import { KeyRound, LoaderCircle } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { useApiKeyValidation } from '@/hooks/use-api-key-validation';

interface ApiKeyFormProps {
  onSubmit: (apiKey: string) => Promise<void>;
}

export function ApiKeyForm({ onSubmit }: ApiKeyFormProps): React.JSX.Element {
  const { t } = useTranslation();
  const { localApiKey, setLocalApiKey, isVerifying, handleSubmit } = useApiKeyValidation();

  const onFormSubmit = async (e: React.FormEvent) => {
    await handleSubmit(e, onSubmit, (_message) => {
      alert(`${t('invalidOpenRouterApiKey')}: ${t('invalidOpenRouterApiKeyDescription')}`);
    });
  };

  return (
    <form onSubmit={onFormSubmit} className="space-y-3">
      <div className="space-y-2">
        <label htmlFor="openrouter-api-key" className="text-xs font-medium">
          {t('openRouterApiKey')}
        </label>
        <div className="flex gap-2">
          <input
            type="password"
            id="openrouter-api-key"
            placeholder={t('openRouterApiKeyPlaceholder')}
            value={localApiKey}
            onChange={(e) => setLocalApiKey(e.target.value)}
            required
            disabled={isVerifying}
            className="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm 
              shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm 
              file:font-medium placeholder:text-muted-foreground focus-visible:outline-none 
              focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed 
              disabled:opacity-50"
          />
          <Button
            type="submit"
            size="sm"
            disabled={isVerifying || !localApiKey.trim()}
            aria-label={isVerifying ? t('verifyingApiKey') : t('verifyApiKey')}
          >
            {isVerifying ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                <span className="sr-only">{t('verifyingApiKey')}</span>
              </>
            ) : (
              <>
                <KeyRound className="h-4 w-4" />
                <span className="sr-only">{t('verifyApiKey')}</span>
              </>
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          <a
            href="https://openrouter.ai/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary underline underline-offset-4 transition-colors"
          >
            {t('getOpenRouterApiKeyLink')}
          </a>
        </p>
      </div>
    </form>
  );
}

