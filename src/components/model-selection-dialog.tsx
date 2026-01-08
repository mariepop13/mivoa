'use client';

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ModelCard } from '@/components/model-card';
import { useTranslation } from '@/hooks/use-translation';
import { useModel } from '@/context/ModelContext';
import { useModelLoader } from '@/hooks/use-model-loader';
import { useModelSearch } from '@/hooks/use-model-search';

interface ModelSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ModelSelectionDialog({ open, onOpenChange }: ModelSelectionDialogProps): React.JSX.Element {
  const { t } = useTranslation();
  const { selectedModel, setSelectedModel } = useModel();
  const [searchQuery, setSearchQuery] = useState('');

  const { models, isLoading, error } = useModelLoader(open);
  const filteredModels = useModelSearch({ models: models || [], searchQuery });

  const handleSelectModel = async (modelId: string) => {
    try {
      await setSelectedModel(modelId);
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to select model:', err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('selectModel')}</DialogTitle>
          <DialogDescription>
            {t('selectModelDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 min-h-0">
          <Input
            type="text"
            placeholder={t('searchModels')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">{t('loadingModels')}</div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-destructive">{error}</div>
            </div>
          )}

          {!isLoading && !error && (
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {filteredModels.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  {t('noModelsFound')}
                </div>
              ) : (
                filteredModels.map((model) => (
                  <ModelCard
                    key={model.id}
                    model={model}
                    isSelected={model.id === selectedModel}
                    onSelect={handleSelectModel}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

