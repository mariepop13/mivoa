import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DatePicker } from '../date-picker';
import { LanguageContext } from '@/context/LanguageContext';
import { useEntryDates } from '@/hooks/use-entry-dates';
import { useTranslation } from '@/hooks/use-translation';
import { format, parse } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';

vi.mock('@/hooks/use-entry-dates');
vi.mock('@/hooks/use-translation');
vi.mock('date-fns', async () => {
  const actual = await vi.importActual('date-fns');
  return {
    ...actual,
    format: vi.fn((date: Date, formatStr: string, options?: { locale: any }) => {
      if (formatStr === 'yyyy-MM-dd') {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      if (formatStr === 'MMMM d, yyyy') {
        const monthNames = options?.locale?.code === 'fr' 
          ? ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
          : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const month = monthNames[date.getMonth()];
        const day = date.getDate();
        const year = date.getFullYear();
        return `${month} ${day}, ${year}`;
      }
      if (options?.locale?.code === 'fr') {
        return 'lundi, 15 janvier 2024';
      }
      return 'Monday, January 15, 2024';
    }),
    parse: vi.fn((dateString: string, formatStr: string, referenceDate: Date) => {
      const [year, month, day] = dateString.split('-').map(Number);
      return new Date(year, month - 1, day);
    }),
  };
});

describe('DatePicker', () => {
  const mockOnChange = vi.fn();
  const mockDate = new Date(2024, 0, 15);
  const mockT = vi.fn((key: string) => key);

  const renderWithLanguage = (language: 'en' | 'fr', props?: { showDatesList?: boolean }) => {
    return render(
      <LanguageContext.Provider
        value={{
          language,
          setLanguage: vi.fn(),
          supportedLanguages: ['en', 'fr'],
        }}
      >
        <DatePicker value={mockDate} onChange={mockOnChange} {...props} />
      </LanguageContext.Provider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTranslation).mockReturnValue({
      t: mockT,
      language: 'en',
      isLoading: false,
      error: null,
    });
    vi.mocked(useEntryDates).mockReturnValue({
      dates: ['2024-01-15', '2024-01-14', '2024-01-13'],
      isLoading: false,
    });
  });

  it('should render formatted date in English when language is en', () => {
    renderWithLanguage('en');

    expect(format).toHaveBeenCalledWith(
      mockDate,
      'EEEE, MMMM d, yyyy',
      { locale: enUS }
    );
    expect(screen.getByText('Monday, January 15, 2024')).toBeInTheDocument();
  });

  it('should render formatted date in French when language is fr', () => {
    renderWithLanguage('fr');

    expect(format).toHaveBeenCalledWith(
      mockDate,
      'EEEE, MMMM d, yyyy',
      { locale: fr }
    );
    expect(screen.getByText('lundi, 15 janvier 2024')).toBeInTheDocument();
  });

  it('should render calendar icon', () => {
    renderWithLanguage('en');

    const button = screen.getByRole('button', { name: 'Change date' });
    const icon = button.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('should open popover when button is clicked', async () => {
    const user = userEvent.setup();
    renderWithLanguage('en');

    const button = screen.getByRole('button', { name: 'Change date' });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByDisplayValue('2024-01-15')).toBeInTheDocument();
    });
  });

  it('should call onChange when date is selected via input', async () => {
    const user = userEvent.setup();
    renderWithLanguage('en');

    const button = screen.getByRole('button', { name: 'Change date' });
    await user.click(button);

    const dateInput = await waitFor(() => {
      return screen.getByDisplayValue('2024-01-15') as HTMLInputElement;
    });

    fireEvent.change(dateInput, { target: { value: '2024-01-20' } });

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalled();
    });

    const callArgs = mockOnChange.mock.calls[0][0];
    expect(callArgs.getFullYear()).toBe(2024);
    expect(callArgs.getMonth()).toBe(0);
    expect(callArgs.getDate()).toBe(20);
  });

  it('should show dates list tab when showDatesList is true', async () => {
    const user = userEvent.setup();
    renderWithLanguage('en', { showDatesList: true });

    const button = screen.getByRole('button', { name: 'Change date' });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText('selectDate')).toBeInTheDocument();
      expect(screen.getByText('datesWithEntries')).toBeInTheDocument();
    });
  });

  it('should hide dates list tab when showDatesList is false', async () => {
    const user = userEvent.setup();
    renderWithLanguage('en', { showDatesList: false });

    const button = screen.getByRole('button', { name: 'Change date' });
    await user.click(button);

    await waitFor(() => {
      expect(screen.queryByText('selectDate')).not.toBeInTheDocument();
      expect(screen.queryByText('datesWithEntries')).not.toBeInTheDocument();
    });
  });

  it('should switch to dates list view when dates with entries button is clicked', async () => {
    const user = userEvent.setup();
    renderWithLanguage('en', { showDatesList: true });

    const button = screen.getByRole('button', { name: 'Change date' });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText('datesWithEntries')).toBeInTheDocument();
    });

    const datesListButton = screen.getByText('datesWithEntries');
    await user.click(datesListButton);

    await waitFor(() => {
      const dateButtons = screen.getAllByText(/January \d+, 2024/);
      expect(dateButtons.length).toBeGreaterThan(0);
    });
  });

  it('should call onChange when date is selected from dates list', async () => {
    const user = userEvent.setup();
    renderWithLanguage('en', { showDatesList: true });

    const button = screen.getByRole('button', { name: 'Change date' });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText('datesWithEntries')).toBeInTheDocument();
    });

    const datesListButton = screen.getByText('datesWithEntries');
    await user.click(datesListButton);

    await waitFor(() => {
      const dateButtons = screen.getAllByText(/January \d+, 2024/);
      expect(dateButtons.length).toBeGreaterThan(0);
    });

    const dateButtons = screen.getAllByText(/January \d+, 2024/);
    const jan14Button = dateButtons.find(btn => btn.textContent?.includes('January 14'));
    if (jan14Button) {
      await user.click(jan14Button);
    }

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalled();
    });

    const callArgs = mockOnChange.mock.calls[0][0];
    expect(callArgs.getFullYear()).toBe(2024);
    expect(callArgs.getMonth()).toBe(0);
    expect(callArgs.getDate()).toBe(14);
  });

  it('should show loading state when dates are loading', async () => {
    vi.mocked(useEntryDates).mockReturnValue({
      dates: [],
      isLoading: true,
    });

    const user = userEvent.setup();
    renderWithLanguage('en', { showDatesList: true });

    const button = screen.getByRole('button', { name: 'Change date' });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText('datesWithEntries')).toBeInTheDocument();
    });

    const datesListButton = screen.getByText('datesWithEntries');
    await user.click(datesListButton);

    await waitFor(() => {
      expect(screen.getByText('loading')).toBeInTheDocument();
    });
  });

  it('should show no entries message when dates list is empty', async () => {
    vi.mocked(useEntryDates).mockReturnValue({
      dates: [],
      isLoading: false,
    });

    const user = userEvent.setup();
    renderWithLanguage('en', { showDatesList: true });

    const button = screen.getByRole('button', { name: 'Change date' });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText('datesWithEntries')).toBeInTheDocument();
    });

    const datesListButton = screen.getByText('datesWithEntries');
    await user.click(datesListButton);

    await waitFor(() => {
      expect(screen.getByText('noEntriesYet')).toBeInTheDocument();
    });
  });

  it('should highlight selected date in dates list', async () => {
    const user = userEvent.setup();
    renderWithLanguage('en', { showDatesList: true });

    const button = screen.getByRole('button', { name: 'Change date' });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText('datesWithEntries')).toBeInTheDocument();
    });

    const datesListButton = screen.getByText('datesWithEntries');
    await user.click(datesListButton);

    await waitFor(() => {
      const dateButtons = screen.getAllByText(/January \d+, 2024/);
      expect(dateButtons.length).toBeGreaterThan(0);
    });

    const dateButtons = screen.getAllByText(/January \d+, 2024/);
    expect(dateButtons.length).toBeGreaterThan(0);
    
    const selectedDateButton = dateButtons.find(btn => 
      btn.textContent?.includes('January 15') && 
      (btn.className.includes('bg-primary/10') || btn.className.includes('bg-primary'))
    );
    expect(selectedDateButton).toBeDefined();
  });

  it('should close popover after date selection', async () => {
    const user = userEvent.setup();
    renderWithLanguage('en');

    const button = screen.getByRole('button', { name: 'Change date' });
    await user.click(button);

    const dateInput = await waitFor(() => {
      return screen.getByDisplayValue('2024-01-15') as HTMLInputElement;
    });

    fireEvent.change(dateInput, { target: { value: '2024-01-20' } });

    await waitFor(() => {
      expect(screen.queryByDisplayValue('2024-01-20')).not.toBeInTheDocument();
    });
  });

  it('should not call onChange when date input is empty', async () => {
    const user = userEvent.setup();
    renderWithLanguage('en');

    const button = screen.getByRole('button', { name: 'Change date' });
    await user.click(button);

    const dateInput = await waitFor(() => {
      return screen.getByDisplayValue('2024-01-15') as HTMLInputElement;
    });

    fireEvent.change(dateInput, { target: { value: '' } });

    await waitFor(() => {
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });
});

