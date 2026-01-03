'use client';

import { DatePicker } from '@/components/date-picker';
import { SettingsMenu } from '@/components/settings-menu';
import { UserMenu } from '@/components/user-menu';
import type { JournalEntryData } from '@/hooks/use-journal-entries';

interface SidebarHeaderProps {
  selectedDate: Date;
  entries: (JournalEntryData & { id: string })[] | null;
  onDateChange: (date: Date) => void;
  onClose: () => void;
  t: (key: string) => string;
}

export function SidebarHeader({
  selectedDate,
  entries,
  onDateChange,
  onClose,
  t,
}: SidebarHeaderProps): React.JSX.Element {
  return (
    <div className="p-4 sm:p-6 border-b border-border">
      <div className="flex flex-col gap-3 mb-2 items-end">
        <div className="flex items-center justify-end gap-2 w-full">
          <div className="flex justify-end min-w-0 [&_button]:!w-auto [&_button]:!justify-end [&_button]:!text-right">
            <DatePicker value={selectedDate} onChange={onDateChange} />
          </div>
          <button
            onClick={onClose}
            aria-label={t('close')}
            className="lg:hidden p-2 hover:bg-accent rounded-lg transition-colors flex-shrink-0"
          >
            <span className="text-2xl">×</span>
          </button>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <UserMenu />
          <SettingsMenu />
        </div>
      </div>
      {entries && entries.length > 0 && (
        <p className="text-xs sm:text-sm text-muted-foreground">
          {entries.length} {entries.length === 1 ? t('entry') : t('entries')} {t('today')}
        </p>
      )}
    </div>
  );
}

