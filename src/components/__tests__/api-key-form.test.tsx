import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiKeyForm } from '../api-key-form';
import { validateOpenRouterApiKey } from '@/lib/openrouter-client';
import { useTranslation } from '@/hooks/use-translation';

vi.mock('@/lib/openrouter-client');
vi.mock('@/hooks/use-translation');

describe('ApiKeyForm', () => {
  const mockOnSubmit = vi.fn();
  const mockT = vi.fn((key: string) => key);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTranslation).mockReturnValue({
      t: mockT,
      language: 'en',
      isLoading: false,
      error: null,
    });
    global.alert = vi.fn();
  });

  it('should render form with input and button', () => {
    render(<ApiKeyForm onSubmit={mockOnSubmit} />);

    expect(screen.getByLabelText(/openRouterApiKey/i)).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should disable submit button when input is empty', () => {
    render(<ApiKeyForm onSubmit={mockOnSubmit} />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should enable submit button when input has value', async () => {
    const user = userEvent.setup();
    render(<ApiKeyForm onSubmit={mockOnSubmit} />);

    const input = screen.getByLabelText(/openRouterApiKey/i);
    await user.type(input, 'test-key-1234567890');

    const button = screen.getByRole('button');
    expect(button).not.toBeDisabled();
  });

  it('should call onSubmit when valid API key is submitted', async () => {
    const user = userEvent.setup();
    vi.mocked(validateOpenRouterApiKey).mockResolvedValue(true);

    render(<ApiKeyForm onSubmit={mockOnSubmit} />);

    const input = screen.getByLabelText(/openRouterApiKey/i);
    await user.type(input, 'valid-key-1234567890');
    await user.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(validateOpenRouterApiKey).toHaveBeenCalledWith('valid-key-1234567890');
      expect(mockOnSubmit).toHaveBeenCalledWith('valid-key-1234567890');
    });
  });

  it('should show alert when API key is invalid', async () => {
    const user = userEvent.setup();
    vi.mocked(validateOpenRouterApiKey).mockResolvedValue(false);

    render(<ApiKeyForm onSubmit={mockOnSubmit} />);

    const input = screen.getByLabelText(/openRouterApiKey/i);
    await user.type(input, 'invalid-key-1234567890');
    await user.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(validateOpenRouterApiKey).toHaveBeenCalled();
      expect(global.alert).toHaveBeenCalled();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  it('should handle validation errors', async () => {
    const user = userEvent.setup();
    vi.mocked(validateOpenRouterApiKey).mockRejectedValue(new Error('Network error'));

    render(<ApiKeyForm onSubmit={mockOnSubmit} />);

    const input = screen.getByLabelText(/openRouterApiKey/i);
    await user.type(input, 'test-key-1234567890');
    await user.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalled();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  it('should clear input after successful submission', async () => {
    const user = userEvent.setup();
    vi.mocked(validateOpenRouterApiKey).mockResolvedValue(true);

    render(<ApiKeyForm onSubmit={mockOnSubmit} />);

    const input = screen.getByLabelText(/openRouterApiKey/i) as HTMLInputElement;
    await user.type(input, 'valid-key-1234567890');
    await user.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });

  it('should disable input and button while verifying', async () => {
    const user = userEvent.setup();
    let resolveValidation: (value: boolean) => void;
    const validationPromise = new Promise<boolean>((resolve) => {
      resolveValidation = resolve;
    });
    vi.mocked(validateOpenRouterApiKey).mockReturnValue(validationPromise);

    render(<ApiKeyForm onSubmit={mockOnSubmit} />);

    const input = screen.getByLabelText(/openRouterApiKey/i);
    const button = screen.getByRole('button');

    await user.type(input, 'test-key-1234567890');
    await user.click(button);

    await waitFor(() => {
      expect(input).toBeDisabled();
      expect(button).toBeDisabled();
    });

    resolveValidation!(true);
    await waitFor(() => {
      expect(input).not.toBeDisabled();
    });
  });
});

