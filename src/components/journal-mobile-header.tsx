'use client';

import { useTranslation } from '@/hooks/use-translation';
import { UserMenu } from '@/components/user-menu';
import { SettingsMenu } from '@/components/settings-menu';

interface JournalMobileHeaderProps {
  title: string;
  onSidebarToggle: () => void;
  isSidebarOpen: boolean;
}

export function JournalMobileHeader({ title, onSidebarToggle, isSidebarOpen }: JournalMobileHeaderProps): React.JSX.Element {
  const { t } = useTranslation();
  
  return (
    <div className="lg:hidden p-4 border-b border-border bg-card flex items-center justify-between">
      <button
        onClick={onSidebarToggle}
        aria-label={t('toggleSidebar')}
        aria-expanded={isSidebarOpen}
        className="p-2 hover:bg-accent rounded-lg transition-colors"
      >
        <span className="text-xl">☰</span>
      </button>
      <h2 className="text-lg font-headline font-semibold text-foreground">
        {title}
      </h2>
      <div className="flex items-center gap-2">
        <UserMenu />
        <SettingsMenu />
      </div>
    </div>
  );
}

