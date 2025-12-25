'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';

interface JournalEntryProps {
  date: Date;
  content: string;
  onContentChange: (content: string) => void;
  isLoading?: boolean;
  isSaved?: boolean;
  error?: string | null;
}

export function JournalEntry({
  date,
  content,
  onContentChange,
  isLoading = false,
  isSaved = false,
  error = null,
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
    <div className="flex flex-col h-full max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-headline font-semibold text-foreground mb-2">
          {formattedDate}
        </h1>
        <div className="h-px bg-border" />
      </div>

      <div className="flex-1 flex flex-col">
        <textarea
          value={localContent}
          onChange={handleChange}
          placeholder="Write your thoughts..."
          className="flex-1 w-full resize-none bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-base leading-relaxed font-body"
          style={{ minHeight: '400px' }}
        />
      </div>

      <div className="mt-4 flex items-center gap-2 text-sm">
        {isLoading && (
          <span className="text-muted-foreground">Saving...</span>
        )}
        {!isLoading && error && (
          <span className="text-destructive">Error: {error}</span>
        )}
        {!isLoading && !error && isSaved && (
          <span className="text-muted-foreground">Saved</span>
        )}
      </div>
    </div>
  );
}

