'use client';

import { format, parse, type Locale } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import { Calendar, History } from 'lucide-react';
import { useContext, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { LanguageContext } from '@/context/LanguageContext';
import { useEntryDates } from '@/hooks/use-entry-dates';
import { useTranslation } from '@/hooks/use-translation';

const DISPLAY_DATE_FORMAT_EN = "EEEE, MMMM d, yyyy";
const DISPLAY_DATE_FORMAT_FR = "EEEE, do MMMM yyyy";
const INPUT_DATE_FORMAT = 'yyyy-MM-dd';
const SHORT_DATE_FORMAT = "MMMM d, yyyy";
const DATE_PARTS_COUNT = 3;
const MONTH_OFFSET = 1;

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
  const displayDateFormat = language === 'fr' ? DISPLAY_DATE_FORMAT_FR : DISPLAY_DATE_FORMAT_EN;
  const formattedDate = format(value, displayDateFormat, { locale: dateLocale });
  const inputValue = format(value, INPUT_DATE_FORMAT);
  const entryDatesResult = useEntryDates();
  const { dates, isLoading: datesLoading } = enableDatesList ? entryDatesResult : { dates: [], isLoading: false };

  const isValidDate = (date: Date): boolean => !isNaN(date.getTime());

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const dateString = event.target.value;
    if (!dateString) return;
    
    const dateParts = dateString.split('-');
    if (dateParts.length !== DATE_PARTS_COUNT) return;
    
    const [year, month, day] = dateParts.map(Number);
    const newDate = new Date(year, month - MONTH_OFFSET, day);
    
    if (isValidDate(newDate)) {
      onChange(newDate);
      setOpen(false);
    }
  };

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
          {enableDatesList && renderDateListToggle(showDatesList, setShowDatesList, t)}
          {enableDatesList && showDatesList
            ? renderDatesList({ datesLoading, dates, inputValue, dateLocale, handleDateSelect, t })
            : renderDateInput(inputValue, handleDateChange)}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function renderDateListToggle(
  showDatesList: boolean,
  setShowDatesList: (show: boolean) => void,
  t: (key: string) => string
): React.ReactNode {
  return (
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
  );
}

interface DatesListConfig {
  datesLoading: boolean;
  dates: string[];
  inputValue: string;
  dateLocale: Locale;
  handleDateSelect: (dateString: string) => void;
  t: (key: string) => string;
}

function renderDatesList(config: DatesListConfig): React.ReactNode {
  if (config.datesLoading) {
    return (
      <div className="text-sm text-muted-foreground py-4 text-center">
        {config.t('loading')}
      </div>
    );
  }

  if (config.dates.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-4 text-center">
        {config.t('noEntriesYet')}
      </div>
    );
  }

  return (
    <div className="max-h-64 overflow-y-auto">
      <div className="space-y-1">
        {config.dates.map((dateString) => {
          const dateObj = parse(dateString, INPUT_DATE_FORMAT, new Date());
          const formatted = format(dateObj, SHORT_DATE_FORMAT, { locale: config.dateLocale });
          const isSelected = dateString === config.inputValue;
          return (
            <button
              key={dateString}
              type="button"
              onClick={() => config.handleDateSelect(dateString)}
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
    </div>
  );
}

function renderDateInput(
  inputValue: string,
  handleDateChange: (event: React.ChangeEvent<HTMLInputElement>) => void
): React.ReactNode {
  return (
    <input
      type="date"
      value={inputValue}
      onChange={handleDateChange}
      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    />
  );
}

