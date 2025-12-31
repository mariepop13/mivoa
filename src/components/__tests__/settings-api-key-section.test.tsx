import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsApiKeySection } from '../settings-api-key-section';
import { OpenRouterApiKeyContext } from '@/context/OpenRouterApiKeyContext';
import { useTranslation } from '@/hooks/use-translation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

vi.mock('@/hooks/use-translation');

describe('SettingsApiKeySection', () => {
  const mockOnOpenDialog = vi.fn();
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

  const renderWithContext = (apiKey: string | null) => render(
      <OpenRouterApiKeyContext.Provider
        value={{
          apiKey,
          setApiKey: vi.fn(),
          resetApiKey: vi.fn(),
          isLoading: false,
        }}
      >
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <SettingsApiKeySection onOpenDialog={mockOnOpenDialog} />
          </DropdownMenuContent>
        </DropdownMenu>
      </OpenRouterApiKeyContext.Provider>
    );

  it('should render label', async () => {
    const user = userEvent.setup();
    renderWithContext(null);
    
    const trigger = screen.getByText('Open');
    await user.click(trigger);
    
    expect(screen.getByText('openRouterApiKey')).toBeInTheDocument();
  });

  it('should show configured status when API key exists', async () => {
    const user = userEvent.setup();
    renderWithContext('test-api-key');
    
    const trigger = screen.getByText('Open');
    await user.click(trigger);
    
    expect(screen.getByText('openRouterApiKeyConfigured')).toBeInTheDocument();
  });

  it('should show not configured status when API key is null', async () => {
    const user = userEvent.setup();
    renderWithContext(null);
    
    const trigger = screen.getByText('Open');
    await user.click(trigger);
    
    expect(screen.getByText('openRouterApiKeyNotConfigured')).toBeInTheDocument();
  });

  it('should call onOpenDialog when clicked', async () => {
    const user = userEvent.setup();
    renderWithContext(null);

    const trigger = screen.getByText('Open');
    await user.click(trigger);

    const menuItem = screen.getByRole('menuitem');
    await user.click(menuItem);

    expect(mockOnOpenDialog).toHaveBeenCalledTimes(1);
  });
});

