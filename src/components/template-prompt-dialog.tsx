'use client';

import { useState, useEffect, useContext, useRef, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { OpenRouterApiKeyContext } from '@/context/OpenRouterApiKeyContext';
import { LanguageContext } from '@/context/LanguageContext';
import { useModel } from '@/context/ModelContext';
import { generateTemplatePrompt } from '@/ai/services/journal-prompt-service';
import { useTranslation } from '@/hooks/use-translation';
import { getTemplateDescription } from '@/utils/template-utils';
import type { EntryTemplate } from '@/hooks/use-entry-templates';

interface TemplatePromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: EntryTemplate | null;
  onUsePrompt: (prompt: string) => void;
}

export function TemplatePromptDialog({
  open,
  onOpenChange,
  template,
  onUsePrompt,
}: TemplatePromptDialogProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const { apiKey } = useContext(OpenRouterApiKeyContext);
  const { language } = useContext(LanguageContext);
  const { selectedModel } = useModel();
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const templateIdRef = useRef<string | null>(null);

  const lang = (language || 'en') as 'en' | 'fr';

  useEffect(() => {
    const generatePrompt = async () => {
      const currentTemplate = template;
      if (!currentTemplate || !apiKey) {
        return;
      }

      setIsGenerating(true);
      setError(null);

      try {
        const prompt = await generateTemplatePrompt({
          template: currentTemplate,
          apiKey,
          language: lang,
          model: selectedModel,
        });
        setGeneratedPrompt(prompt);
      } catch (err) {
        console.error('Failed to generate template prompt:', err);
        setError(err instanceof Error ? err.message : t('error'));
      } finally {
        setIsGenerating(false);
      }
    };

    const currentTemplateId = template?.id ?? null;
    const hasTemplateChanged = templateIdRef.current !== currentTemplateId;

    if (open && template) {
      if (!apiKey) {
        setError(t('openRouterApiKeyRequired'));
        setIsGenerating(false);
      } else if (hasTemplateChanged) {
        templateIdRef.current = currentTemplateId;
        generatePrompt();
      }
    } else if (!open) {
      setGeneratedPrompt('');
      setError(null);
      templateIdRef.current = null;
    }
  }, [open, template?.id, apiKey, lang, selectedModel, t]);

  const handleUsePrompt = () => {
    if (generatedPrompt) {
      onUsePrompt(generatedPrompt);
      onOpenChange(false);
    }
  };

  const templateDescription = useMemo(() => {
    if (!template) return '';
    return getTemplateDescription(template.id, t);
  }, [template?.id, t]);

  if (!template) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('templatePromptTitle')}</DialogTitle>
          <DialogDescription>
            {t('templatePromptDescription').replace('{{templateName}}', template.name.replace(/[<>]/g, ''))}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isGenerating ? (
            <div className="flex items-center justify-center py-8 gap-3">
              <span className="inline-block w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <div className="text-sm text-muted-foreground">
                {t('generatingTemplatePrompt')}
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-destructive">{error}</div>
            </div>
          ) : generatedPrompt ? (
            <div className="space-y-3">
              <div className="bg-muted rounded-lg p-4 border border-border">
                <p className="text-base text-foreground font-medium">{templateDescription}</p>
              </div>
              <div className="bg-accent/50 rounded-lg p-4 border border-border">
                <p className="text-sm text-muted-foreground mb-2">{t('generatedPrompt')}</p>
                <p className="text-sm text-foreground italic">&quot;{generatedPrompt}&quot;</p>
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isGenerating}
          >
            {t('cancel')}
          </Button>
          <Button
            onClick={handleUsePrompt}
            disabled={isGenerating || !generatedPrompt}
          >
            {t('useThisPrompt')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

