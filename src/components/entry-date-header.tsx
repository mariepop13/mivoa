'use client';

import { format } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import { useContext } from 'react';
import { LanguageContext } from '@/context/LanguageContext';

interface EntryDateHeaderProps {
  date: Date;
}

export function EntryDateHeader({ date }: EntryDateHeaderProps): React.JSX.Element {
  const { language } = useContext(LanguageContext);
  const dateLocale = language === 'fr' ? fr : enUS;
  const formattedDate = format(date, "EEEE, MMMM d, yyyy", { locale: dateLocale });

  return (
    <div className="mb-6 px-6 pt-6">
      <h1 className="text-2xl font-headline font-semibold text-foreground mb-2">
        {formattedDate}
      </h1>
      <div className="h-px bg-border" />
    </div>
  );
}

