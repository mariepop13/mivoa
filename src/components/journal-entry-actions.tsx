'use client';

import { useState } from 'react';
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
} from '@/components/ui/dialog';
import { DatePicker } from '@/components/date-picker';
import { EntryLinkButton } from '@/components/entry-link-button';

interface JournalEntryActionsProps {
  onSave: () => void;
  onDelete?: () => void;
  onChangeDate?: (date: Date) => void;
  isLoading: boolean;
  canDelete: boolean;
  currentDate?: Date;
  entryId?: string | null;
  linkedEntryIds?: string[];
  onLinksUpdated?: () => void;
}

const DELETE_BUTTON_CLASSES = [
  'flex-1 sm:flex-none px-4 py-2.5 text-muted-foreground',
  'hover:text-destructive hover:bg-destructive/10 rounded-lg',
  'disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200',
  'text-sm font-medium active:scale-[0.98] border border-transparent',
  'hover:border-destructive/20',
].join(' ');

const SAVE_BUTTON_CLASSES = [
  'flex-1 sm:flex-none px-5 py-2.5 bg-primary text-primary-foreground',
  'rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed',
  'transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md',
  'active:scale-[0.98]',
].join(' ');

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading: boolean;
  t: (key: string) => string;
}

function DeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
  t,
}: DeleteDialogProps): React.JSX.Element {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          disabled={isLoading}
          className={DELETE_BUTTON_CLASSES}
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
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {t('delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ChangeDateDialogTrigger({
  isLoading,
  t,
  onClick,
}: {
  isLoading: boolean;
  t: (key: string) => string;
  onClick: () => void;
}): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      className="flex-1 sm:flex-none px-4 py-2.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium active:scale-[0.98] border border-transparent hover:border-border flex items-center justify-center gap-2"
    >
      <Calendar className="h-4 w-4" />
      <span className="hidden sm:inline">{t('changeEntryDate')}</span>
    </button>
  );
}

interface ChangeDateDialogContentProps {
  selectedNewDate: Date | null;
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onCancel: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  t: (key: string) => string;
}

function renderDatePickerSection(
  selectedNewDate: Date | null,
  currentDate: Date,
  onDateChange: (date: Date) => void
): React.JSX.Element {
  return (
    <div className="py-4">
      <DatePicker
        value={selectedNewDate || currentDate}
        onChange={onDateChange}
        showDatesList={false}
      />
    </div>
  );
}

function ChangeDateDialogContent({
  selectedNewDate,
  currentDate,
  onDateChange,
  onCancel,
  onConfirm,
  isLoading,
  t,
}: ChangeDateDialogContentProps): React.JSX.Element {
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{t('changeEntryDate')}</DialogTitle>
        <DialogDescription>
          {t('confirmChangeDate')}
        </DialogDescription>
      </DialogHeader>
      {renderDatePickerSection(selectedNewDate, currentDate, onDateChange)}
      <DialogFooter>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-colors"
        >
          {t('cancel')}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={!selectedNewDate || isLoading}
          className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {t('changeEntryDate')}
        </button>
      </DialogFooter>
    </DialogContent>
  );
}

interface ChangeDateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDate: Date;
  onConfirm: (date: Date) => Promise<void>;
  isLoading: boolean;
  t: (key: string) => string;
}

function ChangeDateDialog({
  open,
  onOpenChange,
  currentDate,
  onConfirm,
  isLoading,
  t,
}: ChangeDateDialogProps): React.JSX.Element {
  const [selectedNewDate, setSelectedNewDate] = useState<Date | null>(currentDate);

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (newOpen) {
      setSelectedNewDate(currentDate);
    }
  };

  const handleConfirm = async () => {
    if (selectedNewDate) {
      try {
        await onConfirm(selectedNewDate);
        onOpenChange(false);
        setSelectedNewDate(null);
      } catch (error) {
        console.error('Error changing date:', error);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <ChangeDateDialogContent
        selectedNewDate={selectedNewDate}
        currentDate={currentDate}
        onDateChange={(date) => setSelectedNewDate(date)}
        onCancel={() => onOpenChange(false)}
        onConfirm={handleConfirm}
        isLoading={isLoading}
        t={t}
      />
    </Dialog>
  );
}

export function JournalEntryActions({
  onSave,
  onDelete,
  onChangeDate,
  isLoading,
  canDelete,
  currentDate,
  entryId,
  linkedEntryIds,
  onLinksUpdated,
}: JournalEntryActionsProps): React.JSX.Element {
  const { t } = useTranslation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [changeDateDialogOpen, setChangeDateDialogOpen] = useState(false);

  const handleDeleteConfirm = () => {
    onDelete?.();
  };

  const handleChangeDateConfirm = async (date: Date) => {
    if (onChangeDate) {
      await onChangeDate(date);
    }
  };

  return (
    <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
      {entryId && (
        <EntryLinkButton
          entryId={entryId}
          linkedEntryIds={linkedEntryIds}
          onLinksUpdated={onLinksUpdated}
        />
      )}
      {onChangeDate && currentDate && (
        <>
          <ChangeDateDialogTrigger
            isLoading={isLoading}
            t={t}
            onClick={() => setChangeDateDialogOpen(true)}
          />
          <ChangeDateDialog
            open={changeDateDialogOpen}
            onOpenChange={setChangeDateDialogOpen}
            currentDate={currentDate}
            onConfirm={handleChangeDateConfirm}
            isLoading={isLoading}
            t={t}
          />
        </>
      )}
      {canDelete && onDelete && (
        <DeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleDeleteConfirm}
          isLoading={isLoading}
          t={t}
        />
      )}
      <button
        type="button"
        onClick={onSave}
        disabled={isLoading}
        className={SAVE_BUTTON_CLASSES}
      >
        {t('save')}
      </button>
    </div>
  );
}

