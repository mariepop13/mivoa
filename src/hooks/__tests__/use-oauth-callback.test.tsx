import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useOAuthCallback } from '../use-oauth-callback';
import { useSearchParams, useRouter } from 'next/navigation';
import { exchangeAuthCodeForApiKey } from '@/lib/openrouter-oauth';
import { OpenRouterApiKeyContext } from '@/context/OpenRouterApiKeyContext';
import { useTranslation } from '@/hooks/use-translation';

vi.mock('next/navigation');
vi.mock('@/lib/openrouter-oauth');
vi.mock('@/hooks/use-translation');

describe('useOAuthCallback', () => {
  const mockSetApiKey = vi.fn();
  const mockRouterPush = vi.fn();
  const mockGet = vi.fn();
  const mockT = vi.fn((key: string) => key);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSearchParams).mockReturnValue({
      get: mockGet,
    } as any);
    vi.mocked(useRouter).mockReturnValue({
      push: mockRouterPush,
    } as any);
    vi.mocked(useTranslation).mockReturnValue({
      t: mockT,
      language: 'en',
      isLoading: false,
      error: null,
    });
    vi.mocked(exchangeAuthCodeForApiKey).mockResolvedValue('test-api-key');
  });

  it('should exchange auth code for API key successfully', async () => {
    mockGet.mockImplementation((key: string) => {
      if (key === 'code') return 'auth-code-123';
      if (key === 'state') return 'state-123';
      return null;
    });

    const { result } = renderHook(() => useOAuthCallback(), {
      wrapper: ({ children }) => (
        <OpenRouterApiKeyContext.Provider
          value={{
            apiKey: null,
            setApiKey: mockSetApiKey,
            resetApiKey: vi.fn(),
            isLoading: false,
          }}
        >
          {children}
        </OpenRouterApiKeyContext.Provider>
      ),
    });

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    expect(exchangeAuthCodeForApiKey).toHaveBeenCalledWith('auth-code-123', 'state-123');
    expect(mockSetApiKey).toHaveBeenCalledWith('test-api-key');
  });

  it('should redirect after successful exchange', async () => {
    mockGet.mockImplementation((key: string) => {
      if (key === 'code') return 'auth-code-123';
      return null;
    });

    renderHook(() => useOAuthCallback(), {
      wrapper: ({ children }) => (
        <OpenRouterApiKeyContext.Provider
          value={{
            apiKey: null,
            setApiKey: mockSetApiKey,
            resetApiKey: vi.fn(),
            isLoading: false,
          }}
        >
          {children}
        </OpenRouterApiKeyContext.Provider>
      ),
    });

    await waitFor(() => {
      expect(exchangeAuthCodeForApiKey).toHaveBeenCalled();
    }, { timeout: 5000 });

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith('/');
    }, { timeout: 5000 });
  });

  it('should set error status when error parameter is present', async () => {
    mockGet.mockImplementation((key: string) => {
      if (key === 'error') return 'access_denied';
      return null;
    });

    const { result } = renderHook(() => useOAuthCallback(), {
      wrapper: ({ children }) => (
        <OpenRouterApiKeyContext.Provider
          value={{
            apiKey: null,
            setApiKey: mockSetApiKey,
            resetApiKey: vi.fn(),
            isLoading: false,
          }}
        >
          {children}
        </OpenRouterApiKeyContext.Provider>
      ),
    });

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    }, { timeout: 5000 });

    expect(result.current.errorMessage).toBe('access_denied');
    expect(exchangeAuthCodeForApiKey).not.toHaveBeenCalled();
  });

  it('should set error status when code is missing', async () => {
    mockGet.mockReturnValue(null);

    const { result } = renderHook(() => useOAuthCallback(), {
      wrapper: ({ children }) => (
        <OpenRouterApiKeyContext.Provider
          value={{
            apiKey: null,
            setApiKey: mockSetApiKey,
            resetApiKey: vi.fn(),
            isLoading: false,
          }}
        >
          {children}
        </OpenRouterApiKeyContext.Provider>
      ),
    });

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    }, { timeout: 5000 });

    expect(result.current.errorMessage).toBe('noAuthorizationCode');
    expect(exchangeAuthCodeForApiKey).not.toHaveBeenCalled();
  });

  it('should handle exchange errors', async () => {
    const error = new Error('Exchange failed');
    vi.mocked(exchangeAuthCodeForApiKey).mockRejectedValue(error);
    mockGet.mockImplementation((key: string) => {
      if (key === 'code') return 'auth-code-123';
      return null;
    });

    const { result } = renderHook(() => useOAuthCallback(), {
      wrapper: ({ children }) => (
        <OpenRouterApiKeyContext.Provider
          value={{
            apiKey: null,
            setApiKey: mockSetApiKey,
            resetApiKey: vi.fn(),
            isLoading: false,
          }}
        >
          {children}
        </OpenRouterApiKeyContext.Provider>
      ),
    });

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    }, { timeout: 5000 });

    expect(result.current.errorMessage).toBe('Exchange failed');
  });

  it('should handle non-Error exceptions', async () => {
    vi.mocked(exchangeAuthCodeForApiKey).mockRejectedValue('String error');
    mockGet.mockImplementation((key: string) => {
      if (key === 'code') return 'auth-code-123';
      return null;
    });

    const { result } = renderHook(() => useOAuthCallback(), {
      wrapper: ({ children }) => (
        <OpenRouterApiKeyContext.Provider
          value={{
            apiKey: null,
            setApiKey: mockSetApiKey,
            resetApiKey: vi.fn(),
            isLoading: false,
          }}
        >
          {children}
        </OpenRouterApiKeyContext.Provider>
      ),
    });

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    }, { timeout: 5000 });

    expect(result.current.errorMessage).toBe('Unknown error');
  });

  it('should cleanup timeout on unmount', async () => {
    mockGet.mockImplementation((key: string) => {
      if (key === 'code') return 'auth-code-123';
      return null;
    });

    const { unmount } = renderHook(() => useOAuthCallback(), {
      wrapper: ({ children }) => (
        <OpenRouterApiKeyContext.Provider
          value={{
            apiKey: null,
            setApiKey: mockSetApiKey,
            resetApiKey: vi.fn(),
            isLoading: false,
          }}
        >
          {children}
        </OpenRouterApiKeyContext.Provider>
      ),
    });

    await waitFor(() => {
      expect(exchangeAuthCodeForApiKey).toHaveBeenCalled();
    }, { timeout: 5000 });

    unmount();

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 2100));
    });

    expect(mockRouterPush).not.toHaveBeenCalled();
  });
});

