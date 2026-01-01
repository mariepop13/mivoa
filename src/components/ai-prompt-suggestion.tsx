'use client';

import { useJournalPrompts } from '@/hooks/use-journal-prompts';
import { useTranslation } from '@/hooks/use-translation';
import { Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { RecentEntry } from '@/ai/types/journal';

interface AiPromptSuggestionProps {
  recentEntries?: RecentEntry[];
  onPromptSelected?: (prompt: string) => void;
}

function renderHeaderSection(
  isLoading: boolean,
  regenerate: () => void,
  t: (key: string) => string
): React.JSX.Element {
  return (
    <div className="flex items-center justify-between gap-2 mb-2">
      <p className="text-sm font-medium text-foreground">
        {t('aiPromptSuggestion')}
      </p>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={regenerate}
        disabled={isLoading}
        className="h-7 px-2 text-xs"
      >
        <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
        {t('regenerate')}
      </Button>
    </div>
  );
}

export function AiPromptSuggestion({
  recentEntries = [],
  onPromptSelected,
}: AiPromptSuggestionProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const { prompt, isLoading, error, regenerate } = useJournalPrompts(recentEntries);

  if (error && !prompt) {
    return null;
  }

  if (!prompt && !isLoading) {
    return null;
  }

  const handleUsePrompt = () => {
    if (prompt && onPromptSelected) {
      onPromptSelected(prompt);
    }
  };

  return (
    <div className="mb-4 p-4 rounded-lg border border-border bg-muted/30">
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          {renderHeaderSection(isLoading, regenerate, t)}
          {renderPromptContent({ prompt, isLoading, onPromptSelected, handleUsePrompt, t })}
        </div>
      </div>
    </div>
  );
}

interface RenderPromptContentOptions {
  prompt: string | null;
  isLoading: boolean;
  onPromptSelected: ((prompt: string) => void) | undefined;
  handleUsePrompt: () => void;
  t: (key: string) => string;
}

function renderPromptContent(options: RenderPromptContentOptions): React.ReactNode {
  const { prompt, isLoading, onPromptSelected, handleUsePrompt, t } = options;
  if (isLoading && !prompt) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="inline-block w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        <span>{t('generatingPrompt')}</span>
      </div>
    );
  }
  
  if (prompt) {
    return (
      <>
        <p className="text-sm text-foreground mb-3 leading-relaxed">
          {prompt}
        </p>
        {onPromptSelected && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleUsePrompt}
            className="text-xs"
          >
            {t('useThisPrompt')}
          </Button>
        )}
      </>
    );
  }
  
  return null;
}

