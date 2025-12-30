import { useCallback } from 'react';
import type { useJournalEntries } from './use-journal-entries';

interface UseJournalHandlersParams {
  journalEntries: ReturnType<typeof useJournalEntries>;
  setIsSidebarOpen: (open: boolean) => void;
}

interface UseJournalHandlersResult {
  handleContentChange: (newContent: string) => void;
  handleSave: () => Promise<void>;
  handleEntrySelect: (entryId: string) => void;
  handleNewEntry: () => void;
}

export function useJournalHandlers({
  journalEntries,
  setIsSidebarOpen,
}: UseJournalHandlersParams): UseJournalHandlersResult {
  const handleContentChange = useCallback(
    (newContent: string) => {
      journalEntries.setContent(newContent);
    },
    [journalEntries]
  );

  const handleSave = useCallback(async () => {
    try {
      if (journalEntries.selectedEntryId) {
        await journalEntries.saveEntry(journalEntries.content);
      } else {
        await journalEntries.createNewEntry(journalEntries.content);
      }
    } catch (error) {
      console.error('Error in handleSave:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save entry';
      console.error('Save operation failed:', errorMessage);
    }
  }, [journalEntries]);

  const handleEntrySelect = useCallback(
    (entryId: string) => {
      journalEntries.setSelectedEntryId(entryId);
      setIsSidebarOpen(false);
    },
    [journalEntries, setIsSidebarOpen]
  );

  const handleNewEntry = useCallback(async () => {
    if (journalEntries.draftForDate) {
      try {
        await journalEntries.handleDeleteDraft(journalEntries.draftForDate.id);
      } catch (error) {
        console.error('Failed to delete draft when creating new entry:', error);
      }
    }
    journalEntries.setSelectedEntryId(null);
    setIsSidebarOpen(false);
  }, [journalEntries, setIsSidebarOpen]);

  return {
    handleContentChange,
    handleSave,
    handleEntrySelect,
    handleNewEntry,
  };
}

