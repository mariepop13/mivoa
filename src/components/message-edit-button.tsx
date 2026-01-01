'use client';

import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';

interface MessageEditButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export function MessageEditButton({
  onClick,
  disabled = false,
  className,
}: MessageEditButtonProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      disabled={disabled}
      className={cn('h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity', className)}
      aria-label={t('editMessage')}
    >
      <Pencil className="h-4 w-4" />
    </Button>
  );
}

