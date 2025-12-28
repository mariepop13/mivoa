'use client';

import { useState, useEffect, memo } from 'react';
import { JournalEntryStatus } from '@/components/journal-entry-status';
import { JournalEntryActions } from '@/components/journal-entry-actions';
import { EntryDateHeader } from '@/components/entry-date-header';
import { EntryContentForm } from '@/components/entry-content-form';
import type { RecentEntry } from '@/ai/types/journal';

interface JournalEntryProps {
  date: Date;
  content: string;
  title?: string;
  onContentChange: (content: string) => void;
  onSave: () => void;
  onDelete?: () => void;
  isLoading?: boolean;
  isSaved?: boolean;
  error?: string | null;
  hideDate?: boolean;
  canDelete?: boolean;
  recentEntries?: RecentEntry[];
}

function JournalEntryComponent({
  date,
  content,
  title = '',
  onContentChange,
  onSave,
  onDelete,
  isLoading = false,
  isSaved = false,
  error = null,
  hideDate = false,
  canDelete = false,
  recentEntries = [],
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
      <div className="mt-4 sm:mt-6 px-4 sm:px-6 pb-4 sm:pb-6 pt-3 sm:pt-4 border-t 
        border-border/50 bg-muted/30 flex flex-col sm:flex-row items-start sm:items-center 
        justify-between gap-3">
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <JournalEntryStatus isLoading={isLoading} isSaved={isSaved} error={error} />
        </div>
        <JournalEntryActions 
          onSave={onSave} 
          onDelete={onDelete} 
          isLoading={isLoading} 
          canDelete={canDelete} 
        />
      </div>
    </div>
  );
}

export const JournalEntry = memo(JournalEntryComponent);

