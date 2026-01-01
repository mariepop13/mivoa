import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EntryDateHeader } from '../entry-date-header';
import { LanguageContext } from '@/context/LanguageContext';
import { format } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';

vi.mock('date-fns', () => ({
  format: vi.fn((date: Date, formatStr: string, options: { locale: { code: string } }) => {
    if (options.locale.code === 'fr') {
      return 'lundi, 15 janvier 2024';
    }
    return 'Monday, January 15, 2024';
  }),
  enUS: { code: 'en' },
  fr: { code: 'fr' },
}));

describe('EntryDateHeader', () => {
  const mockDate = new Date('2024-01-15');

  const renderWithLanguage = (language: 'en' | 'fr') => render(
      <LanguageContext.Provider
        value={{
          language,
          setLanguage: vi.fn(),
          supportedLanguages: ['en', 'fr'],
        }}
      >
        <EntryDateHeader date={mockDate} />
      </LanguageContext.Provider>
    );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should format date in English when language is en', () => {
    renderWithLanguage('en');

    expect(format).toHaveBeenCalledWith(mockDate, 'EEEE, MMMM d, yyyy', { locale: enUS });
    expect(screen.getByText('Monday, January 15, 2024')).toBeInTheDocument();
  });

  it('should format date in French when language is fr', () => {
    renderWithLanguage('fr');

    expect(format).toHaveBeenCalledWith(mockDate, 'EEEE, do MMMM yyyy', { locale: fr });
    expect(screen.getByText('lundi, 15 janvier 2024')).toBeInTheDocument();
  });

  it('should render the formatted date as heading', () => {
    renderWithLanguage('en');

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('Monday, January 15, 2024');
  });

  it('should render a separator line', () => {
    const { container } = renderWithLanguage('en');

    const separator = container.querySelector('.h-px.bg-border');
    expect(separator).toBeInTheDocument();
  });
});

