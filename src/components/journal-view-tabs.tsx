'use client';

import { MessageSquare, FileText } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import type { EntryKind } from '@/utils/entry-kind';

interface JournalViewTabsProps {
  viewMode: 'chat' | 'summary';
  onViewModeChange: (mode: 'chat' | 'summary') => void;
  className?: string;
  entryKind?: EntryKind;
}

function EntryStatusBadge({ entryKind }: { entryKind: EntryKind }): React.JSX.Element | null {
  if (entryKind === 'draft') {
    return (
      <span
        data-testid="entry-status-badge"
        className="ml-1.5 inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
      >
        brouillon
      </span>
    );
  }
  if (entryKind === 'conversation') {
    return (
      <span
        data-testid="entry-status-badge"
        className="ml-1.5 inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-secondary/20 text-secondary dark:bg-secondary/20 dark:text-secondary"
      >
        conversation
      </span>
    );
  }
  return null;
}

export function JournalViewTabs({
  viewMode,
  onViewModeChange,
  className,
  entryKind,
}: JournalViewTabsProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "flex items-center gap-1 p-1 sm:p-1.5 bg-muted/50 rounded-lg sm:rounded-lg border border-border/50",
        className
      )}
      role="tablist"
      aria-label="View mode selection"
    >
      <button
        type="button"
        role="tab"
        id="summary-tab"
        aria-selected={viewMode === 'summary'}
        aria-controls="summary-panel"
        onClick={() => onViewModeChange('summary')}
        className={cn(
          "flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-md text-sm font-medium transition-all duration-200 flex-1 sm:flex-initial",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          viewMode === 'summary'
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-background/50"
        )}
      >
        <FileText className="h-4 w-4 shrink-0" />
        <span className="whitespace-nowrap">{t('summary')}</span>
      </button>
      <button
        type="button"
        role="tab"
        id="chat-tab"
        aria-selected={viewMode === 'chat'}
        aria-controls="chat-panel"
        onClick={() => onViewModeChange('chat')}
        className={cn(
          "flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-md text-sm font-medium transition-all duration-200 flex-1 sm:flex-initial",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          viewMode === 'chat'
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-background/50"
        )}
      >
        <MessageSquare className="h-4 w-4 shrink-0" />
        <span className="whitespace-nowrap">{t('conversation')}</span>
        {entryKind && entryKind !== 'text' && <EntryStatusBadge entryKind={entryKind} />}
      </button>
    </div>
  );
}
