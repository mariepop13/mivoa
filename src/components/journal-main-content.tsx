'use client';

import { JournalEntry } from '@/components/journal-entry';
import { JournalChat } from '@/components/journal-chat';
import { JournalMobileHeader } from '@/components/journal-mobile-header';
import type { JournalEntryData } from '@/hooks/use-journal-entries';

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
  onSummarize: (conversationHistory: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>) => Promise<void>;
  getEntryTitle: (
    entry: (JournalEntryData & { id: string }) | undefined,
    allEntries: (JournalEntryData & { id: string })[] | null
  ) => string;
  onSidebarToggle: () => void;
  isSidebarOpen: boolean;
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
}: JournalMainContentProps): React.JSX.Element {
  return (
    <div className="flex-1 flex flex-col bg-background">
      <JournalMobileHeader 
        title={getEntryTitle(selectedEntry, entries)}
        onSidebarToggle={onSidebarToggle}
        isSidebarOpen={isSidebarOpen}
      />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
          <div className="bg-card rounded-xl border border-border shadow-sm h-full min-h-[600px] flex flex-col">
            {selectedEntryId ? (
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
              />
            ) : (
              <JournalChat
                onSummarize={onSummarize}
                isLoadingSummary={isGeneratingSummary}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

