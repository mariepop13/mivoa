'use client';

import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';
import { useModel } from '@/context/ModelContext';

interface SettingsModelSectionProps {
  onOpenDialog: () => void;
}

export function SettingsModelSection({ onOpenDialog }: SettingsModelSectionProps): React.JSX.Element {
  const { selectedModel } = useModel();
  const { t } = useTranslation();

  return (
    <div className="space-y-1 p-1">
      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 px-2">
        {t('aiModel')}
      </label>
      <DropdownMenuItem
        onClick={onOpenDialog}
        className="flex items-center justify-between cursor-pointer"
      >
        <div className="flex items-center gap-2 min-w-0">
          {selectedModel ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
          ) : (
            <XCircle className="h-3.5 w-3.5 text-destructive flex-shrink-0" />
          )}
          <span className={cn(
            "text-xs font-medium truncate",
            selectedModel ? "text-green-600 dark:text-green-400" : "text-destructive"
          )}>
            {selectedModel ? selectedModel.split('/').pop() : t('defaultModel')}
          </span>
        </div>
      </DropdownMenuItem>
    </div>
  );
}


