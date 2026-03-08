'use client';

import { JournalEntry } from '@/components/journal-entry';
import { JournalChat } from '@/components/journal-chat';
import { JournalMobileHeader } from '@/components/journal-mobile-header';
import { JournalViewTabs } from '@/components/journal-view-tabs';
import type { JournalEntryData } from '@/hooks/use-journal-entries';
import { useViewMode } from '@/hooks/use-view-mode';
import { Timestamp } from 'firebase/firestore';
import type { ChatMessage } from '@/ai/types/chat';
import { cn } from '@/lib/utils';
import { convertTimestampToDate } from '@/utils/journal-utils';

function mapConversationHistory(
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Timestamp | Date | string;
  }> | undefined
): ChatMessage[] {
  if (!conversationHistory) {
    return [];
  }
  return conversationHistory.map((msg) => ({
    role: msg.role,
    content: msg.content,
    timestamp: convertTimestampToDate(msg.timestamp),
  }));
}

export interface EntryState {
  selectedDate: Date;
  selectedEntryId: string | null;
  selectedEntry: (JournalEntryData & { id: string }) | undefined;
  selectedEntryData: JournalEntryData | null;
  entries: (JournalEntryData & { id: string })[] | null;
  content: string;
  title: string;
  recentEntries: Array<{ content: string; title?: string; date: string }>;
  linksVersion: number;
}

export interface EntryActions {
  onContentChange: (content: string) => void;
  onSave: () => void;
  onDelete: () => Promise<void>;
  onChangeDate?: (date: Date) => Promise<void>;
  onNavigateToEntry?: (entry: JournalEntryData & { id: string }) => void;
  onLinksUpdated?: () => void;
}

export interface SaveState {
  isSaving: boolean;
  lastSavedAt: Date | null;
  saveError: string | null;
}

export interface ConversationState {
  isGeneratingSummary: boolean;
  onSummarize: (conversationHistory: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>, draftId?: string | null) => Promise<void>;
  handleSaveDraft: (messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>, draftId: string | null, entryId?: string | null) => Promise<string | null>;
  handleDeleteDraft: (draftId: string) => Promise<void>;
  conversationEntryForDate: (JournalEntryData & { id: string }) | null;
}

interface JournalMainContentProps {
  entry: EntryState;
  actions: EntryActions;
  save: SaveState;
  conversation: ConversationState;
  dateKey: string;
  getEntryTitle: (
    entry: (JournalEntryData & { id: string }) | undefined,
    allEntries: (JournalEntryData & { id: string })[] | null
  ) => string;
  onSidebarToggle: () => void;
  isSidebarOpen: boolean;
}

interface InitialConversation {
  messages: ChatMessage[];
  draftId: string | null;
  entryId: string | null;
}

function getInitialConversation(
  isDraftSelected: boolean,
  isConversationEntrySelected: boolean,
  selectedEntry: (JournalEntryData & { id: string }) | undefined
): InitialConversation | null {
  if (!selectedEntry) {
    return null;
  }

  const messages = mapConversationHistory(selectedEntry.conversationHistory);

  if (isDraftSelected) {
    return { messages, draftId: selectedEntry.id, entryId: null };
  }

  if (isConversationEntrySelected) {
    return { messages, draftId: null, entryId: selectedEntry.id };
  }

  return null;
}

function createDraftSaveWrapper(
  handleSaveDraft: ConversationState['handleSaveDraft'],
  initialConversation: InitialConversation | null
) {
  return async (messages: ChatMessage[], draftId: string | null): Promise<string | null> => {
    const conversationHistory = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
      timestamp: convertTimestampToDate(msg.timestamp),
    }));
    const entryId = initialConversation?.entryId || null;
    return handleSaveDraft(conversationHistory, draftId, entryId);
  };
}

function getCardClassName(shouldShowTabs: boolean): string {
  const baseClasses =
    "bg-card rounded-lg sm:rounded-xl border border-border shadow-sm flex flex-col transition-all duration-300 ease-in-out";
  const minHeightClasses = shouldShowTabs
    ? "min-h-[calc(100vh-12rem)] sm:min-h-[600px] lg:min-h-[650px]"
    : "min-h-[calc(100vh-10rem)] sm:min-h-[500px] lg:min-h-[550px]";
  return cn(baseClasses, minHeightClasses);
}

interface ChatContentProps {
  onSummarize: ConversationState['onSummarize'];
  isGeneratingSummary: boolean;
  dateKey: string;
  onDraftSaveWrapper: (messages: ChatMessage[], draftId: string | null) => Promise<string | null>;
  handleDeleteDraft: ConversationState['handleDeleteDraft'];
  initialConversation: InitialConversation | null;
  setViewMode: (mode: 'chat' | 'summary') => void;
  selectedEntry: (JournalEntryData & { id: string }) | undefined;
}

function ChatContent({
  onSummarize,
  isGeneratingSummary,
  dateKey,
  onDraftSaveWrapper,
  handleDeleteDraft,
  initialConversation,
  setViewMode,
  selectedEntry,
}: ChatContentProps): React.JSX.Element {
  return (
    <JournalChat
      onSummarize={onSummarize}
      isLoadingSummary={isGeneratingSummary}
      dateKey={dateKey}
      onDraftSave={onDraftSaveWrapper}
      onDraftDelete={handleDeleteDraft}
      initialDraft={initialConversation}
      onViewModeChange={setViewMode}
      draftData={selectedEntry?.isDraft ? selectedEntry : null}
    />
  );
}

interface EntryContentProps {
  selectedDate: Date;
  content: string;
  title: string;
  onContentChange: (content: string) => void;
  onSave: () => void;
  onDelete: () => Promise<void>;
  onChangeDate?: (date: Date) => Promise<void>;
  isSaving: boolean;
  lastSavedAt: Date | null;
  saveError: string | null;
  selectedEntryId: string | null;
  selectedEntry: (JournalEntryData & { id: string }) | undefined;
  selectedEntryData: JournalEntryData | null;
  recentEntries: Array<{ content: string; title?: string; date: string }>;
  onNavigateToEntry?: (entry: JournalEntryData & { id: string }) => void;
  onLinksUpdated?: () => void;
}

function EntryContent({
  selectedDate,
  content,
  title,
  onContentChange,
  onSave,
  onDelete,
  onChangeDate,
  isSaving,
  lastSavedAt,
  saveError,
  selectedEntryId,
  selectedEntry,
  selectedEntryData,
  recentEntries,
  onNavigateToEntry,
  onLinksUpdated,
}: EntryContentProps): React.JSX.Element {
  return (
    <JournalEntry
      date={selectedDate}
      content={content}
      title={title}
      onContentChange={onContentChange}
      onSave={onSave}
      onDelete={onDelete}
      onChangeDate={onChangeDate}
      isLoading={isSaving}
      isSaved={lastSavedAt !== null && !isSaving}
      error={saveError}
      hideDate={false}
      canDelete={Boolean(selectedEntryId)}
      recentEntries={recentEntries}
      places={selectedEntry?.places}
      characters={selectedEntry?.characters}
      themes={selectedEntry?.themes}
      themeEmojis={selectedEntry?.themeEmojis}
      moods={selectedEntry?.moods}
      moodEmojis={selectedEntry?.moodEmojis}
      entryId={selectedEntryId}
      linkedEntryIds={selectedEntryData?.linkedEntryIds || selectedEntry?.linkedEntryIds}
      onNavigateToEntry={onNavigateToEntry}
      onLinksUpdated={onLinksUpdated}
    />
  );
}

export function JournalMainContent({
  entry,
  actions,
  save,
  conversation,
  dateKey,
  getEntryTitle,
  onSidebarToggle,
  isSidebarOpen,
}: JournalMainContentProps): React.JSX.Element {
  const {
    selectedDate,
    selectedEntryId,
    selectedEntry,
    selectedEntryData,
    entries,
    content,
    title,
    recentEntries,
  } = entry;

  const {
    onContentChange,
    onSave,
    onDelete,
    onChangeDate,
    onNavigateToEntry,
    onLinksUpdated,
  } = actions;

  const { isSaving, lastSavedAt, saveError } = save;

  const {
    isGeneratingSummary,
    onSummarize,
    handleSaveDraft,
    handleDeleteDraft,
  } = conversation;

  const {
    viewMode,
    setViewMode,
    isDraftSelected,
    isConversationEntrySelected,
    shouldShowTabs,
    shouldShowChat,
  } = useViewMode({
    selectedEntryId,
    selectedEntry,
  });

  const initialConversation = getInitialConversation(isDraftSelected, isConversationEntrySelected, selectedEntry);
  const onDraftSaveWrapper = createDraftSaveWrapper(handleSaveDraft, initialConversation);

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
          <div className={getCardClassName(shouldShowTabs)}>
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
                <ChatContent
                  onSummarize={onSummarize}
                  isGeneratingSummary={isGeneratingSummary}
                  dateKey={dateKey}
                  onDraftSaveWrapper={onDraftSaveWrapper}
                  handleDeleteDraft={handleDeleteDraft}
                  initialConversation={initialConversation}
                  setViewMode={setViewMode}
                  selectedEntry={selectedEntry}
                />
              ) : (
                <EntryContent
                  selectedDate={selectedDate}
                  content={content}
                  title={title}
                  onContentChange={onContentChange}
                  onSave={onSave}
                  onDelete={onDelete}
                  onChangeDate={onChangeDate}
                  isSaving={isSaving}
                  lastSavedAt={lastSavedAt}
                  saveError={saveError}
                  selectedEntryId={selectedEntryId}
                  selectedEntry={selectedEntry}
                  selectedEntryData={selectedEntryData}
                  recentEntries={recentEntries}
                  onNavigateToEntry={onNavigateToEntry}
                  onLinksUpdated={onLinksUpdated}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
