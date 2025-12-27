'use client';

import { useState, useContext } from 'react';
import { OpenRouterApiKeyContext } from '@/context/OpenRouterApiKeyContext';
import { useTranslation } from '@/hooks/use-translation';
import { Button } from '@/components/ui/button';
import { validateOpenRouterApiKey } from '@/lib/openrouter-client';
import { KeyRound, LoaderCircle, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OpenRouterApiKeySetupProps {
  onCompletion?: () => void;
}

export function OpenRouterApiKeySetup({ onCompletion }: OpenRouterApiKeySetupProps) {
  const [localApiKey, setLocalApiKey] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const { apiKey, setApiKey, resetApiKey } = useContext(OpenRouterApiKeyContext);
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!localApiKey.trim()) {
      return;
    }

    setIsVerifying(true);
    try {
      const isValid = await validateOpenRouterApiKey(localApiKey.trim());
      if (isValid) {
        await setApiKey(localApiKey.trim());
        setLocalApiKey('');
        if (onCompletion) {
          onCompletion();
        }
      } else {
        alert(t('invalidOpenRouterApiKey') + ': ' + t('invalidOpenRouterApiKeyDescription'));
      }
    } catch (error) {
      console.error('Error validating or saving OpenRouter API key', error);
      alert(t('invalidOpenRouterApiKey') + ': ' + t('invalidOpenRouterApiKeyDescription'));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleReset = async () => {
    if (confirm(t('resetOpenRouterApiKeyConfirmDescription'))) {
      try {
        await resetApiKey();
        setLocalApiKey('');
      } catch (error) {
        console.error('Error resetting OpenRouter API key', error);
        alert('Failed to reset API key. Please try again.');
      }
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between p-2 bg-accent/10 rounded-xl border border-border/20">
        <div className="flex items-center gap-2">
          {apiKey ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-destructive" />
          )}
          <span className={cn(
            "text-xs font-medium",
            apiKey ? "text-green-600 dark:text-green-400" : "text-destructive"
          )}>
            {apiKey ? t('openRouterApiKeyConfigured') : t('openRouterApiKeyNotConfigured')}
          </span>
        </div>
        {apiKey && (
          <button
            onClick={handleReset}
            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
            title={t('resetOpenRouterApiKey')}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {!apiKey && (
        <form onSubmit={handleSubmit} className="space-y-3">
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
                className="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
              <Button
                type="submit"
                size="sm"
                disabled={isVerifying || !localApiKey.trim()}
              >
                {isVerifying ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <KeyRound className="h-4 w-4" />
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
      )}
    </div>
  );
}

