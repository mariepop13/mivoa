'use client';

import { useState, useEffect, useContext } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Settings2 } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { OpenRouterApiKeyContext } from '@/context/OpenRouterApiKeyContext';
import { OpenRouterApiKeyDialog } from '@/components/openrouter-api-key-dialog';
import { ModelSelectionDialog } from '@/components/model-selection-dialog';
import { SettingsThemeSection } from '@/components/settings-theme-section';
import { SettingsLanguageSection } from '@/components/settings-language-section';
import { SettingsModelSection } from '@/components/settings-model-section';
import { SettingsApiKeySection } from '@/components/settings-api-key-section';

export function SettingsMenu(): React.JSX.Element {
  const { t } = useTranslation();
  const { apiKey, isLoading: isApiKeyLoading } = useContext(OpenRouterApiKeyContext);
  const [mounted, setMounted] = useState(false);
  const [isOpenRouterDialogOpen, setIsOpenRouterDialogOpen] = useState(false);
  const [isModelDialogOpen, setIsModelDialogOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Settings2 className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">{t('settings')}</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Settings2 className="h-[1.2rem] w-[1.2rem]" />
          {!isApiKeyLoading && !apiKey && (
            <span className="absolute top-2 right-2 flex h-2 w-2">
              <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
            </span>
          )}
          <span className="sr-only">{t('settings')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex items-center gap-2 px-2 py-2 mb-2 border-b border-border">
          <Settings2 className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold tracking-tight">{t('settings')}</span>
        </div>

        <SettingsThemeSection />

        <DropdownMenuSeparator />

        <SettingsLanguageSection />

        <DropdownMenuSeparator />

        <SettingsModelSection onOpenDialog={() => setIsModelDialogOpen(true)} />

        <DropdownMenuSeparator />

        <SettingsApiKeySection onOpenDialog={() => setIsOpenRouterDialogOpen(true)} />
      </DropdownMenuContent>
      <OpenRouterApiKeyDialog 
        open={isOpenRouterDialogOpen} 
        onOpenChange={setIsOpenRouterDialogOpen} 
      />
      <ModelSelectionDialog
        open={isModelDialogOpen}
        onOpenChange={setIsModelDialogOpen}
      />
    </DropdownMenu>
  );
}

