'use client';

import { useTranslation } from '@/hooks/use-translation';

interface JournalMobileHeaderProps {
  title: string;
  onSidebarToggle: () => void;
  isSidebarOpen: boolean;
}

export function JournalMobileHeader({ title, onSidebarToggle, isSidebarOpen }: JournalMobileHeaderProps): React.JSX.Element {
  const { t } = useTranslation();
  
  return (
    <div className="lg:hidden p-4 border-b border-border/60 bg-card/95 backdrop-blur-sm flex items-center justify-between sticky top-0 z-30">
      <button
        onClick={onSidebarToggle}
        aria-label={t('toggleSidebar')}
        aria-expanded={isSidebarOpen}
        className="p-2 hover:bg-accent rounded-lg transition-colors"
      >
        <span className="text-xl">☰</span>
      </button>
      <h2 className="text-base sm:text-lg font-headline font-semibold text-foreground truncate flex-1 mx-3 text-center">
        {title}
      </h2>
      <div className="w-10" /> {/* Spacer for alignment */}
    </div>
  );
}

