import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsThemeSection } from '../settings-theme-section';
import { useTheme } from 'next-themes';
import { useTranslation } from '@/hooks/use-translation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

vi.mock('next-themes', () => ({
  useTheme: vi.fn(),
}));

vi.mock('@/hooks/use-translation');

describe('SettingsThemeSection', () => {
  const mockSetTheme = vi.fn();
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

  interface UseThemeReturn {
    theme: string | undefined;
    setTheme: (theme: string | ((prev: string) => string)) => void;
    themes: string[];
    resolvedTheme: string | undefined;
    systemTheme: 'light' | 'dark' | undefined;
  }

  const renderWithTheme = (theme: string | undefined) => {
    vi.mocked(useTheme).mockReturnValue({
      theme,
      setTheme: mockSetTheme,
      themes: ['light', 'dark', 'system'],
      resolvedTheme: theme,
      systemTheme: 'light',
    } as UseThemeReturn);

    return render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <SettingsThemeSection />
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  it('should render label', async () => {
    const user = userEvent.setup();
    renderWithTheme('light');
    
    const trigger = screen.getByText('Open');
    await user.click(trigger);
    
    expect(screen.getByText('theme')).toBeInTheDocument();
  });

  it('should render all theme options', async () => {
    const user = userEvent.setup();
    renderWithTheme('light');
    
    const trigger = screen.getByText('Open');
    await user.click(trigger);
    
    expect(screen.getByText('light')).toBeInTheDocument();
    expect(screen.getByText('dark')).toBeInTheDocument();
    expect(screen.getByText('system')).toBeInTheDocument();
  });

  it('should show checkmark for selected theme', async () => {
    const user = userEvent.setup();
    renderWithTheme('dark');
    
    const trigger = screen.getByText('Open');
    await user.click(trigger);
    
    const darkItem = screen.getByText('dark').closest('[role="menuitemradio"]');
    expect(darkItem).toHaveAttribute('aria-checked', 'true');
  });

  it('should call setTheme when theme item is clicked', async () => {
    const user = userEvent.setup();
    renderWithTheme('light');

    const trigger = screen.getByText('Open');
    await user.click(trigger);

    const darkItem = screen.getByText('dark').closest('[role="menuitemradio"]');
    expect(darkItem).not.toBeNull();
    expect(darkItem).toBeInTheDocument();
    
    await user.click(darkItem!);
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });
});

