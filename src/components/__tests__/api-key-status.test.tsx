import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiKeyStatus } from '../api-key-status';
import { OpenRouterApiKeyContext } from '@/context/OpenRouterApiKeyContext';
import { useTranslation } from '@/hooks/use-translation';

vi.mock('@/hooks/use-translation');

describe('ApiKeyStatus', () => {
  const mockOnReset = vi.fn();
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
        <ApiKeyStatus onReset={mockOnReset} />
      </OpenRouterApiKeyContext.Provider>
    );

  it('should display configured status when API key exists', () => {
    renderWithContext('test-api-key');

    expect(screen.getByText('openRouterApiKeyConfigured')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should display not configured status when API key is null', () => {
    renderWithContext(null);

    expect(screen.getByText('openRouterApiKeyNotConfigured')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should call onReset when reset button is clicked', async () => {
    const user = userEvent.setup();
    renderWithContext('test-api-key');

    const resetButton = screen.getByRole('button');
    await user.click(resetButton);

    expect(mockOnReset).toHaveBeenCalledTimes(1);
  });

  it('should show reset button only when API key exists', () => {
    const { rerender } = renderWithContext('test-api-key');
    expect(screen.getByRole('button')).toBeInTheDocument();

    rerender(
      <OpenRouterApiKeyContext.Provider
        value={{
          apiKey: null,
          setApiKey: vi.fn(),
          resetApiKey: vi.fn(),
          isLoading: false,
        }}
      >
        <ApiKeyStatus onReset={mockOnReset} />
      </OpenRouterApiKeyContext.Provider>
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

