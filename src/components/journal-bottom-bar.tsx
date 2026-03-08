'use client';

import { CalendarDays, PenLine, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface JournalBottomBarProps {
  onViewModeChange: (mode: 'chat' | 'summary') => void;
  onSidebarToggle: () => void;
  shouldShowChat: boolean;
}

interface BottomBarTabProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  ariaSelected?: boolean;
}

function BottomBarTab({ icon, label, isActive, onClick, ariaSelected }: BottomBarTabProps): React.JSX.Element {
  return (
    <button
      role="tab"
      type="button"
      aria-selected={ariaSelected}
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
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-sm border-t border-border"
      aria-label="Navigation principale"
    >
      <div role="tablist" className="flex items-stretch h-16">
        <BottomBarTab
          icon={<CalendarDays className="h-5 w-5" />}
          label="Entrées"
          isActive={false}
          ariaSelected={undefined}
          onClick={onSidebarToggle}
        />
        <BottomBarTab
          icon={<PenLine className="h-5 w-5" />}
          label="Journal"
          isActive={!shouldShowChat}
          ariaSelected={!shouldShowChat}
          onClick={() => onViewModeChange('summary')}
        />
        <BottomBarTab
          icon={<Sparkles className="h-5 w-5" />}
          label="Chat IA"
          isActive={shouldShowChat}
          ariaSelected={shouldShowChat}
          onClick={() => onViewModeChange('chat')}
        />
      </div>
    </nav>
  );
}
