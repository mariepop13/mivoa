'use client';

import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslation } from '@/hooks/use-translation';
import type { JournalEntryData } from '@/hooks/use-journal-entries';

interface DraftBulkActionsProps {
  drafts: (JournalEntryData & { id: string })[];
  onDeleteSelected: (draftIds: string[], draftsData: (JournalEntryData & { id: string })[]) => void;
  isDeleting?: boolean;
  isSelectionMode: boolean;
  onSelectionModeChange: (mode: boolean) => void;
  selectedIds: Set<string>;
  onSelectAll: () => void;
}

export function DraftBulkActions({
  drafts,
  onDeleteSelected,
  isDeleting = false,
  isSelectionMode,
  onSelectionModeChange,
  selectedIds,
  onSelectAll,
}: DraftBulkActionsProps): React.JSX.Element {
  const { t } = useTranslation();

  const handleDeleteSelected = useCallback(() => {
    const selectedDrafts = drafts.filter(d => selectedIds.has(d.id));
    onDeleteSelected(
      selectedDrafts.map(d => d.id),
      selectedDrafts
    );
  }, [drafts, selectedIds, onDeleteSelected]);

  if (!isSelectionMode) {
    return (
      <div className="p-4 border-b border-border">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onSelectionModeChange(true)}
          className="w-full"
        >
          {t('selectMultipleDrafts')}
        </Button>
      </div>
    );
  }

  const selectedCount = selectedIds.size;
  const allSelected = selectedCount === drafts.length && drafts.length > 0;

  return (
    <div className="p-4 border-b border-border space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={allSelected}
            onCheckedChange={onSelectAll}
            id="select-all-drafts"
          />
          <label
            htmlFor="select-all-drafts"
            className="text-sm font-medium cursor-pointer"
          >
            {t('selectAllDrafts')}
          </label>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            onSelectionModeChange(false);
          }}
        >
          {t('cancel')}
        </Button>
      </div>
      {selectedCount > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {selectedCount === 1 
              ? t('selectedDraft').replace('{{count}}', selectedCount.toString())
              : t('selectedDrafts').replace('{{count}}', selectedCount.toString())
            }
          </span>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleDeleteSelected}
            disabled={isDeleting || selectedCount === 0}
          >
            {t('deleteSelectedDrafts')}
          </Button>
        </div>
      )}
    </div>
  );
}

