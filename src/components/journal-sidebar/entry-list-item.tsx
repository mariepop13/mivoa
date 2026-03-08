'use client';

import { Link2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { DraftDeleteButton } from '@/components/draft-delete-button';
import { cn } from '@/lib/utils';
import type { JournalEntryData } from '@/hooks/use-journal-entries';
import { getEntryKind } from '@/utils/entry-kind';
import { getEntryItemClassName, handleEntryClick } from './utils';

interface EntryListItemProps {
  entry: JournalEntryData & { id: string };
  selectedEntryId: string | null;
  formatEntryTime: (entry: JournalEntryData & { id: string }) => string;
  t: (key: string) => string;
  isSelectionMode: boolean | undefined;
  selectedIds?: Set<string>;
  onEntrySelect: (entryId: string) => void;
  onToggleSelection?: (draftId: string) => void;
  onDeleteDraft?: (draftId: string, draftData: JournalEntryData & { id: string }) => void;
  isDeleting?: boolean;
  deletedDraftIds?: Set<string>;
  draftToDelete?: (JournalEntryData & { id: string }) | null;
  onDeleteClick: (entry: JournalEntryData & { id: string }) => void;
}

export function EntryListItem({
  entry,
  selectedEntryId,
  formatEntryTime,
  t,
  isSelectionMode,
  selectedIds,
  onEntrySelect,
  onToggleSelection,
  onDeleteDraft,
  isDeleting,
  deletedDraftIds,
  draftToDelete,
  onDeleteClick,
}: EntryListItemProps): React.JSX.Element {
  const isDeleted = deletedDraftIds?.has(entry.id);
  const isDraft = getEntryKind(entry) === 'draft';
  const isSelected = selectedIds?.has(entry.id) ?? false;
  const className = getEntryItemClassName(selectedEntryId, entry.id, isSelectionMode ?? false, isSelected);

  return (
    <div
      className={cn(
        'group relative transition-all duration-200',
        isDeleted && 'opacity-0 pointer-events-none'
      )}
    >
      <div className={cn('flex items-center gap-2 w-full px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200', className)}>
        {isSelectionMode && isDraft && (
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelection?.(entry.id)}
            onClick={(e) => e.stopPropagation()}
          />
        )}
        <button
          onClick={() => {
            const selectionMode = isSelectionMode ?? false;
            const draftStatus = Boolean(isDraft);
            handleEntryClick(selectionMode, draftStatus, entry.id, onEntrySelect, onToggleSelection);
          }}
          className="flex-1 min-w-0 text-left"
        >
          <div className="flex items-center justify-between gap-2 min-w-0">
            <div className="font-medium flex-1 min-w-0 flex items-center gap-1.5 overflow-hidden">
              {entry.subjectEmoji && (
                <span className="flex-shrink-0" aria-hidden="true">{entry.subjectEmoji}</span>
              )}
              <span className="truncate min-w-0">{entry.title || formatEntryTime(entry)}</span>
              {isDraft && (
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
        {isDraft && onDeleteDraft && !isSelectionMode && (
          <div
            className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <DraftDeleteButton
              onClick={() => onDeleteClick(entry)}
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
}

