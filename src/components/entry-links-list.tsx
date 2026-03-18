'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from '@/hooks/use-translation';
import { useEntryLinking } from '@/hooks/use-entry-linking';
import { parseEntryDate, getEntryPreview } from '@/utils/entry-linking-utils';
import { format } from 'date-fns';
import { Link2, X } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { JournalEntryData } from '@/hooks/use-journal-entries';

interface EntryLinksListProps {
  entryId: string | null;
  linkedEntryIds?: string[];
  onNavigateToEntry: (entry: JournalEntryData & { id: string }) => void;
  onLinksUpdated?: () => void;
}

export function EntryLinksList({
  entryId,
  linkedEntryIds = [],
  onNavigateToEntry,
  onLinksUpdated,
}: EntryLinksListProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const { getLinkedEntries, unlinkEntry } = useEntryLinking();
  const [linkedEntries, setLinkedEntries] = useState<Array<JournalEntryData & { id: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [unlinkDialogOpen, setUnlinkDialogOpen] = useState(false);
  const [entryToUnlink, setEntryToUnlink] = useState<string | null>(null);

  const linkedEntryIdsKey = useMemo(() => {
    return linkedEntryIds.length > 0 ? linkedEntryIds.sort().join(',') : '';
  }, [linkedEntryIds]);

  useEffect(() => {
    if (!entryId || linkedEntryIds.length === 0) {
      setLinkedEntries([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    getLinkedEntries(entryId, linkedEntryIds)
      .then((entries) => {
        if (!cancelled) {
          setLinkedEntries(entries);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.error('Failed to load linked entries:', error);
          setLinkedEntries([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [entryId, linkedEntryIdsKey, getLinkedEntries]);

  const handleUnlinkClick = (e: React.MouseEvent, linkedEntryId: string) => {
    e.stopPropagation();
    setEntryToUnlink(linkedEntryId);
    setUnlinkDialogOpen(true);
  };

  const handleUnlinkConfirm = async () => {
    if (!entryId || !entryToUnlink) return;

    const previousEntries = [...linkedEntries];
    setLinkedEntries((prev) => prev.filter((entry) => entry.id !== entryToUnlink));

    try {
      await unlinkEntry(entryId, entryToUnlink);
      onLinksUpdated?.();
    } catch (error) {
      console.error('Failed to unlink entry:', error);
      setLinkedEntries(previousEntries);
    } finally {
      setUnlinkDialogOpen(false);
      setEntryToUnlink(null);
    }
  };

  if (!entryId || linkedEntryIds.length === 0) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-4 border-t border-border/60">
        <div className="text-sm text-muted-foreground">{t('loadingLinkedEntries')}</div>
      </div>
    );
  }

  if (linkedEntries.length === 0) {
    return null;
  }

  return (
    <>
      <div className="px-4 sm:px-6 lg:px-8 py-4 border-t border-border/60">
        <div className="flex items-center gap-2 mb-3">
          <Link2 className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">{t('linkedEntries')}</h3>
        </div>
        <div className="space-y-2">
          {linkedEntries.map((entry) => (
            <div
              key={entry.id}
              role="button"
              tabIndex={0}
              className="group relative p-3 rounded-lg border border-border bg-card hover:bg-accent transition-colors cursor-pointer"
              onClick={() => onNavigateToEntry(entry)}
              onKeyDown={(e) => {
                if (e.target !== e.currentTarget) return;
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavigateToEntry(entry); }
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground mb-1">
                    {entry.title || format(parseEntryDate(entry.date), 'PPP')}
                  </div>
                  {entry.title && (
                    <div className="text-xs text-muted-foreground mb-2">
                      {format(parseEntryDate(entry.date), 'PPP')}
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground">
                    {getEntryPreview(entry.content)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => handleUnlinkClick(e, entry.id)}
                  className="opacity-70 hover:opacity-100 transition-opacity p-1.5 hover:bg-destructive/20 rounded text-foreground/80 hover:text-destructive border border-border/50 hover:border-destructive/40"
                  aria-label={t('unlinkEntry')}
                >
                  <X className="h-4 w-4 stroke-[2.5]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AlertDialog open={unlinkDialogOpen} onOpenChange={setUnlinkDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('unlinkEntry')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('confirmUnlink')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnlinkConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('unlinkEntry')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

