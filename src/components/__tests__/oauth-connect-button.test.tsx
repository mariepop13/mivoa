import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OAuthConnectButton } from '../oauth-connect-button';
import { initiateOAuthFlow } from '@/lib/openrouter-oauth';
import { useTranslation } from '@/hooks/use-translation';

vi.mock('@/lib/openrouter-oauth');
vi.mock('@/hooks/use-translation');

describe('OAuthConnectButton', () => {
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
    Object.defineProperty(window, 'location', {
      value: { origin: 'http://localhost:3000' },
      writable: true,
    });
  });

  it('should render connect button', () => {
    render(<OAuthConnectButton />);

    expect(screen.getByText('connectWithOpenRouter')).toBeInTheDocument();
  });

  it('should call initiateOAuthFlow when clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(initiateOAuthFlow).mockResolvedValue(undefined);

    render(<OAuthConnectButton />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(initiateOAuthFlow).toHaveBeenCalledWith('http://localhost:3000/auth/openrouter/callback');
  });

  it('should show loading state while connecting', async () => {
    const user = userEvent.setup();
    let resolveOAuth: () => void;
    const oauthPromise = new Promise<void>((resolve) => {
      resolveOAuth = resolve;
    });
    vi.mocked(initiateOAuthFlow).mockReturnValue(oauthPromise);

    render(<OAuthConnectButton />);

    const button = screen.getByRole('button');
    const clickPromise = user.click(button);

    await vi.waitFor(() => {
      expect(screen.getByText('connecting')).toBeInTheDocument();
      expect(button).toBeDisabled();
    });

    resolveOAuth!();
    await clickPromise;
  });

  it('should show alert on error', async () => {
    const user = userEvent.setup();
    const error = new Error('OAuth failed');
    vi.mocked(initiateOAuthFlow).mockRejectedValue(error);

    render(<OAuthConnectButton />);

    const button = screen.getByRole('button');
    await user.click(button);

    await vi.waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('oauthInitiationFailed: OAuth failed');
    });
  });
});

