'use client';

import { useContext } from 'react';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';
import { OpenRouterApiKeyContext } from '@/context/OpenRouterApiKeyContext';

interface SettingsApiKeySectionProps {
  onOpenDialog: () => void;
}

export function SettingsApiKeySection({ onOpenDialog }: SettingsApiKeySectionProps): React.JSX.Element {
  const { apiKey: openRouterApiKey } = useContext(OpenRouterApiKeyContext);
  const { t } = useTranslation();

  return (
    <div className="space-y-1 p-1">
      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 px-2">
        {t('openRouterApiKey')}
      </label>
      <DropdownMenuItem
        onClick={onOpenDialog}
        className="flex items-center justify-between cursor-pointer"
      >
        <div className="flex items-center gap-2">
          {openRouterApiKey ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <XCircle className="h-3.5 w-3.5 text-destructive" />
          )}
          <span className={cn(
            "text-xs font-medium",
            openRouterApiKey ? "text-green-600 dark:text-green-400" : "text-destructive"
          )}>
            {openRouterApiKey ? t('openRouterApiKeyConfigured') : t('openRouterApiKeyNotConfigured')}
          </span>
        </div>
      </DropdownMenuItem>
    </div>
  );
}


