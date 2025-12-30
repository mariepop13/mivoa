'use client';

import { useState, useEffect, useRef } from 'react';
import { JournalEntry } from '@/components/journal-entry';
import { JournalChat } from '@/components/journal-chat';
import { JournalMobileHeader } from '@/components/journal-mobile-header';
import { JournalViewTabs } from '@/components/journal-view-tabs';
import type { JournalEntryData } from '@/hooks/use-journal-entries';
import { Timestamp } from 'firebase/firestore';
import type { ChatMessage } from '@/ai/types/chat';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';

interface JournalMainContentProps {
  selectedDate: Date;
  selectedEntryId: string | null;
  selectedEntry: (JournalEntryData & { id: string }) | undefined;
  entries: (JournalEntryData & { id: string })[] | null;
  content: string;
  title: string;
  isSaving: boolean;
  lastSavedAt: Date | null;
  saveError: string | null;
  isGeneratingSummary: boolean;
  recentEntries: Array<{ content: string; title?: string; date: string }>;
  onContentChange: (content: string) => void;
  onSave: () => void;
  onDelete: () => Promise<void>;
  onSummarize: (conversationHistory: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>, draftId?: string | null) => Promise<void>;
  getEntryTitle: (
    entry: (JournalEntryData & { id: string }) | undefined,
    allEntries: (JournalEntryData & { id: string })[] | null
  ) => string;
  onSidebarToggle: () => void;
  isSidebarOpen: boolean;
  dateKey: string;
  handleSaveDraft: (messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>, draftId: string | null, entryId?: string | null) => Promise<string | null>;
  handleDeleteDraft: (draftId: string) => Promise<void>;
  draftForDate: (JournalEntryData & { id: string }) | null;
  conversationEntryForDate: (JournalEntryData & { id: string }) | null;
}

export function JournalMainContent({
  selectedDate,
  selectedEntryId,
  content,
  title,
  isSaving,
  lastSavedAt,
  saveError,
  isGeneratingSummary,
  recentEntries,
  onContentChange,
  onSave,
  onDelete,
  onSummarize,
  selectedEntry,
  entries,
  getEntryTitle,
  onSidebarToggle,
  isSidebarOpen,
  dateKey,
  handleSaveDraft,
  handleDeleteDraft,
  draftForDate,
}: JournalMainContentProps): React.JSX.Element {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<'chat' | 'summary'>('chat');
  const previousEntryIdRef = useRef<string | null>(null);
  
  const isDraftSelected = selectedEntry?.isDraft === true;
  const isConversationEntrySelected = selectedEntry?.conversationMode === true && selectedEntry?.isDraft !== true;
  const shouldShowTabs = isConversationEntrySelected && !isDraftSelected;
  
  useEffect(() => {
    if (selectedEntryId && previousEntryIdRef.current !== selectedEntryId) {
      if (isConversationEntrySelected) {
        setViewMode('summary');
      } else if (isDraftSelected) {
        setViewMode('chat');
      }
      previousEntryIdRef.current = selectedEntryId;
    } else if (!selectedEntryId) {
      setViewMode('chat');
      previousEntryIdRef.current = null;
    }
  }, [isConversationEntrySelected, isDraftSelected, selectedEntryId]);
  
  const shouldShowChat = !selectedEntryId || isDraftSelected || (isConversationEntrySelected && viewMode === 'chat');

  const getInitialConversation = () => {
    if (isDraftSelected && draftForDate) {
      return {
        messages: (draftForDate.conversationHistory || []).map((msg) => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp instanceof Timestamp ? msg.timestamp : new Date(msg.timestamp as string),
        })) as ChatMessage[],
        draftId: draftForDate.id,
        entryId: null as string | null,
      };
    }
    if (isConversationEntrySelected && selectedEntry) {
      return {
        messages: (selectedEntry.conversationHistory || []).map((msg) => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp instanceof Timestamp ? msg.timestamp : new Date(msg.timestamp as string),
        })) as ChatMessage[],
        draftId: null as string | null,
        entryId: selectedEntry.id,
      };
    }
    return null;
  };

  const initialConversation = getInitialConversation();

  const onDraftSaveWrapper = async (messages: ChatMessage[], draftId: string | null): Promise<string | null> => {
    const conversationHistory = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp instanceof Date ? msg.timestamp : (msg.timestamp instanceof Timestamp ? msg.timestamp.toDate() : new Date()),
    }));
    const entryId = initialConversation?.entryId || null;
    return handleSaveDraft(conversationHistory, draftId, entryId);
  };

  return (
    <div className="flex-1 flex flex-col bg-background">
      <JournalMobileHeader 
        title={getEntryTitle(selectedEntry, entries)}
        onSidebarToggle={onSidebarToggle}
        isSidebarOpen={isSidebarOpen}
      />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-4 sm:p-5 lg:p-8 w-full">
          {shouldShowTabs && (
            <div className="mb-4 sm:mb-5 lg:mb-6 flex items-center justify-center">
              <JournalViewTabs
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                className="w-full sm:w-auto"
              />
            </div>
          )}
          <div className={cn(
            "bg-card rounded-lg sm:rounded-xl border border-border shadow-sm flex flex-col",
            "transition-all duration-300 ease-in-out",
            shouldShowTabs 
              ? "min-h-[calc(100vh-12rem)] sm:min-h-[600px] lg:min-h-[650px]" 
              : "min-h-[calc(100vh-10rem)] sm:min-h-[500px] lg:min-h-[550px]"
          )}>
            <div 
              key={viewMode}
              className={cn(
                "flex-1 flex flex-col overflow-hidden",
                "transition-opacity duration-200 ease-in-out"
              )}
              role="tabpanel"
              id={shouldShowChat ? "chat-panel" : "summary-panel"}
              aria-labelledby={shouldShowChat ? "chat-tab" : "summary-tab"}
            >
              {shouldShowChat ? (
                <JournalChat
                  onSummarize={onSummarize}
                  isLoadingSummary={isGeneratingSummary}
                  dateKey={dateKey}
                  onDraftSave={onDraftSaveWrapper}
                  onDraftDelete={handleDeleteDraft}
                  initialDraft={initialConversation}
                />
              ) : (
                <JournalEntry
                  date={selectedDate}
                  content={content}
                  title={title}
                  onContentChange={onContentChange}
                  onSave={onSave}
                  onDelete={onDelete}
                  isLoading={isSaving}
                  isSaved={lastSavedAt !== null && !isSaving}
                  error={saveError}
                  hideDate={true}
                  canDelete={Boolean(selectedEntryId)}
                  recentEntries={recentEntries}
                  places={selectedEntry?.places}
                  characters={selectedEntry?.characters}
                  themes={selectedEntry?.themes}
                  themeEmojis={selectedEntry?.themeEmojis}
                  moods={selectedEntry?.moods}
                  moodEmojis={selectedEntry?.moodEmojis}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

