'use client';

import { useContext } from 'react';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';
import { LanguageContext, SUPPORTED_LANGUAGES, LANGUAGE_LABELS } from '@/context/LanguageContext';

export function SettingsLanguageSection(): React.JSX.Element {
  const { language, setLanguage } = useContext(LanguageContext);
  const { t } = useTranslation();

  return (
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
  );
}


