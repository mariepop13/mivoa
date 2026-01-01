'use client';

import { format, parse, type Locale } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import { Calendar, History } from 'lucide-react';
import { useContext, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { fr as dayPickerFr, enUS as dayPickerEnUS } from 'react-day-picker/locale';
import 'react-day-picker/dist/style.css';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { LanguageContext } from '@/context/LanguageContext';
import { useEntryDates } from '@/hooks/use-entry-dates';
import { useTranslation } from '@/hooks/use-translation';

const DISPLAY_DATE_FORMAT_EN = "EEEE, MMMM d, yyyy";
const DISPLAY_DATE_FORMAT_FR = "EEEE, do MMMM yyyy";
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
  const dayPickerLocale = language === 'fr' ? dayPickerFr : dayPickerEnUS;
  const displayDateFormat = language === 'fr' ? DISPLAY_DATE_FORMAT_FR : DISPLAY_DATE_FORMAT_EN;
  const formattedDate = format(value, displayDateFormat, { locale: dateLocale });
  const inputValue = format(value, INPUT_DATE_FORMAT);
  const entryDatesResult = useEntryDates();
  const { dates, isLoading: datesLoading } = enableDatesList ? entryDatesResult : { dates: [], isLoading: false };

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
          {enableDatesList && renderDateListToggle(showDatesList, setShowDatesList, t)}
          {enableDatesList && showDatesList
            ? renderDatesList({ datesLoading, dates, inputValue, dateLocale, handleDateSelect, t })
            : renderDateInput({ value, onChange, setOpen, dayPickerLocale })}
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

interface DateInputConfig {
  value: Date;
  onChange: (date: Date) => void;
  setOpen: (open: boolean) => void;
  dayPickerLocale: typeof dayPickerFr | typeof dayPickerEnUS;
}

function renderDateInput({
  value,
  onChange,
  setOpen,
  dayPickerLocale,
}: DateInputConfig): React.ReactNode {
  return (
    <DayPicker
      mode="single"
      selected={value}
      onSelect={(date) => {
        if (date) {
          onChange(date);
          setOpen(false);
        }
      }}
      locale={dayPickerLocale}
      className="rounded-md"
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
        day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside: "text-muted-foreground opacity-50",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
      }}
    />
  );
}

