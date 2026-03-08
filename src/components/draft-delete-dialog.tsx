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
import { format, formatDistanceToNow } from 'date-fns';
import type { JournalEntryData } from '@/hooks/use-journal-entries';
const MAX_PREVIEW_MESSAGES = 5;
const MAX_CONTENT_PREVIEW_LENGTH = 200;

interface DraftDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  draft: (JournalEntryData & { id: string }) | null;
  isLoading?: boolean;
}

function formatDate(date: Date | { toDate(): Date } | string | undefined): string {
  if (!date) return '';
  let dateObj: Date;
  if (typeof date === 'string') {
    dateObj = new Date(date);
  } else if (date instanceof Date) {
    dateObj = date;
  } else {
    dateObj = date.toDate();
  }
  if (isNaN(dateObj.getTime())) return '';
  return format(dateObj, 'MMM d, yyyy h:mm a');
}

function formatDateRelative(date: Date | { toDate(): Date } | string | undefined): string {
  if (!date) return '';
  let dateObj: Date;
  if (typeof date === 'string') {
    dateObj = new Date(date);
  } else if (date instanceof Date) {
    dateObj = date;
  } else {
    dateObj = date.toDate();
  }
  if (isNaN(dateObj.getTime())) return '';
  return formatDistanceToNow(dateObj, { addSuffix: true });
}

function getDraftPreviewMessages(draft: (JournalEntryData & { id: string }) | null): Array<{ role: 'user' | 'assistant'; content: string }> {
  if (!draft?.conversationHistory || draft.conversationHistory.length === 0) return [];
  
  const messages = draft.conversationHistory.slice(0, MAX_PREVIEW_MESSAGES).map(msg => ({
    role: msg.role,
    content: typeof msg.content === 'string' ? msg.content : '',
  }));
  
  return messages;
}

function getMessageCount(draft: (JournalEntryData & { id: string }) | null): number {
  return draft?.conversationHistory?.length || 0;
}

function getMessageClassName(role: 'user' | 'assistant'): string {
  return role === 'user'
    ? 'bg-primary/10 border-l-2 border-primary pl-2 py-1 rounded'
    : 'bg-muted-foreground/5 border-l-2 border-muted-foreground/30 pl-2 py-1 rounded';
}

function truncateContent(content: string): string {
  if (content.length > MAX_CONTENT_PREVIEW_LENGTH) {
    return `${content.substring(0, MAX_CONTENT_PREVIEW_LENGTH)}...`;
  }
  return content;
}

interface DraftPreviewMessagesProps {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  messageCount: number;
  t: (key: string) => string;
}

function DraftPreviewMessages({ messages, messageCount, t }: DraftPreviewMessagesProps): React.JSX.Element | null {
  if (messages.length === 0) return null;

  const showAllMessages = messageCount <= MAX_PREVIEW_MESSAGES;

  return (
    <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
      {messages.map((msg, index) => (
        <div key={index} className={getMessageClassName(msg.role)}>
          <div className="text-xs font-medium mb-1 text-muted-foreground">
            {msg.role === 'user' ? t('user') : t('assistant')}
          </div>
          <div className="text-foreground text-sm whitespace-pre-wrap break-words">
            {truncateContent(msg.content)}
          </div>
        </div>
      ))}
      {!showAllMessages && messageCount > MAX_PREVIEW_MESSAGES && (
        <div className="text-xs text-muted-foreground italic text-center pt-2">
          {t('andMoreMessages').replace('{{count}}', (messageCount - MAX_PREVIEW_MESSAGES).toString())}
        </div>
      )}
    </div>
  );
}

interface DraftMetadataProps {
  lastUpdated: string;
  lastUpdatedRelative: string;
  createdAt: string;
  t: (key: string) => string;
}

function DraftMetadata({ lastUpdated, lastUpdatedRelative, createdAt, t }: DraftMetadataProps): React.JSX.Element {
  return (
    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
      {lastUpdated && (
        <div className="flex flex-col">
          <span>{t('lastUpdated')}:</span>
          <span className="font-medium">{lastUpdatedRelative}</span>
          <span className="text-[10px]">{lastUpdated}</span>
        </div>
      )}
      {createdAt && createdAt !== lastUpdated && (
        <div className="flex flex-col">
          <span>{t('createdAt')}:</span>
          <span className="text-[10px]">{createdAt}</span>
        </div>
      )}
    </div>
  );
}

export function DraftDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  draft,
  isLoading = false,
}: DraftDeleteDialogProps): React.JSX.Element {
  const { t } = useTranslation();
  const previewMessages = getDraftPreviewMessages(draft);
  const messageCount = getMessageCount(draft);
  const lastUpdated = formatDate(draft?.updatedAt);
  const lastUpdatedRelative = formatDateRelative(draft?.updatedAt);
  const createdAt = formatDate(draft?.createdAt);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('confirmDeleteDraft')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('deleteDraftDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {draft && (
          <div className="mt-4 p-3 bg-muted rounded-lg space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <div className="font-medium">{t('draftPreview')}</div>
              {messageCount > 0 && (
                <span className="text-xs px-2 py-0.5 bg-background rounded border border-border">
                  {t('messageCount').replace('{{count}}', messageCount.toString())}
                </span>
              )}
            </div>
            <DraftPreviewMessages messages={previewMessages} messageCount={messageCount} t={t} />
            <DraftMetadata 
              lastUpdated={lastUpdated} 
              lastUpdatedRelative={lastUpdatedRelative} 
              createdAt={createdAt} 
              t={t} 
            />
          </div>
        )}
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
