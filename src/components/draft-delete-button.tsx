'use client';

import { Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DraftDeleteButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  variant?: 'ghost' | 'destructive' | 'outline' | 'default' | 'secondary' | 'link';
  size?: 'sm' | 'default' | 'lg' | 'icon';
  className?: string;
  'aria-label'?: string;
}

export function DraftDeleteButton({
  onClick,
  isLoading = false,
  disabled = false,
  variant = 'ghost',
  size = 'icon',
  className,
  'aria-label': ariaLabel,
}: DraftDeleteButtonProps): React.JSX.Element {
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(className)}
      aria-label={ariaLabel || 'Delete draft'}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </Button>
  );
}

