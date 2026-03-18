import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsLanguageSection } from '../settings-language-section';
import { LanguageContext, SUPPORTED_LANGUAGES } from '@/context/LanguageContext';
import { useTranslation } from '@/hooks/use-translation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

vi.mock('@/hooks/use-translation');

describe('SettingsLanguageSection', () => {
  const mockSetLanguage = vi.fn();
  const mockT = vi.fn((key: string) => key);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTranslation).mockReturnValue({
      t: mockT,
      language: 'en',
      isLoading: false,
      error: null,
    });
  });

  const renderWithContext = (language: 'en' | 'fr') => render(
      <LanguageContext.Provider
        value={{
          language,
          setLanguage: mockSetLanguage,
          supportedLanguages: SUPPORTED_LANGUAGES,
          t: (key: string) => key,
          isLoading: false,
          error: null,
        }}
      >
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <SettingsLanguageSection />
          </DropdownMenuContent>
        </DropdownMenu>
      </LanguageContext.Provider>
    );

  it('should render label', async () => {
    const user = userEvent.setup();
    renderWithContext('en');
    
    const trigger = screen.getByText('Open');
    await user.click(trigger);
    
    expect(screen.getByText('language')).toBeInTheDocument();
  });

  it('should render all supported languages', async () => {
    const user = userEvent.setup();
    renderWithContext('en');
    
    const trigger = screen.getByText('Open');
    await user.click(trigger);
    
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('Français')).toBeInTheDocument();
  });

  it('should show checkmark for selected language', async () => {
    const user = userEvent.setup();
    renderWithContext('fr');
    
    const trigger = screen.getByText('Open');
    await user.click(trigger);
    
    const frItem = screen.getByText('Français').closest('[role="menuitemradio"]');
    expect(frItem).toHaveAttribute('aria-checked', 'true');
  });

  it('should call setLanguage when language item is clicked', async () => {
    const user = userEvent.setup();
    renderWithContext('en');

    const trigger = screen.getByText('Open');
    await user.click(trigger);

    const frItem = screen.getByText('Français').closest('[role="menuitemradio"]');
    expect(frItem).not.toBeNull();
    expect(frItem).toBeInTheDocument();
    
    await user.click(frItem!);
    expect(mockSetLanguage).toHaveBeenCalledWith('fr');
  });
});

