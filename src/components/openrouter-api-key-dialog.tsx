'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { OpenRouterApiKeySetup } from '@/components/openrouter-api-key-setup';
import { useTranslation } from '@/hooks/use-translation';

interface OpenRouterApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OpenRouterApiKeyDialog({ open, onOpenChange }: OpenRouterApiKeyDialogProps) {
  const { t } = useTranslation();

  const handleCompletion = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('openRouterApiKey')}</DialogTitle>
          <DialogDescription>
            {t('openRouterApiKeyRequiredDescription')}
          </DialogDescription>
        </DialogHeader>
        <OpenRouterApiKeySetup onCompletion={handleCompletion} />
      </DialogContent>
    </Dialog>
  );
}

