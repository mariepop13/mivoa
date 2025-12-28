'use client';

import { AiPromptSuggestion } from '@/components/ai-prompt-suggestion';
import { useTranslation } from '@/hooks/use-translation';
import type { RecentEntry } from '@/ai/types/journal';

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
    <div className="flex-1 flex flex-col px-4 sm:px-6">
      {title && (
        <div className="pt-4 sm:pt-6 pb-4 sm:pb-6 border-b border-border/50">
          <h2 className="text-lg sm:text-xl font-headline font-semibold text-foreground">
            {title}
          </h2>
        </div>
      )}
      <div className="flex-1 pt-4 sm:pt-6">
        {!content.trim() && (
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
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder={t('writeYourThoughts')}
          className="flex-1 w-full resize-none bg-transparent text-foreground 
            placeholder:text-muted-foreground/60 focus:outline-none text-base 
            leading-relaxed font-body py-4"
          style={{ minHeight: '400px' }}
        />
      </div>
    </div>
  );
}

