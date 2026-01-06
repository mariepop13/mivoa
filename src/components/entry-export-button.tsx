'use client';

import { Download, Lock } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { useSubscription } from '@/hooks/use-subscription';
import { canExport } from '@/lib/subscription/feature-gate';

interface EntryExportButtonProps {
  entryId: string | null;
  content: string;
  title?: string;
  date: string;
  disabled?: boolean;
}

export function EntryExportButton({
  entryId,
  content,
  title,
  date,
  disabled = false,
}: EntryExportButtonProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const { plan } = useSubscription();

  const hasExportAccess = canExport(plan);

  const handleExport = () => {
    if (!hasExportAccess || !entryId || !content) {
      return;
    }

    const exportContent = title
      ? `${title}\n\n${date}\n\n${content}`
      : `${date}\n\n${content}`;

    const blob = new Blob([exportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${date}-${title || 'entry'}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!hasExportAccess) {
    return (
      <button
        type="button"
        disabled
        className="flex-1 sm:flex-none px-4 py-2.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium active:scale-[0.98] border border-transparent hover:border-border flex items-center justify-center gap-2"
        title={t('subscription.upgradeToUnlock')}
      >
        <Lock className="h-4 w-4" />
        <span className="hidden sm:inline">{t('subscription.export')}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={disabled || !entryId || !content}
      className="flex-1 sm:flex-none px-4 py-2.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium active:scale-[0.98] border border-transparent hover:border-border flex items-center justify-center gap-2"
    >
      <Download className="h-4 w-4" />
      <span className="hidden sm:inline">{t('subscription.export')}</span>
    </button>
  );
}

