import { useCallback } from 'react';
import type { useJournalEntries } from './use-journal-entries';

interface UseJournalHandlersParams {
  journalEntries: ReturnType<typeof useJournalEntries>;
  setIsSidebarOpen: (open: boolean) => void;
}

interface UseJournalHandlersResult {
  handleContentChange: (newContent: string) => void;
  handleSave: () => void;
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

  const handleSave = useCallback(() => {
    if (journalEntries.selectedEntryId) {
      journalEntries.saveEntry(journalEntries.content);
    } else {
      journalEntries.createNewEntry(journalEntries.content);
    }
  }, [journalEntries]);

  const handleEntrySelect = useCallback(
    (entryId: string) => {
      journalEntries.setSelectedEntryId(entryId);
      setIsSidebarOpen(false);
    },
    [journalEntries, setIsSidebarOpen]
  );

  const handleNewEntry = useCallback(() => {
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

