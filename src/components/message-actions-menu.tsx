'use client';

import { MoreVertical, Pencil, Trash2, RotateCw } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';

interface MessageActionsMenuProps {
  messageRole: 'user' | 'assistant';
  onEdit?: () => void;
  onDelete?: () => void;
  onRegenerate?: () => void;
  disabled?: boolean;
}

export function MessageActionsMenu({
  messageRole,
  onEdit,
  onDelete,
  onRegenerate,
  disabled = false,
}: MessageActionsMenuProps): React.JSX.Element {
  const { t } = useTranslation();
  const isUser = messageRole === 'user';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          disabled={disabled}
          aria-label="Message actions"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {isUser && onEdit && (
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            {t('editMessage')}
          </DropdownMenuItem>
        )}
        {onRegenerate && (
          <>
            {isUser && <DropdownMenuSeparator />}
            <DropdownMenuItem onClick={onRegenerate}>
              <RotateCw className="mr-2 h-4 w-4" />
              {t('regenerateFromHere')}
            </DropdownMenuItem>
          </>
        )}
        {onDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              {t('deleteMessage')}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

