'use client';

import { Button } from '@/components/ui/button';
import { Send, Sparkles } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { useChatInput } from '@/hooks/use-chat-input';

interface ChatInputFormProps {
  onSend: (message: string) => Promise<void>;
  isTyping: boolean;
  canSummarize: boolean;
  onSummarize: () => void;
  isLoadingSummary: boolean;
}

export function ChatInputForm({
  onSend,
  isTyping,
  canSummarize,
  onSummarize,
  isLoadingSummary,
}: ChatInputFormProps): React.JSX.Element {
  const { t } = useTranslation();
  const { inputValue, setInputValue, handleSend, handleKeyDown, canSend } = useChatInput({
    onSend,
    isTyping,
  });

  return (
    <div className="border-t border-border/60 bg-card/50 backdrop-blur-sm px-4 sm:px-6 py-4 sm:py-5">
      <div className="max-w-3xl mx-auto space-y-4">
        {canSummarize && (
          <div className="flex justify-center pb-1">
            <Button
              type="button"
              variant="outline"
              onClick={onSummarize}
              disabled={isLoadingSummary}
              className="w-full sm:w-auto shadow-sm"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {isLoadingSummary ? t('generatingSummary') : t('summarizeConversation')}
            </Button>
          </div>
        )}
        <div className="flex gap-3">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('typeMessage')}
            className="flex-1 min-h-[60px] max-h-[200px] resize-none rounded-lg border 
              border-input bg-background px-4 py-3 text-sm focus-visible:outline-none 
              focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed 
              disabled:opacity-50"
            disabled={isTyping}
          />
          <Button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            className="self-end"
            aria-label={t('send')}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

