'use client';

import { useState, useEffect } from 'react';
import { JournalEntry } from '@/components/journal-entry';
import { JournalChat } from '@/components/journal-chat';
import { JournalMobileHeader } from '@/components/journal-mobile-header';
import type { JournalEntryData } from '@/hooks/use-journal-entries';
import { Timestamp } from 'firebase/firestore';
import type { ChatMessage } from '@/ai/types/chat';
import { Button } from '@/components/ui/button';
import { MessageSquare, FileText } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';

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
  
  const isDraftSelected = selectedEntry?.isDraft === true;
  const isConversationEntrySelected = selectedEntry?.conversationMode === true && selectedEntry?.isDraft !== true;
  
  useEffect(() => {
    if (isConversationEntrySelected && viewMode !== 'chat') {
      setViewMode('chat');
    }
  }, [isConversationEntrySelected, viewMode, selectedEntryId]);
  
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
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
          <div className="bg-card rounded-xl border border-border shadow-sm h-full min-h-[600px] flex flex-col">
            {isConversationEntrySelected && (
              <div className="flex items-center justify-center gap-2 p-4 border-b border-border">
                <Button
                  type="button"
                  variant={viewMode === 'chat' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('chat')}
                  className="flex items-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  {t('conversation')}
                </Button>
                <Button
                  type="button"
                  variant={viewMode === 'summary' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('summary')}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  {t('summary')}
                </Button>
              </div>
            )}
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
  );
}

