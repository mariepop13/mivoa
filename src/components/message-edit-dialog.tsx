'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';

const MAX_MESSAGE_LENGTH = 5000;

interface MessageEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialContent: string;
  onSave: (content: string) => void;
}

export function MessageEditDialog({
  open,
  onOpenChange,
  initialContent,
  onSave,
}: MessageEditDialogProps): React.JSX.Element {
  const { t } = useTranslation();
  const [content, setContent] = useState(initialContent);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setContent(initialContent);
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [open, initialContent]);

  const handleSave = () => {
    const trimmedContent = content.trim();
    if (trimmedContent.length === 0) {
      return;
    }
    onSave(trimmedContent);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setContent(initialContent);
    onOpenChange(false);
  };


  const trimmedContent = content.trim();
  const isValid = trimmedContent.length > 0 && content.length <= MAX_MESSAGE_LENGTH;
  const characterCount = content.length;
  const wordCount = trimmedContent.split(/\s+/).filter(word => word.length > 0).length;
  const hasNoChanges = trimmedContent === initialContent.trim();
  const isEmpty = trimmedContent.length === 0;
  const isTooShort = trimmedContent.length > 0 && trimmedContent.length < 3;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t('editMessage')}</DialogTitle>
          <DialogDescription>
            {t('editMessageDescription', 'Edit your message content')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => {
              const newValue = e.target.value;
              if (newValue.length <= MAX_MESSAGE_LENGTH) {
                setContent(newValue);
              }
            }}
            style={{ minHeight: '200px', height: 'auto' }}
            className="w-full min-h-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
            placeholder={t('writeYourThoughts')}
            maxLength={MAX_MESSAGE_LENGTH}
          />
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <div className="flex gap-4">
                <span>
                  {characterCount} / {MAX_MESSAGE_LENGTH} {t('charactersCount')}
                </span>
                <span>
                  {wordCount} {wordCount === 1 ? t('word', 'word') : t('words', 'words')}
                </span>
              </div>
              {hasNoChanges && !isEmpty && (
                <span className="text-yellow-600 dark:text-yellow-400">
                  {t('noChangesWarning', 'No changes detected')}
                </span>
              )}
            </div>
            <div className="flex justify-end">
              {isEmpty && (
                <span className="text-destructive text-xs">
                  {t('messageRequired', 'Message cannot be empty')}
                </span>
              )}
              {isTooShort && !isEmpty && (
                <span className="text-yellow-600 dark:text-yellow-400 text-xs">
                  {t('messageTooShort', 'Message is very short')}
                </span>
              )}
            </div>
          </div>
        </div>
        <DialogFooter className="flex justify-between">
          <Button
            variant="ghost"
            onClick={() => {
              setContent(initialContent);
            }}
            disabled={trimmedContent === initialContent.trim()}
          >
            {t('restoreOriginal', 'Restore original')}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              {t('cancel')}
            </Button>
            <Button onClick={handleSave} disabled={!isValid || hasNoChanges}>
              {t('saveEdit')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

