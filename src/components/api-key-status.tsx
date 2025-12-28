'use client';

import { useContext } from 'react';
import { OpenRouterApiKeyContext } from '@/context/OpenRouterApiKeyContext';
import { useTranslation } from '@/hooks/use-translation';
import { CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ApiKeyStatusProps {
  onReset: () => void;
}

export function ApiKeyStatus({ onReset }: ApiKeyStatusProps): React.JSX.Element {
  const { apiKey } = useContext(OpenRouterApiKeyContext);
  const { t } = useTranslation();

  return (
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
          onClick={onReset}
          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
          title={t('resetOpenRouterApiKey')}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

