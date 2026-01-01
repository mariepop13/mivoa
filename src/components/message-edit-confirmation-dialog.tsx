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

interface MessageEditConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  messagesToDeleteCount?: number;
}

export function MessageEditConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  messagesToDeleteCount = 0,
}: MessageEditConfirmationDialogProps): React.JSX.Element {
  const { t } = useTranslation();

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const getDescription = () => {
    if (messagesToDeleteCount > 0) {
      return t('editMessageConfirmationDescriptionWithCount', `If you edit this message, the AI response will be regenerated. ${messagesToDeleteCount} message(s) after this point will be removed. Continue?`).replace('{count}', String(messagesToDeleteCount));
    }
    return t('editMessageConfirmationDescription');
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('editMessageConfirmationTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {getDescription()}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            {t('saveEdit')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

