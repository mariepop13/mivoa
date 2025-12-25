'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';

interface JournalEntryProps {
  date: Date;
  content: string;
  onContentChange: (content: string) => void;
  onSave: () => void;
  isLoading?: boolean;
  isSaved?: boolean;
  error?: string | null;
  hideDate?: boolean;
}

export function JournalEntry({
  date,
  content,
  onContentChange,
  onSave,
  isLoading = false,
  isSaved = false,
  error = null,
  hideDate = false,
}: JournalEntryProps) {
  const [localContent, setLocalContent] = useState(content);

  useEffect(() => {
    setLocalContent(content);
  }, [content]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setLocalContent(newContent);
    onContentChange(newContent);
  };

  const formattedDate = format(date, "EEEE, MMMM d, yyyy", { locale: enUS });

  return (
    <div className="flex flex-col h-full">
      {!hideDate && (
        <div className="mb-6 px-6 pt-6">
          <h1 className="text-2xl font-headline font-semibold text-foreground mb-2">
            {formattedDate}
          </h1>
          <div className="h-px bg-border" />
        </div>
      )}

      <div className="flex-1 flex flex-col px-6">
        <textarea
          value={localContent}
          onChange={handleChange}
          placeholder="Write your thoughts..."
          className="flex-1 w-full resize-none bg-transparent text-foreground placeholder:text-muted-foreground/60 focus:outline-none text-base leading-relaxed font-body py-4"
          style={{ minHeight: '500px' }}
        />
      </div>

      <div className="mt-6 px-6 pb-6 pt-4 border-t border-border/50 bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          {isLoading && (
            <span className="flex items-center gap-2 text-muted-foreground">
              <span className="inline-block w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <span>Saving...</span>
            </span>
          )}
          {!isLoading && error && (
            <span className="flex items-center gap-2 text-destructive">
              <span>⚠️</span>
              <span>Error: {error}</span>
            </span>
          )}
          {!isLoading && !error && isSaved && (
            <span className="flex items-center gap-2 text-muted-foreground">
              <span className="flex items-center justify-center w-4 h-4 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-xs">✓</span>
              <span>Saved</span>
            </span>
          )}
        </div>
        <button
          onClick={onSave}
          disabled={isLoading}
          className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md active:scale-[0.98]"
        >
          Save
        </button>
      </div>
    </div>
  );
}

