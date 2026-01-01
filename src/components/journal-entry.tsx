'use client';

import { useState, useEffect, memo } from 'react';
import { JournalEntryStatus } from '@/components/journal-entry-status';
import { JournalEntryActions } from '@/components/journal-entry-actions';
import { EntryDateHeader } from '@/components/entry-date-header';
import { EntryContentForm } from '@/components/entry-content-form';
import { EntryDetections } from '@/components/entry-detections';
import { EntryLinksList } from '@/components/entry-links-list';
import type { RecentEntry } from '@/ai/types/journal';
import type { JournalEntryData } from '@/hooks/use-journal-entries';

interface JournalEntryProps {
  date: Date;
  content: string;
  title?: string;
  onContentChange: (content: string) => void;
  onSave: () => void;
  onDelete?: () => void;
  onChangeDate?: (date: Date) => void;
  isLoading?: boolean;
  isSaved?: boolean;
  error?: string | null;
  hideDate?: boolean;
  canDelete?: boolean;
  recentEntries?: RecentEntry[];
  places?: string[];
  characters?: string[];
  themes?: string[];
  themeEmojis?: Record<string, string>;
  moods?: string[];
  moodEmojis?: Record<string, string>;
  entryId?: string | null;
  linkedEntryIds?: string[];
  onNavigateToEntry?: (entry: JournalEntryData & { id: string }) => void;
  onLinksUpdated?: () => void;
}

function JournalEntryComponent({
  date,
  content,
  title = '',
  onContentChange,
  onSave,
  onDelete,
  onChangeDate,
  isLoading = false,
  isSaved = false,
  error = null,
  hideDate = false,
  canDelete = false,
  recentEntries = [],
  places,
  characters,
  themes,
  themeEmojis,
  moods,
  moodEmojis,
  entryId,
  linkedEntryIds,
  onNavigateToEntry,
  onLinksUpdated,
}: JournalEntryProps): React.JSX.Element {
  const [localContent, setLocalContent] = useState(content);

  useEffect(() => {
    setLocalContent(content);
  }, [content]);

  const handleContentChange = (newContent: string) => {
    setLocalContent(newContent);
    onContentChange(newContent);
  };

  return (
    <div className="flex flex-col h-full">
      {!hideDate && <EntryDateHeader date={date} />}
      <EntryContentForm
        content={localContent}
        title={title}
        recentEntries={recentEntries}
        onContentChange={handleContentChange}
      />
      <EntryDetections places={places} characters={characters} themes={themes} themeEmojis={themeEmojis} moods={moods} moodEmojis={moodEmojis} />
      {entryId && onNavigateToEntry && (
        <EntryLinksList
          entryId={entryId}
          linkedEntryIds={linkedEntryIds}
          onNavigateToEntry={onNavigateToEntry}
          onLinksUpdated={onLinksUpdated}
        />
      )}
      <div className="mt-5 sm:mt-6 lg:mt-8 px-4 sm:px-6 lg:px-8 pb-4 sm:pb-5 lg:pb-6 pt-4 sm:pt-5 lg:pt-6 border-t 
        border-border/60 bg-muted/40 backdrop-blur-sm flex flex-col sm:flex-row items-start sm:items-center 
        justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <JournalEntryStatus isLoading={isLoading} isSaved={isSaved} error={error} />
        </div>
        <JournalEntryActions 
          onSave={onSave} 
          onDelete={onDelete} 
          onChangeDate={onChangeDate}
          isLoading={isLoading} 
          canDelete={canDelete}
          currentDate={date}
          entryId={entryId}
          linkedEntryIds={linkedEntryIds}
          onLinksUpdated={onLinksUpdated}
        />
      </div>
    </div>
  );
}

export const JournalEntry = memo(JournalEntryComponent);

