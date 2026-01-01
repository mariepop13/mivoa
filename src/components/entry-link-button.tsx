'use client';

import { useState } from 'react';
import { Link2 } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { useEntryLinking } from '@/hooks/use-entry-linking';
import { EntryLinkDialog } from './entry-link-dialog';

interface EntryLinkButtonProps {
  entryId: string | null;
  linkedEntryIds?: string[];
  onLinksUpdated?: () => void;
}

export function EntryLinkButton({
  entryId,
  linkedEntryIds = [],
  onLinksUpdated,
}: EntryLinkButtonProps): React.JSX.Element {
  const { t } = useTranslation();
  const { linkEntry } = useEntryLinking();
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSelectEntries = async (selectedEntryIds: string[]) => {
    if (!entryId) return;

    try {
      for (const selectedId of selectedEntryIds) {
        await linkEntry(entryId, selectedId);
      }
      onLinksUpdated?.();
    } catch (error) {
      console.error('Failed to link entries:', error);
    }
  };

  if (!entryId) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setDialogOpen(true)}
        className="flex-1 sm:flex-none px-4 py-2.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium active:scale-[0.98] border border-transparent hover:border-border flex items-center justify-center gap-2"
      >
        <Link2 className="h-4 w-4" />
        <span className="hidden sm:inline">{t('linkEntry')}</span>
      </button>

      <EntryLinkDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        currentEntryId={entryId}
        linkedEntryIds={linkedEntryIds}
        onSelectEntries={handleSelectEntries}
      />
    </>
  );
}

