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

export function useViewMode({ selectedEntryId, selectedEntry }: UseViewModeParams): UseViewModeResult {
  const isDraftSelected = selectedEntry?.isDraft === true;
  const isConversationEntrySelected = selectedEntry?.conversationMode === true && selectedEntry?.isDraft !== true;
  const shouldShowTabs = isConversationEntrySelected && !isDraftSelected;

  const getInitialViewMode = (): 'chat' | 'summary' => {
    if (!selectedEntryId) {
      return 'chat';
    }
    if (isConversationEntrySelected) {
      return 'summary';
    }
    if (isDraftSelected) {
      return 'chat';
    }
    return 'chat';
  };

  const [viewMode, setViewMode] = useState<'chat' | 'summary'>(getInitialViewMode);
  const previousEntryIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (selectedEntryId && previousEntryIdRef.current !== selectedEntryId) {
      const newViewMode = isConversationEntrySelected ? 'summary' : 'chat';
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
  }, [isConversationEntrySelected, selectedEntryId]);

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

