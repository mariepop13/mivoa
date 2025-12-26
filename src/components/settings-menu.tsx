'use client';

import { useState, useEffect, useContext } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Settings2, Sun, Moon, Monitor, Check } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';
import { LanguageContext, SUPPORTED_LANGUAGES, LANGUAGE_LABELS } from '@/context/LanguageContext';

export function SettingsMenu() {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useContext(LanguageContext);
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Settings2 className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">{t('settings')}</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings2 className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">{t('settings')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex items-center gap-2 px-2 py-2 mb-2 border-b border-border">
          <Settings2 className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold tracking-tight">{t('settings')}</span>
        </div>

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

        <DropdownMenuSeparator />

        <div className="space-y-1 p-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 px-2">
            {t('language')}
          </label>
          {SUPPORTED_LANGUAGES.map((lang) => (
            <DropdownMenuItem
              key={lang}
              onClick={() => setLanguage(lang)}
              className={cn(
                'flex items-center justify-between cursor-pointer',
                language === lang && 'bg-accent'
              )}
              role="menuitemradio"
              aria-checked={language === lang}
            >
              <span>{LANGUAGE_LABELS[lang]}</span>
              {language === lang && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

