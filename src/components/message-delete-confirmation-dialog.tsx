'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useTranslation } from '@/hooks/use-translation';

interface MessageDeleteConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  messagesToDeleteCount: number;
}

export function MessageDeleteConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  messagesToDeleteCount,
}: MessageDeleteConfirmationDialogProps): React.JSX.Element {
  const { t } = useTranslation();

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('deleteMessageConfirmationTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {messagesToDeleteCount > 0
              ? t('deleteMessageConfirmationDescriptionWithCount', 'This message will be deleted. {count} message(s) after this point will also be removed.').replace('{count}', String(messagesToDeleteCount))
              : t('deleteMessageConfirmationDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {t('delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

