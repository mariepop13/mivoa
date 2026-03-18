'use client';

import { useTranslation } from '@/hooks/use-translation';

interface ChatMessageEditedIndicatorProps {
  isUser: boolean;
  onViewDiff: () => void;
  onUndo?: () => void;
  canUndo: boolean;
}

export function ChatMessageEditedIndicator({
  isUser,
  onViewDiff,
  onUndo,
  canUndo,
}: ChatMessageEditedIndicatorProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onViewDiff}
        className={`text-xs px-1.5 py-0.5 rounded ${
          isUser
            ? 'bg-primary-foreground/20 text-primary-foreground/80 hover:bg-primary-foreground/30'
            : 'bg-muted-foreground/20 text-muted-foreground hover:bg-muted-foreground/30'
        } cursor-pointer`}
        title={t('viewChanges', 'View changes')}
        aria-label={t('viewChanges', 'View changes')}
      >
        {t('edited')}
      </button>
      {canUndo && onUndo && (
        <button
          onClick={onUndo}
          className={`text-xs px-1.5 py-0.5 rounded underline ${
            isUser
              ? 'text-primary-foreground/80 hover:text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          title={t('undoEdit', 'Undo edit')}
          aria-label={t('undoEdit', 'Undo edit')}
        >
          {t('undo', 'Undo')}
        </button>
      )}
    </div>
  );
}

