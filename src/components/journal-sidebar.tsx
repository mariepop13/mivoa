'use client';

import { DatePicker } from '@/components/date-picker';
import { SettingsMenu } from '@/components/settings-menu';
import { UserMenu } from '@/components/user-menu';
import { TemplatesDialog } from '@/components/templates-dialog';
import { DraftDeleteButton } from '@/components/draft-delete-button';
import { DraftDeleteDialog } from '@/components/draft-delete-dialog';
import { DraftBulkActions } from '@/components/draft-bulk-actions';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { useDraftDeletion } from '@/hooks/use-draft-deletion';
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
  handleDeleteDraft?: (draftId: string) => Promise<void>;
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
  onDeleteDraft,
  isDeleting,
  deletedDraftIds,
  isSelectionMode,
  selectedIds,
  onToggleSelection,
}: {
  entries: (JournalEntryData & { id: string })[] | null;
  selectedEntryId: string | null;
  onEntrySelect: (entryId: string) => void;
  formatEntryTime: (entry: JournalEntryData & { id: string }) => string;
  t: (key: string) => string;
  onDeleteDraft?: (draftId: string, draftData: JournalEntryData & { id: string }) => void;
  isDeleting?: boolean;
  deletedDraftIds?: Set<string>;
  isSelectionMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelection?: (draftId: string) => void;
}): React.JSX.Element {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [draftToDelete, setDraftToDelete] = useState<(JournalEntryData & { id: string }) | null>(null);

  const handleDeleteClick = (e: React.MouseEvent, entry: JournalEntryData & { id: string }) => {
    e.stopPropagation();
    setDraftToDelete(entry);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (draftToDelete && onDeleteDraft) {
      onDeleteDraft(draftToDelete.id, draftToDelete);
    }
    setDeleteDialogOpen(false);
    setDraftToDelete(null);
  };

  if (!entries || entries.length === 0) {
    return (
      <div className="text-center text-muted-foreground text-sm py-8">
        {t('noEntriesYet')}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {entries.map((entry) => {
          const isDeleted = deletedDraftIds?.has(entry.id);
          const isDraft = entry.isDraft;
          const isSelected = selectedIds?.has(entry.id);
          
          return (
            <div
              key={entry.id}
              className={cn(
                'group relative transition-all duration-200',
                isDeleted && 'opacity-0 pointer-events-none'
              )}
            >
              <div
                className={cn(
                  'flex items-center gap-2 w-full px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                  selectedEntryId === entry.id && !isSelectionMode
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground border border-transparent',
                  isSelected && isSelectionMode && 'bg-primary/5 border-primary/10'
                )}
              >
                {isSelectionMode && isDraft && (
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onToggleSelection?.(entry.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
                <button
                  onClick={() => {
                    if (!isSelectionMode) {
                      onEntrySelect(entry.id);
                    } else if (isDraft) {
                      onToggleSelection?.(entry.id);
                    }
                  }}
                  className="flex-1 text-left"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium flex-1 min-w-0 truncate flex items-center gap-1.5">
                      {entry.subjectEmoji && (
                        <span className="flex-shrink-0" aria-hidden="true">{entry.subjectEmoji}</span>
                      )}
                      <span className="truncate">{entry.title || formatEntryTime(entry)}</span>
                      {isDraft && (
                        <span className="flex-shrink-0 text-xs px-1.5 py-0.5 bg-muted text-muted-foreground rounded border border-border">
                          {t('draft')}
                        </span>
                      )}
                    </div>
                  </div>
                  {entry.title && (
                    <div className="text-xs text-muted-foreground mt-1">{formatEntryTime(entry)}</div>
                  )}
                </button>
                {isDraft && onDeleteDraft && !isSelectionMode && (
                  <div
                    className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DraftDeleteButton
                      onClick={() => {
                        handleDeleteClick({} as React.MouseEvent, entry);
                      }}
                      isLoading={isDeleting && draftToDelete?.id === entry.id}
                      disabled={isDeleting}
                      variant="ghost"
                      size="sm"
                      aria-label={t('deleteDraft')}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {draftToDelete && (
        <DraftDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleConfirmDelete}
          draft={draftToDelete}
          isLoading={isDeleting}
        />
      )}
    </>
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
  handleDeleteDraft,
}: JournalSidebarProps): React.JSX.Element {
  const { t } = useTranslation();
  const [isTemplatesDialogOpen, setIsTemplatesDialogOpen] = useState(false);
  const [deletedDraftIds, setDeletedDraftIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const drafts = useMemo(() => {
    return entries?.filter(e => e.isDraft) || [];
  }, [entries]);

  const { deleteDraft, deleteDrafts, isDeleting } = useDraftDeletion({
    handleDeleteDraft: handleDeleteDraft || (async () => {}),
    selectedDate,
    onOptimisticUpdate: (draftId) => {
      setDeletedDraftIds(prev => new Set(prev).add(draftId));
    },
    onRestore: (draftId) => {
      setDeletedDraftIds(prev => {
        const next = new Set(prev);
        next.delete(draftId);
        return next;
      });
    },
  });

  const handleDeleteDraftClick = async (draftId: string, draftData: JournalEntryData & { id: string }) => {
    await deleteDraft(draftId, draftData);
  };

  const handleBulkDelete = async (draftIds: string[], draftsData: (JournalEntryData & { id: string })[]) => {
    await deleteDrafts(draftIds, draftsData);
    setSelectedIds(new Set());
    setIsSelectionMode(false);
  };

  const toggleSelection = (draftId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(draftId)) {
        next.delete(draftId);
      } else {
        next.add(draftId);
      }
      return next;
    });
  };

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

        {drafts.length > 0 && handleDeleteDraft && (
          <DraftBulkActions
            drafts={drafts}
            onDeleteSelected={handleBulkDelete}
            isDeleting={isDeleting}
            isSelectionMode={isSelectionMode}
            onSelectionModeChange={setIsSelectionMode}
            selectedIds={selectedIds}
            onSelectAll={() => {
              if (selectedIds.size === drafts.length) {
                setSelectedIds(new Set());
              } else {
                setSelectedIds(new Set(drafts.map(d => d.id)));
              }
            }}
          />
        )}

        <div className="flex-1 overflow-y-auto p-4">
          <EntriesList
            entries={entries}
            selectedEntryId={selectedEntryId}
            onEntrySelect={onEntrySelect}
            formatEntryTime={formatEntryTime}
            t={t}
            onDeleteDraft={handleDeleteDraft ? handleDeleteDraftClick : undefined}
            isDeleting={isDeleting}
            deletedDraftIds={deletedDraftIds}
            isSelectionMode={isSelectionMode}
            selectedIds={selectedIds}
            onToggleSelection={toggleSelection}
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

