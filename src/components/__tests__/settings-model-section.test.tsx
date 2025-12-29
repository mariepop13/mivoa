import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsModelSection } from '../settings-model-section';
import { ModelContext } from '@/context/ModelContext';
import { useTranslation } from '@/hooks/use-translation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

vi.mock('@/hooks/use-translation');

describe('SettingsModelSection', () => {
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

  const renderWithContext = (selectedModel: string) => {
    return render(
      <ModelContext.Provider
        value={{
          selectedModel,
          setSelectedModel: vi.fn(),
          isLoading: false,
        }}
      >
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <SettingsModelSection onOpenDialog={mockOnOpenDialog} />
          </DropdownMenuContent>
        </DropdownMenu>
      </ModelContext.Provider>
    );
  };

  it('should render label', async () => {
    const user = userEvent.setup();
    renderWithContext('google/gemini-3-flash-preview');
    
    const trigger = screen.getByText('Open');
    await user.click(trigger);
    
    expect(screen.getByText('aiModel')).toBeInTheDocument();
  });

  it('should show model name when model is selected', async () => {
    const user = userEvent.setup();
    renderWithContext('google/gemini-3-flash-preview');
    
    const trigger = screen.getByText('Open');
    await user.click(trigger);
    
    expect(screen.getByText('gemini-3-flash-preview')).toBeInTheDocument();
  });

  it('should show default text when no model is selected', async () => {
    const user = userEvent.setup();
    renderWithContext('');
    
    const trigger = screen.getByText('Open');
    await user.click(trigger);
    
    expect(screen.getByText('defaultModel')).toBeInTheDocument();
  });

  it('should call onOpenDialog when clicked', async () => {
    const user = userEvent.setup();
    renderWithContext('google/gemini-3-flash-preview');

    const trigger = screen.getByText('Open');
    await user.click(trigger);

    const menuItem = screen.getByRole('menuitem');
    await user.click(menuItem);

    expect(mockOnOpenDialog).toHaveBeenCalledTimes(1);
  });
});

