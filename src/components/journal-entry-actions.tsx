'use client';

import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DatePicker } from '@/components/date-picker';

interface JournalEntryActionsProps {
  onSave: () => void;
  onDelete?: () => void;
  onChangeDate?: (date: Date) => void;
  isLoading: boolean;
  canDelete: boolean;
  currentDate?: Date;
}

export function JournalEntryActions({ onSave, onDelete, onChangeDate, isLoading, canDelete, currentDate }: JournalEntryActionsProps): React.JSX.Element {
  const { t } = useTranslation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [changeDateDialogOpen, setChangeDateDialogOpen] = useState(false);
  const [selectedNewDate, setSelectedNewDate] = useState<Date | null>(currentDate || null);

  useEffect(() => {
    if (changeDateDialogOpen && currentDate) {
      setSelectedNewDate(currentDate);
    }
  }, [changeDateDialogOpen, currentDate]);

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

  const handleChangeDateConfirm = async () => {
    if (selectedNewDate && onChangeDate) {
      try {
        await onChangeDate(selectedNewDate);
        setChangeDateDialogOpen(false);
        setSelectedNewDate(null);
      } catch (error) {
        console.error('Error changing date:', error);
      }
    }
  };

  return (
    <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
      {onChangeDate && currentDate && (
        <Dialog open={changeDateDialogOpen} onOpenChange={setChangeDateDialogOpen}>
          <DialogTrigger asChild>
            <button
              type="button"
              disabled={isLoading}
              className="flex-1 sm:flex-none px-4 py-2.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium active:scale-[0.98] border border-transparent hover:border-border flex items-center justify-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">{t('changeEntryDate')}</span>
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('changeEntryDate')}</DialogTitle>
              <DialogDescription>
                {t('confirmChangeDate')}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <DatePicker
                value={selectedNewDate || currentDate}
                onChange={(date) => setSelectedNewDate(date)}
                showDatesList={false}
              />
            </div>
            <DialogFooter>
              <button
                type="button"
                onClick={() => setChangeDateDialogOpen(false)}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={handleChangeDateConfirm}
                disabled={!selectedNewDate || isLoading}
                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t('changeEntryDate')}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
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

