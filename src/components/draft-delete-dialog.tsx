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
import { format } from 'date-fns';
import type { JournalEntryData } from '@/hooks/use-journal-entries';
import { Timestamp } from 'firebase/firestore';

interface DraftDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  draft: (JournalEntryData & { id: string }) | null;
  isLoading?: boolean;
}

function formatDate(date: Date | Timestamp | string | undefined): string {
  if (!date) return '';
  if (date instanceof Timestamp) {
    return format(date.toDate(), 'MMM d, yyyy h:mm a');
  }
  if (typeof date === 'string') {
    return format(new Date(date), 'MMM d, yyyy h:mm a');
  }
  return format(date, 'MMM d, yyyy h:mm a');
}

function getFirstUserMessage(draft: (JournalEntryData & { id: string }) | null): string {
  if (!draft?.conversationHistory) return '';
  const userMessage = draft.conversationHistory.find(msg => msg.role === 'user');
  if (!userMessage) return '';
  const content = typeof userMessage.content === 'string' ? userMessage.content : '';
  return content.length > 100 ? `${content.substring(0, 100)}...` : content;
}

function getMessageCount(draft: (JournalEntryData & { id: string }) | null): number {
  return draft?.conversationHistory?.length || 0;
}

export function DraftDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  draft,
  isLoading = false,
}: DraftDeleteDialogProps): React.JSX.Element {
  const { t } = useTranslation();
  const firstMessage = getFirstUserMessage(draft);
  const messageCount = getMessageCount(draft);
  const lastUpdated = formatDate(draft?.updatedAt);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('confirmDeleteDraft')}</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>{t('deleteDraftDescription')}</p>
            {draft && (
              <div className="mt-4 p-3 bg-muted rounded-lg space-y-2 text-sm">
                <div className="font-medium">{t('draftPreview')}</div>
                {firstMessage && (
                  <div className="text-muted-foreground">
                    &quot;{firstMessage}&quot;
                  </div>
                )}
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  {messageCount > 0 && (
                    <span>{t('messageCount').replace('{{count}}', messageCount.toString())}</span>
                  )}
                  {lastUpdated && (
                    <span>{t('lastUpdated')}: {lastUpdated}</span>
                  )}
                </div>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>{t('cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {t('deleteDraft')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

