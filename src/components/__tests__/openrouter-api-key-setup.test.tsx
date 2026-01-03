import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OpenRouterApiKeySetup } from '../openrouter-api-key-setup';
import { OpenRouterApiKeyContext } from '@/context/OpenRouterApiKeyContext';
import { useTranslation } from '@/hooks/use-translation';

vi.mock('@/hooks/use-translation');
vi.mock('../api-key-form', () => ({
  ApiKeyForm: ({ onSubmit }: { onSubmit: (key: string) => void }) => (
    <button onClick={() => onSubmit('test-key')}>Submit Key</button>
  ),
}));
vi.mock('../oauth-connect-button', () => ({
  OAuthConnectButton: () => <div data-testid="oauth-button">OAuth</div>,
}));
vi.mock('../api-key-status', () => ({
  ApiKeyStatus: ({ onReset }: { onReset: () => void }) => (
    <button onClick={onReset} data-testid="reset-button">Reset</button>
  ),
}));

describe('OpenRouterApiKeySetup', () => {
  const mockSetApiKey = vi.fn();
  const mockResetApiKey = vi.fn();
  const mockOnCompletion = vi.fn();
  const mockT = vi.fn((key: string) => key);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTranslation).mockReturnValue({
      t: mockT,
      language: 'en',
      isLoading: false,
      error: null,
    });
    global.confirm = vi.fn(() => true);
  });

  const renderWithContext = (apiKey: string | null) => render(
      <OpenRouterApiKeyContext.Provider
        value={{
          apiKey,
          setApiKey: mockSetApiKey,
          resetApiKey: mockResetApiKey,
          isLoading: false,
        }}
      >
        <OpenRouterApiKeySetup onCompletion={mockOnCompletion} />
      </OpenRouterApiKeyContext.Provider>
    );

  it('should render ApiKeyStatus', () => {
    renderWithContext(null);
    expect(screen.getByTestId('reset-button')).toBeInTheDocument();
  });

  it('should render setup form when API key is not configured', () => {
    renderWithContext(null);
    expect(screen.getByTestId('oauth-button')).toBeInTheDocument();
    expect(screen.getByText('Submit Key')).toBeInTheDocument();
  });

  it('should not render setup form when API key is configured', () => {
    renderWithContext('test-key');
    expect(screen.queryByTestId('oauth-button')).not.toBeInTheDocument();
    expect(screen.queryByText('Submit Key')).not.toBeInTheDocument();
  });

  it('should call setApiKey and onCompletion when form is submitted', async () => {
    const user = userEvent.setup();
    renderWithContext(null);

    const submitButton = screen.getByText('Submit Key');
    await user.click(submitButton);

    expect(mockSetApiKey).toHaveBeenCalledWith('test-key');
    expect(mockOnCompletion).toHaveBeenCalledTimes(1);
  });

  it('should handle setApiKey errors', async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockSetApiKey.mockRejectedValue(new Error('Save failed'));

    renderWithContext(null);

    const submitButton = screen.getByText('Submit Key');
    await user.click(submitButton);

    expect(screen.getByText('Save failed')).toBeInTheDocument();
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should call resetApiKey when reset is confirmed', async () => {
    const user = userEvent.setup();
    renderWithContext('test-key');

    const resetButton = screen.getByTestId('reset-button');
    await user.click(resetButton);

    expect(global.confirm).toHaveBeenCalled();
    expect(mockResetApiKey).toHaveBeenCalledTimes(1);
  });

  it('should not call resetApiKey when reset is cancelled', async () => {
    const user = userEvent.setup();
    global.confirm = vi.fn(() => false);

    renderWithContext('test-key');

    const resetButton = screen.getByTestId('reset-button');
    await user.click(resetButton);

    expect(global.confirm).toHaveBeenCalled();
    expect(mockResetApiKey).not.toHaveBeenCalled();
  });

  it('should handle resetApiKey errors', async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    window.alert = vi.fn();
    mockResetApiKey.mockRejectedValue(new Error('Reset failed'));

    renderWithContext('test-key');

    const resetButton = screen.getByTestId('reset-button');
    await user.click(resetButton);

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith('Failed to reset API key. Please try again.');

    consoleErrorSpy.mockRestore();
  });
});

