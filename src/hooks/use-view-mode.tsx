import { useState, useEffect, useRef, startTransition } from 'react';
import type { JournalEntryData } from './use-journal-entries';
import { getEntryKind } from '@/utils/entry-kind';

interface UseViewModeParams {
  selectedEntryId: string | null;
  selectedEntry: (JournalEntryData & { id: string }) | undefined;
}

interface UseViewModeResult {
  viewMode: 'chat' | 'summary';
  setViewMode: (mode: 'chat' | 'summary') => void;
  isDraftSelected: boolean;
  isConversationEntrySelected: boolean;
  shouldShowTabs: boolean;
  shouldShowChat: boolean;
}

function calculateViewMode(selectedEntryId: string | null): 'chat' | 'summary' {
  if (!selectedEntryId) {
    return 'chat';
  }
  return 'summary';
}

export function useViewMode({ selectedEntryId, selectedEntry }: UseViewModeParams): UseViewModeResult {
  const entryKind = selectedEntry ? getEntryKind(selectedEntry) : null;
  const isDraftSelected = entryKind === 'draft';
  const isConversationEntrySelected = entryKind === 'conversation';
  const shouldShowTabs = entryKind === 'conversation';

  const [viewMode, setViewMode] = useState<'chat' | 'summary'>(() =>
    calculateViewMode(selectedEntryId)
  );
  const previousEntryIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (selectedEntryId && previousEntryIdRef.current !== selectedEntryId) {
      const newViewMode = calculateViewMode(selectedEntryId);
      startTransition(() => {
        setViewMode(newViewMode);
      });
      previousEntryIdRef.current = selectedEntryId;
    } else if (!selectedEntryId) {
      startTransition(() => {
        setViewMode('chat');
      });
      previousEntryIdRef.current = null;
    }
  }, [selectedEntryId]);

  const shouldShowChat = !selectedEntryId || isDraftSelected || (isConversationEntrySelected && viewMode === 'chat');

  return {
    viewMode,
    setViewMode,
    isDraftSelected,
    isConversationEntrySelected,
    shouldShowTabs,
    shouldShowChat,
  };
}

