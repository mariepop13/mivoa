'use client';

import { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useTranslation } from '@/hooks/use-translation';
import { useEntryTemplates, type EntryTemplate } from '@/hooks/use-entry-templates';
import { getTemplateDescription } from '@/utils/template-utils';
import { FileText, Heart, Brain, Calendar, Target } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface TemplatesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTemplateSelect: (template: EntryTemplate) => void;
}

export function TemplatesDialog({ open, onOpenChange, onTemplateSelect }: TemplatesDialogProps): React.JSX.Element {
  const { t } = useTranslation();
  const templates = useEntryTemplates();

  const handleSelectTemplate = (template: EntryTemplate) => {
    onTemplateSelect(template);
    onOpenChange(false);
  };

  const getDescription = useMemo(
    () => (templateId: string) => getTemplateDescription(templateId, t),
    [t]
  );

  const getTemplateIcon = (templateId: string): LucideIcon => {
    const icons: Record<string, LucideIcon> = {
      gratitude: Heart,
      reflection: Brain,
      daily: Calendar,
      goals: Target,
    };
    return icons[templateId] || FileText;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('selectTemplate')}</DialogTitle>
          <DialogDescription>
            {t('selectTemplateDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {templates.map((template) => {
            const Icon = getTemplateIcon(template.id);
            return (
              <button
                key={template.id}
                onClick={() => handleSelectTemplate(template)}
                className="w-full text-left p-4 rounded-lg border border-border bg-card hover:bg-accent hover:border-primary/50 transition-all duration-200 group"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground mb-1.5 group-hover:text-primary transition-colors">
                    {template.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {getDescription(template.id)}
                  </p>
                </div>
              </div>
            </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

