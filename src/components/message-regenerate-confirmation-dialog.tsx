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

interface MessageRegenerateConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  messagesToDeleteCount?: number;
}

export function MessageRegenerateConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  messagesToDeleteCount = 0,
}: MessageRegenerateConfirmationDialogProps): React.JSX.Element {
  const { t } = useTranslation();

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const getDescription = () => {
    if (messagesToDeleteCount > 0) {
      return t('regenerateConfirmationDescriptionWithCount', `Regenerating will create a new response. ${messagesToDeleteCount} message(s) after this point will be removed. Continue?`).replace('{count}', String(messagesToDeleteCount));
    }
    return t('regenerateConfirmationDescription', 'Regenerating will create a new response. All messages after this point will be removed. Continue?');
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('regenerateConfirmationTitle', 'Regenerate response?')}</AlertDialogTitle>
          <AlertDialogDescription>
            {getDescription()}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            {t('regenerate', 'Regenerate')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

