'use client';

import { CalendarDays, PenLine, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';

interface JournalBottomBarProps {
  onViewModeChange: (mode: 'chat' | 'summary') => void;
  onSidebarToggle: () => void;
  shouldShowChat: boolean;
}

interface NavButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function NavButton({ icon, label, isActive, onClick }: NavButtonProps): React.JSX.Element {
  return (
    <button
      type="button"
      aria-current={isActive ? 'page' : undefined}
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center gap-1 flex-1 py-2 px-1 text-xs font-medium transition-colors',
        isActive
          ? 'text-primary'
          : 'text-muted-foreground hover:text-foreground'
      )}
    >
      <span className={cn(
        'p-1.5 rounded-lg transition-colors',
        isActive ? 'bg-primary/10' : ''
      )}>
        {icon}
      </span>
      {label}
    </button>
  );
}

export function JournalBottomBar({
  onViewModeChange,
  onSidebarToggle,
  shouldShowChat,
}: JournalBottomBarProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-sm border-t border-border"
      aria-label={t('bottomNavAriaLabel')}
    >
      <div className="flex items-stretch h-16">
        <button
          type="button"
          onClick={onSidebarToggle}
          className="flex flex-col items-center justify-center gap-1 flex-1 py-2 px-1 text-xs font-medium transition-colors text-muted-foreground hover:text-foreground"
        >
          <span className="p-1.5 rounded-lg transition-colors">
            <CalendarDays className="h-5 w-5" />
          </span>
          {t('bottomNavEntries')}
        </button>
        <NavButton
          icon={<PenLine className="h-5 w-5" />}
          label={t('bottomNavJournal')}
          isActive={!shouldShowChat}
          onClick={() => onViewModeChange('summary')}
        />
        <NavButton
          icon={<Sparkles className="h-5 w-5" />}
          label={t('bottomNavChat')}
          isActive={shouldShowChat}
          onClick={() => onViewModeChange('chat')}
        />
      </div>
    </nav>
  );
}
