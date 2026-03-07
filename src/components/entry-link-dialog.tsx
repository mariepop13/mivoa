'use client';

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useTranslation } from '@/hooks/use-translation';
import { useAllEntries } from '@/repositories/storage-provider';
import type { Entry } from '@/repositories/types';
import { format } from 'date-fns';
import { getEntryPreview, parseEntryDate } from '@/utils/entry-linking-utils';

interface EntryLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentEntryId: string | null;
  linkedEntryIds?: string[];
  onSelectEntries: (entryIds: string[]) => void;
}

export function EntryLinkDialog({
  open,
  onOpenChange,
  currentEntryId,
  linkedEntryIds = [],
  onSelectEntries,
}: EntryLinkDialogProps): React.JSX.Element {
  const { t } = useTranslation();
  const { data: allEntriesRaw, isLoading } = useAllEntries();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntryIds, setSelectedEntryIds] = useState<Set<string>>(new Set());

  const availableEntries = useMemo(() => {
    if (!allEntriesRaw) return [];

    return allEntriesRaw
      .filter((entry: Entry) => {
        if (entry.id === currentEntryId) return false;
        if (entry.isDraft) return false;
        if (linkedEntryIds.includes(entry.id)) return false;
        return true;
      })
      .sort((a: Entry, b: Entry) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [allEntriesRaw, currentEntryId, linkedEntryIds]);

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return availableEntries;

    const queryLower = searchQuery.toLowerCase();
    return availableEntries.filter((entry: Entry) => {
      const titleMatch = entry.title?.toLowerCase().includes(queryLower);
      const contentMatch = entry.content?.toLowerCase().includes(queryLower);
      const dateMatch = entry.date?.includes(queryLower);
      return titleMatch || contentMatch || dateMatch;
    });
  }, [availableEntries, searchQuery]);

  const handleToggleSelection = (entryId: string) => {
    setSelectedEntryIds((prev) => {
      const next = new Set(prev);
      if (next.has(entryId)) {
        next.delete(entryId);
      } else {
        next.add(entryId);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    if (selectedEntryIds.size > 0) {
      onSelectEntries(Array.from(selectedEntryIds));
      setSelectedEntryIds(new Set());
      setSearchQuery('');
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setSelectedEntryIds(new Set());
    setSearchQuery('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('selectEntryToLink')}</DialogTitle>
          <DialogDescription>
            {t('searchEntries')}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <label htmlFor="entry-search-input" className="sr-only">
            {t('searchEntries')}
          </label>
          <input
            id="entry-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchEntries')}
            className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-2 min-h-[200px]">
          {isLoading ? (
            <div className="text-center text-muted-foreground py-8">
              {t('loading')}
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              {t('noEntriesFound')}
            </div>
          ) : (
            filteredEntries.map((entry: Entry) => {
              const isSelected = selectedEntryIds.has(entry.id);
              return (
                <button
                  key={entry.id}
                  onClick={() => handleToggleSelection(entry.id)}
                  role="checkbox"
                  aria-checked={isSelected}
                  className={`w-full text-left p-4 rounded-lg border transition-all duration-200 ${
                    isSelected
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-card border-border hover:bg-accent hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 mt-1 w-4 h-4 rounded border-2 flex items-center justify-center ${
                      isSelected
                        ? 'bg-primary border-primary'
                        : 'border-border'
                    }`}>
                      {isSelected && (
                        <span className="text-primary-foreground text-xs">✓</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-foreground mb-1">
                        {entry.title || format(parseEntryDate(entry.date), 'PPP')}
                      </div>
                      <div className="text-xs text-muted-foreground mb-2">
                        {format(parseEntryDate(entry.date), 'PPP')}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {getEntryPreview(entry.content)}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-colors"
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={selectedEntryIds.size === 0}
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t('linkEntry')} {selectedEntryIds.size > 0 && `(${selectedEntryIds.size})`}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
