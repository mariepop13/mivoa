'use client';

import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (open) {
      setContent(initialContent);
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

  const isValid = content.trim().length > 0 && content.length <= MAX_MESSAGE_LENGTH;
  const characterCount = content.length;

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
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full min-h-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
            placeholder={t('writeYourThoughts')}
            maxLength={MAX_MESSAGE_LENGTH}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {characterCount} / {MAX_MESSAGE_LENGTH} {t('charactersCount')}
            </span>
            {!isValid && content.trim().length === 0 && (
              <span className="text-destructive">
                {t('messageRequired', 'Message cannot be empty')}
              </span>
            )}
            {characterCount > MAX_MESSAGE_LENGTH && (
              <span className="text-destructive">
                {t('messageTooLong', 'Message is too long')}
              </span>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSave} disabled={!isValid}>
            {t('saveEdit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

