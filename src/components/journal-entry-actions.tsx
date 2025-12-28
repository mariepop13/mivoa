'use client';

import { useTranslation } from '@/hooks/use-translation';

interface JournalEntryActionsProps {
  onSave: () => void;
  onDelete?: () => void;
  isLoading: boolean;
  canDelete: boolean;
}

export function JournalEntryActions({ onSave, onDelete, isLoading, canDelete }: JournalEntryActionsProps): React.JSX.Element {
  const { t } = useTranslation();

  const deleteButtonClasses = [
    'flex-1 sm:flex-none px-4 py-2.5 text-muted-foreground',
    'hover:text-destructive hover:bg-destructive/10 rounded-lg',
    'disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200',
    'text-sm font-medium active:scale-[0.98] border border-transparent',
    'hover:border-destructive/20',
  ].join(' ');

  const saveButtonClasses = [
    'flex-1 sm:flex-none px-5 py-2.5 bg-primary text-primary-foreground',
    'rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed',
    'transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md',
    'active:scale-[0.98]',
  ].join(' ');

  return (
    <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
      {canDelete && onDelete && (
        <button
          type="button"
          onClick={onDelete}
          disabled={isLoading}
          className={deleteButtonClasses}
        >
          {t('delete')}
        </button>
      )}
      <button
        type="button"
        onClick={onSave}
        disabled={isLoading}
        className={saveButtonClasses}
      >
        {t('save')}
      </button>
    </div>
  );
}

