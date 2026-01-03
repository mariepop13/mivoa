'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';

interface MessageDiffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalContent: string;
  editedContent: string;
}

function handleLookahead(
  originalLines: string[],
  editedLines: string[],
  i: number,
  j: number,
  diff: { type: 'added' | 'removed' | 'unchanged'; text: string }[]
): { newI: number; newJ: number } {
  if (i < originalLines.length - 1 && originalLines[i + 1] === editedLines[j]) {
    diff.push({ type: 'removed', text: originalLines[i] });
    return { newI: i + 1, newJ: j };
  }
  if (j < editedLines.length - 1 && originalLines[i] === editedLines[j + 1]) {
    diff.push({ type: 'added', text: editedLines[j] });
    return { newI: i, newJ: j + 1 };
  }
  diff.push({ type: 'removed', text: originalLines[i] });
  diff.push({ type: 'added', text: editedLines[j] });
  return { newI: i + 1, newJ: j + 1 };
}

function computeSimpleDiff(original: string, edited: string): { type: 'added' | 'removed' | 'unchanged'; text: string }[] {
  // Using a simple greedy algorithm with single-line lookahead instead of LCS-based diff.
  // This trade-off is acceptable for message edits which are typically simple and linear.
  // For complex structural changes, consider using a library like 'diff' or 'fast-diff'.
  const originalLines = original.split('\n');
  const editedLines = edited.split('\n');
  const diff: { type: 'added' | 'removed' | 'unchanged'; text: string }[] = [];
  
  let i = 0;
  let j = 0;
  
  while (i < originalLines.length || j < editedLines.length) {
    if (i >= originalLines.length) {
      diff.push({ type: 'added', text: editedLines[j] });
      j++;
      continue;
    }
    if (j >= editedLines.length) {
      diff.push({ type: 'removed', text: originalLines[i] });
      i++;
      continue;
    }
    if (originalLines[i] === editedLines[j]) {
      diff.push({ type: 'unchanged', text: originalLines[i] });
      i++;
      j++;
      continue;
    }
    
    const result = handleLookahead(originalLines, editedLines, i, j, diff);
    i = result.newI;
    j = result.newJ;
  }
  
  return diff;
}

export function MessageDiffDialog({
  open,
  onOpenChange,
  originalContent,
  editedContent,
}: MessageDiffDialogProps): React.JSX.Element {
  const { t } = useTranslation();
  const diff = computeSimpleDiff(originalContent, editedContent);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('viewChanges', 'View Changes')}</DialogTitle>
          <DialogDescription>
            {t('viewChangesDescription', 'Compare the original and edited versions of your message.')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-semibold mb-2 text-destructive">
                {t('original', 'Original')}
              </h3>
              <div className="border rounded-md p-3 bg-muted/50 max-h-[400px] overflow-y-auto">
                <pre className="text-sm whitespace-pre-wrap font-mono">{originalContent}</pre>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-2 text-primary">
                {t('edited', 'Edited')}
              </h3>
              <div className="border rounded-md p-3 bg-muted/50 max-h-[400px] overflow-y-auto">
                <pre className="text-sm whitespace-pre-wrap font-mono">{editedContent}</pre>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-2">
              {t('diffView', 'Difference View')}
            </h3>
            <div className="border rounded-md p-3 bg-muted/50 max-h-[300px] overflow-y-auto">
              <div className="space-y-1">
                {diff.map((item, index) => (
                  <div
                    key={index}
                    className={`text-sm font-mono ${
                      item.type === 'added'
                        ? 'bg-green-500/20 text-green-700 dark:text-green-400'
                        : item.type === 'removed'
                        ? 'bg-red-500/20 text-red-700 dark:text-red-400 line-through'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {item.type === 'added' && '+ '}
                    {item.type === 'removed' && '- '}
                    {item.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>
            {t('close', 'Close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

