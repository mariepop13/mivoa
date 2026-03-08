'use client';

import { AiPromptSuggestion } from '@/components/ai-prompt-suggestion';
import { WordCountBadge } from '@/components/word-count-badge';
import { useTranslation } from '@/hooks/use-translation';
import ReactMarkdown from 'react-markdown';
import type { RecentEntry } from '@/ai/types/journal';

const TEXTAREA_MIN_HEIGHT = '400px';

interface EntryContentFormProps {
  content: string;
  title?: string;
  recentEntries: RecentEntry[];
  onContentChange: (content: string) => void;
}

export function EntryContentForm({
  content,
  title,
  recentEntries,
  onContentChange,
}: EntryContentFormProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="flex-1 flex flex-col px-4 sm:px-6 lg:px-8">
      {title && (
        <div className="pt-5 sm:pt-6 lg:pt-8 pb-5 sm:pb-6 lg:pb-8 border-b border-border/60">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-headline font-semibold text-foreground">
            <ReactMarkdown
              components={{
                p: ({ children }) => <span>{children}</span>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
              }}
            >
              {title}
            </ReactMarkdown>
          </h2>
        </div>
      )}
      <div className="flex-1 pt-5 sm:pt-6 lg:pt-8">
        {!content.trim() && (
          <div className="mb-5 sm:mb-6">
            <AiPromptSuggestion
              recentEntries={recentEntries}
              onPromptSelected={(prompt) => {
                onContentChange(prompt);
              }}
            />
          </div>
        )}
        <textarea
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder={t('writeYourThoughts')}
          className="flex-1 w-full resize-none bg-transparent text-foreground
            placeholder:text-muted-foreground/50 focus:outline-none text-base sm:text-[1.125rem]
            leading-[1.85] font-serif py-2 tracking-[0.01em]"
          style={{ minHeight: TEXTAREA_MIN_HEIGHT }}
        />
        <div className="mt-2">
          <WordCountBadge content={content} />
        </div>
      </div>
    </div>
  );
}

