'use client';

import { useState } from 'react';
import { useTranslation } from '@/hooks/use-translation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface JournalEntryActionsProps {
  onSave: () => void;
  onDelete?: () => void;
  isLoading: boolean;
  canDelete: boolean;
}

export function JournalEntryActions({ onSave, onDelete, isLoading, canDelete }: JournalEntryActionsProps): React.JSX.Element {
  const { t } = useTranslation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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

  const handleDeleteConfirm = () => {
    onDelete?.();
  };

  return (
    <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
      {canDelete && onDelete && (
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              disabled={isLoading}
              className={deleteButtonClasses}
            >
              {t('delete')}
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('delete')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('confirmDelete')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {t('delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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

