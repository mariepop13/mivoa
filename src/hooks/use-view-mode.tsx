import { useState, useEffect, useRef, startTransition } from 'react';
import type { JournalEntryData } from './use-journal-entries';

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
  const isDraftSelected = selectedEntry?.isDraft === true;
  const isConversationEntrySelected = selectedEntry?.conversationMode === true && selectedEntry?.isDraft !== true;
  const shouldShowTabs = isConversationEntrySelected && !isDraftSelected;

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

