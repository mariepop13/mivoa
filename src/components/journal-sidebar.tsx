'use client';

import { TemplatesDialog } from '@/components/templates-dialog';
import { DraftBulkActions } from '@/components/draft-bulk-actions';
import { useState, useMemo } from 'react';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { useDraftDeletion } from '@/hooks/use-draft-deletion';
import type { JournalEntryData } from '@/hooks/use-journal-entries';
import type { EntryTemplate } from '@/hooks/use-entry-templates';
import { SidebarHeader } from './journal-sidebar/sidebar-header';
import { SidebarActions } from './journal-sidebar/sidebar-actions';
import { EntriesList } from './journal-sidebar/entries-list';

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
  handleDeleteDraft: (draftId: string) => Promise<void>;
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

  const drafts = useMemo(() => entries?.filter(e => e.isDraft) || [], [entries]);

  const { deleteDraft, deleteDrafts, isDeleting } = useDraftDeletion({
    handleDeleteDraft,
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

        {drafts.length > 0 && (
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
            onDeleteDraft={handleDeleteDraftClick}
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

