'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import { useTranslation } from '@/hooks/use-translation';
import { useContext } from 'react';
import { LanguageContext } from '@/context/LanguageContext';
import { AiPromptSuggestion } from '@/components/ai-prompt-suggestion';
import type { RecentEntry } from '@/ai/types/journal';

interface JournalEntryProps {
  date: Date;
  content: string;
  title?: string;
  onContentChange: (content: string) => void;
  onTitleChange?: (title: string) => void;
  onSave: () => void;
  onDelete?: () => void;
  isLoading?: boolean;
  isSaved?: boolean;
  error?: string | null;
  hideDate?: boolean;
  canDelete?: boolean;
  recentEntries?: RecentEntry[];
}

export function JournalEntry({
  date,
  content,
  title = '',
  onContentChange,
  onTitleChange,
  onSave,
  onDelete,
  isLoading = false,
  isSaved = false,
  error = null,
  hideDate = false,
  canDelete = false,
  recentEntries = [],
}: JournalEntryProps) {
  const { language } = useContext(LanguageContext);
  const { t } = useTranslation();
  const [localContent, setLocalContent] = useState(content);
  const [localTitle, setLocalTitle] = useState(title);
  
  const dateLocale = language === 'fr' ? fr : enUS;

  useEffect(() => {
    setLocalContent(content);
  }, [content]);

  useEffect(() => {
    setLocalTitle(title);
  }, [title]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setLocalContent(newContent);
    onContentChange(newContent);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setLocalTitle(newTitle);
    if (onTitleChange) {
      onTitleChange(newTitle);
    }
  };

  const formattedDate = format(date, "EEEE, MMMM d, yyyy", { locale: dateLocale });

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

      <div className="flex-1 flex flex-col px-4 sm:px-6">
        <div className="pt-4 sm:pt-6 pb-4 sm:pb-6 border-b border-border/50">
          <input
            type="text"
            value={localTitle}
            onChange={handleTitleChange}
            placeholder={t('entryTitlePlaceholder')}
            className="w-full bg-transparent text-lg sm:text-xl font-headline font-semibold text-foreground placeholder:text-muted-foreground/60 focus:outline-none border-none"
          />
        </div>
        <div className="flex-1 pt-4 sm:pt-6">
          {!localContent.trim() && (
            <div className="mb-4">
              <AiPromptSuggestion
                recentEntries={recentEntries}
                onPromptSelected={(prompt) => {
                  onContentChange(prompt);
                }}
              />
            </div>
          )}
          <textarea
            value={localContent}
            onChange={handleContentChange}
            placeholder={t('writeYourThoughts')}
            className="flex-1 w-full resize-none bg-transparent text-foreground placeholder:text-muted-foreground/60 focus:outline-none text-base leading-relaxed font-body py-4"
            style={{ minHeight: '400px' }}
          />
        </div>
      </div>

      <div className="mt-4 sm:mt-6 px-4 sm:px-6 pb-4 sm:pb-6 pt-3 sm:pt-4 border-t border-border/50 bg-muted/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          {isLoading && (
            <span className="flex items-center gap-2 text-muted-foreground">
              <span className="inline-block w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <span>{t('saving')}</span>
            </span>
          )}
          {!isLoading && error && (
            <span className="flex items-center gap-2 text-destructive">
              <span>⚠️</span>
              <span className="break-words">{t('error')} {error}</span>
            </span>
          )}
          {!isLoading && !error && isSaved && (
            <span className="flex items-center gap-2 text-muted-foreground">
              <span className="flex items-center justify-center w-4 h-4 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-xs">✓</span>
              <span>{t('saved')}</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {canDelete && onDelete && (
            <button
              onClick={onDelete}
              disabled={isLoading}
              className="flex-1 sm:flex-none px-4 py-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium active:scale-[0.98] border border-transparent hover:border-destructive/20"
            >
              {t('delete')}
            </button>
          )}
          <button
            onClick={onSave}
            disabled={isLoading}
            className="flex-1 sm:flex-none px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md active:scale-[0.98]"
          >
            {t('save')}
          </button>
        </div>
      </div>
    </div>
  );
}

