'use client';

import { useTranslation } from '@/hooks/use-translation';

interface ChatTypingIndicatorProps {
  message?: string;
}

export function ChatTypingIndicator({ message }: ChatTypingIndicatorProps): React.JSX.Element {
  const { t } = useTranslation();
  const displayMessage = message || t('chatInitializing', 'Starting conversation...');

  return (
    <div className="flex justify-start mb-4">
      <div className="bg-muted text-foreground border border-border rounded-lg px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-primary rounded-full motion-safe:animate-pulse" />
          <span className="inline-block w-2 h-2 bg-primary rounded-full motion-safe:animate-pulse delay-75" />
          <span className="inline-block w-2 h-2 bg-primary rounded-full motion-safe:animate-pulse delay-150" />
          <span className="text-sm text-muted-foreground ml-2">{displayMessage}</span>
        </div>
      </div>
    </div>
  );
}

