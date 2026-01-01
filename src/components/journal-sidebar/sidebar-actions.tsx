'use client';

import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EntryTemplate } from '@/hooks/use-entry-templates';

const ACTIVE_SCALE = 0.98;

interface SidebarActionsProps {
  isSaving: boolean;
  onNewEntry: () => void;
  onTemplateSelect?: (template: EntryTemplate) => void;
  setIsTemplatesDialogOpen: (open: boolean) => void;
  t: (key: string) => string;
}

export function SidebarActions({
  isSaving,
  onNewEntry,
  onTemplateSelect,
  setIsTemplatesDialogOpen,
  t,
}: SidebarActionsProps): React.JSX.Element {
  return (
    <div className="p-4 sm:p-6 border-b border-border space-y-2">
      <button
        onClick={onNewEntry}
        disabled={isSaving}
        className={cn(
          'w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg',
          'hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md',
          `active:scale-[${ACTIVE_SCALE}] flex items-center justify-center gap-2`
        )}
      >
        <span>+</span>
        <span>{t('newEntry')}</span>
      </button>
      {onTemplateSelect && (
        <button
          onClick={() => setIsTemplatesDialogOpen(true)}
          disabled={isSaving}
          className="w-full px-4 py-2.5 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium border border-border flex items-center justify-center gap-2"
        >
          <FileText className="h-4 w-4" />
          <span>{t('templates')}</span>
        </button>
      )}
    </div>
  );
}

