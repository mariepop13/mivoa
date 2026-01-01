'use client';

import { useState } from 'react';
import { DraftDeleteDialog } from '@/components/draft-delete-dialog';
import type { JournalEntryData } from '@/hooks/use-journal-entries';
import { EntryListItem } from './entry-list-item';

interface EntriesListProps {
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
}

export function EntriesList({
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
}: EntriesListProps): React.JSX.Element {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [draftToDelete, setDraftToDelete] = useState<(JournalEntryData & { id: string }) | null>(null);

  const handleDeleteClick = (entry: JournalEntryData & { id: string }) => {
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
        {entries.map((entry) => (
          <EntryListItem
            key={entry.id}
            entry={entry}
            selectedEntryId={selectedEntryId}
            formatEntryTime={formatEntryTime}
            t={t}
            isSelectionMode={isSelectionMode ?? false}
            selectedIds={selectedIds}
            onEntrySelect={onEntrySelect}
            onToggleSelection={onToggleSelection}
            onDeleteDraft={onDeleteDraft}
            isDeleting={isDeleting}
            deletedDraftIds={deletedDraftIds}
            draftToDelete={draftToDelete}
            onDeleteClick={handleDeleteClick}
          />
        ))}
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

