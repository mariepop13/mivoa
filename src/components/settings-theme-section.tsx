'use client';

import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';

export function SettingsThemeSection(): React.JSX.Element {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <div className="space-y-1 p-1">
      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 px-2">
        {t('theme')}
      </label>
      <DropdownMenuItem
        onClick={() => setTheme('light')}
        className={cn(
          'flex items-center justify-between cursor-pointer',
          theme === 'light' && 'bg-accent'
        )}
        role="menuitemradio"
        aria-checked={theme === 'light'}
      >
        <div className="flex items-center gap-2">
          <Sun className="h-4 w-4" />
          <span>{t('light')}</span>
        </div>
        {theme === 'light' && <Check className="h-4 w-4" />}
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => setTheme('dark')}
        className={cn(
          'flex items-center justify-between cursor-pointer',
          theme === 'dark' && 'bg-accent'
        )}
        role="menuitemradio"
        aria-checked={theme === 'dark'}
      >
        <div className="flex items-center gap-2">
          <Moon className="h-4 w-4" />
          <span>{t('dark')}</span>
        </div>
        {theme === 'dark' && <Check className="h-4 w-4" />}
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => setTheme('system')}
        className={cn(
          'flex items-center justify-between cursor-pointer',
          theme === 'system' && 'bg-accent'
        )}
        role="menuitemradio"
        aria-checked={theme === 'system'}
      >
        <div className="flex items-center gap-2">
          <Monitor className="h-4 w-4" />
          <span>{t('system')}</span>
        </div>
        {theme === 'system' && <Check className="h-4 w-4" />}
      </DropdownMenuItem>
    </div>
  );
}


