'use client';

import { format, parse } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import { Calendar, History } from 'lucide-react';
import { useContext, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { LanguageContext } from '@/context/LanguageContext';
import { useEntryDates } from '@/hooks/use-entry-dates';
import { useTranslation } from '@/hooks/use-translation';

const DISPLAY_DATE_FORMAT = "EEEE, MMMM d, yyyy";
const INPUT_DATE_FORMAT = 'yyyy-MM-dd';
const SHORT_DATE_FORMAT = "MMMM d, yyyy";

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  showDatesList?: boolean;
}

export function DatePicker({
  value,
  onChange,
  showDatesList: enableDatesList = true,
}: DatePickerProps): React.JSX.Element {
  const { language } = useContext(LanguageContext);
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [showDatesList, setShowDatesList] = useState(false);
  const dateLocale = language === 'fr' ? fr : enUS;
  const formattedDate = format(value, DISPLAY_DATE_FORMAT, { locale: dateLocale });
  const inputValue = format(value, INPUT_DATE_FORMAT);
  const entryDatesResult = useEntryDates();
  const { dates, isLoading: datesLoading } = enableDatesList ? entryDatesResult : { dates: [], isLoading: false };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const dateString = event.target.value;
    if (!dateString) return;
    
    const [year, month, day] = dateString.split('-').map(Number);
    const newDate = new Date(year, month - 1, day);
    
    if (isValidDate(newDate)) {
      onChange(newDate);
      setOpen(false);
    }
  };

  const isValidDate = (date: Date): boolean => !isNaN(date.getTime());

  const handleDateSelect = (dateString: string) => {
    const parsedDate = parse(dateString, INPUT_DATE_FORMAT, new Date());
    if (isValidDate(parsedDate)) {
      onChange(parsedDate);
      setShowDatesList(false);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="h-auto p-0 font-headline font-bold text-xl sm:text-2xl text-foreground 
            hover:bg-accent/50 text-left justify-start w-full min-w-0 whitespace-normal"
          aria-label="Change date"
        >
          <Calendar className="mr-2 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 mt-0.5" />
          <span className="break-words leading-tight">{formattedDate}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 space-y-3">
          {enableDatesList && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowDatesList(false)}
                className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
                  !showDatesList
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-accent'
                }`}
              >
                {t('selectDate')}
              </button>
              <button
                type="button"
                onClick={() => setShowDatesList(true)}
                className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors flex items-center justify-center gap-2 ${
                  showDatesList
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-accent'
                }`}
              >
                <History className="h-4 w-4" />
                {t('datesWithEntries')}
              </button>
            </div>
          )}
          {enableDatesList && showDatesList ? (
            <div className="max-h-64 overflow-y-auto">
              {datesLoading && (
                <div className="text-sm text-muted-foreground py-4 text-center">
                  {t('loading')}
                </div>
              )}
              {!datesLoading && dates.length === 0 && (
                <div className="text-sm text-muted-foreground py-4 text-center">
                  {t('noEntriesYet')}
                </div>
              )}
              {!datesLoading && dates.length > 0 && (
                <div className="space-y-1">
                  {dates.map((dateString) => {
                    const dateObj = parse(dateString, INPUT_DATE_FORMAT, new Date());
                    const formatted = format(dateObj, SHORT_DATE_FORMAT, { locale: dateLocale });
                    const isSelected = dateString === inputValue;
                    return (
                      <button
                        key={dateString}
                        type="button"
                        onClick={() => handleDateSelect(dateString)}
                        className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                          isSelected
                            ? 'bg-primary/10 text-primary border border-primary/20'
                            : 'hover:bg-accent text-foreground'
                        }`}
                      >
                        {formatted}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <input
              type="date"
              value={inputValue}
              onChange={handleDateChange}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

