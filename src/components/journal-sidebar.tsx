'use client';

import { DatePicker } from '@/components/date-picker';
import { SettingsMenu } from '@/components/settings-menu';
import { UserMenu } from '@/components/user-menu';
import { TemplatesDialog } from '@/components/templates-dialog';
import { FileText, Link2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import type { JournalEntryData } from '@/hooks/use-journal-entries';
import type { EntryTemplate } from '@/hooks/use-entry-templates';

interface JournalSidebarProps {
  selectedDate: Date;
  entries: (JournalEntryData & { id: string })[] | null;
  selectedEntryId: string | null;
  isSidebarOpen: boolean;
  isSaving: boolean;
  onClose: () => void;
  onNewEntry: () => void;
  onEntrySelect: (entryId: string) => void;
  formatEntryTime: (entry: JournalEntryData & { id: string }) => string;
  onTemplateSelect?: (template: EntryTemplate) => void;
  onDateChange: (date: Date) => void;
}

function SidebarHeader({
  selectedDate,
  entries,
  onDateChange,
  onClose,
  t,
}: {
  selectedDate: Date;
  entries: (JournalEntryData & { id: string })[] | null;
  onDateChange: (date: Date) => void;
  onClose: () => void;
  t: (key: string) => string;
}): React.JSX.Element {
  return (
    <div className="p-4 sm:p-6 border-b border-border">
      <div className="flex items-start justify-between mb-2 gap-2 flex-wrap">
        <div className="flex-1 min-w-0 max-w-full">
          <DatePicker value={selectedDate} onChange={onDateChange} />
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <UserMenu />
          <SettingsMenu />
          <button
            onClick={onClose}
            aria-label={t('close')}
            className="lg:hidden p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <span className="text-2xl">×</span>
          </button>
        </div>
      </div>
      {entries && entries.length > 0 && (
        <p className="text-xs sm:text-sm text-muted-foreground">
          {entries.length} {entries.length === 1 ? t('entry') : t('entries')} {t('today')}
        </p>
      )}
    </div>
  );
}

function SidebarActions({
  isSaving,
  onNewEntry,
  onTemplateSelect,
  setIsTemplatesDialogOpen,
  t,
}: {
  isSaving: boolean;
  onNewEntry: () => void;
  onTemplateSelect?: (template: EntryTemplate) => void;
  setIsTemplatesDialogOpen: (open: boolean) => void;
  t: (key: string) => string;
}): React.JSX.Element {
  return (
    <div className="p-4 sm:p-6 border-b border-border space-y-2">
      <button
        onClick={onNewEntry}
        disabled={isSaving}
        className={cn(
          'w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg',
          'hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md',
          'active:scale-[0.98] flex items-center justify-center gap-2'
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

function EntriesList({
  entries,
  selectedEntryId,
  onEntrySelect,
  formatEntryTime,
  t,
}: {
  entries: (JournalEntryData & { id: string })[] | null;
  selectedEntryId: string | null;
  onEntrySelect: (entryId: string) => void;
  formatEntryTime: (entry: JournalEntryData & { id: string }) => string;
  t: (key: string) => string;
}): React.JSX.Element {
  if (!entries || entries.length === 0) {
    return (
      <div className="text-center text-muted-foreground text-sm py-8">
        {t('noEntriesYet')}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <button
          key={entry.id}
          onClick={() => onEntrySelect(entry.id)}
          className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
            selectedEntryId === entry.id
              ? 'bg-primary/10 text-primary border border-primary/20'
              : 'bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground border border-transparent'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="font-medium flex-1 min-w-0 truncate flex items-center gap-1.5">
              {entry.subjectEmoji && (
                <span className="flex-shrink-0" aria-hidden="true">{entry.subjectEmoji}</span>
              )}
              <span className="truncate">{entry.title || formatEntryTime(entry)}</span>
              {entry.isDraft && (
                <span className="flex-shrink-0 text-xs px-1.5 py-0.5 bg-muted text-muted-foreground rounded border border-border">
                  {t('draft')}
                </span>
              )}
            </div>
            {entry.linkedEntryIds && entry.linkedEntryIds.length > 0 && (
              <div 
                className="flex items-center gap-1 flex-shrink-0"
                aria-label={`${entry.linkedEntryIds.length} ${entry.linkedEntryIds.length === 1 ? t('linkedEntry') : t('linkedEntries')}`}
              >
                <Link2 className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                <span className="text-xs text-muted-foreground">{entry.linkedEntryIds.length}</span>
              </div>
            )}
          </div>
          {entry.title && (
            <div className="text-xs text-muted-foreground mt-1">{formatEntryTime(entry)}</div>
          )}
        </button>
      ))}
    </div>
  );
}

export function JournalSidebar({
  selectedDate,
  entries,
  selectedEntryId,
  isSidebarOpen,
  isSaving,
  onClose,
  onNewEntry,
  onEntrySelect,
  formatEntryTime,
  onTemplateSelect,
  onDateChange,
}: JournalSidebarProps): React.JSX.Element {
  const { t } = useTranslation();
  const [isTemplatesDialogOpen, setIsTemplatesDialogOpen] = useState(false);

  return (
    <>
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      <div
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 w-80 border-r border-border bg-card',
          'flex flex-col transform transition-transform duration-300 ease-in-out',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <SidebarHeader
          selectedDate={selectedDate}
          entries={entries}
          onDateChange={onDateChange}
          onClose={onClose}
          t={t}
        />
        
        <SidebarActions
          isSaving={isSaving}
          onNewEntry={onNewEntry}
          onTemplateSelect={onTemplateSelect}
          setIsTemplatesDialogOpen={setIsTemplatesDialogOpen}
          t={t}
        />

        <div className="flex-1 overflow-y-auto p-4">
          <EntriesList
            entries={entries}
            selectedEntryId={selectedEntryId}
            onEntrySelect={onEntrySelect}
            formatEntryTime={formatEntryTime}
            t={t}
          />
        </div>
      </div>
      {onTemplateSelect && (
        <TemplatesDialog
          open={isTemplatesDialogOpen}
          onOpenChange={setIsTemplatesDialogOpen}
          onTemplateSelect={onTemplateSelect}
        />
      )}
    </>
  );
}

