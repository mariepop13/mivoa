import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { OpenRouterApiKeyProvider, OpenRouterApiKeyContext } from '../OpenRouterApiKeyContext';

const mockUpdateSettings = vi.fn();

vi.mock('@/repositories/storage-provider', () => ({
  useStorage: vi.fn(),
  useSettings: vi.fn(),
}));

import { useStorage, useSettings } from '@/repositories/storage-provider';

const mockBackend = { updateSettings: mockUpdateSettings };

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <OpenRouterApiKeyProvider>{children}</OpenRouterApiKeyProvider>
);

describe('OpenRouterApiKeyContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useStorage).mockReturnValue({
      backend: mockBackend as never,
      user: { uid: 'test-user' } as never,
      isUserLoading: false,
    });
    vi.mocked(useSettings).mockReturnValue({ data: null, isLoading: false });
    mockUpdateSettings.mockResolvedValue(undefined);
  });

  it('should provide null apiKey when loading', () => {
    vi.mocked(useStorage).mockReturnValue({
      backend: null,
      user: null,
      isUserLoading: true,
    });
    vi.mocked(useSettings).mockReturnValue({ data: null, isLoading: true });

    const { result } = renderHook(() => React.useContext(OpenRouterApiKeyContext), { wrapper });

    expect(result.current.apiKey).toBeNull();
    expect(result.current.isLoading).toBe(true);
  });

  it('should load persisted API key from Firestore', async () => {
    vi.mocked(useSettings).mockReturnValue({
      data: { openRouterApiKey: 'test-api-key-123' },
      isLoading: false,
    });

    const { result } = renderHook(() => React.useContext(OpenRouterApiKeyContext), { wrapper });

    await waitFor(() => {
      expect(result.current.apiKey).toBe('test-api-key-123');
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should return null when no API key exists', async () => {
    vi.mocked(useSettings).mockReturnValue({ data: {}, isLoading: false });

    const { result } = renderHook(() => React.useContext(OpenRouterApiKeyContext), { wrapper });

    await waitFor(() => {
      expect(result.current.apiKey).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should save API key to backend', async () => {
    vi.mocked(useSettings).mockReturnValue({ data: {}, isLoading: false });

    const { result } = renderHook(() => React.useContext(OpenRouterApiKeyContext), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.setApiKey('new-api-key-456');
    });

    expect(mockUpdateSettings).toHaveBeenCalledWith({ openRouterApiKey: 'new-api-key-456' });
  });

  it('should delete API key when setApiKey is called with null', async () => {
    vi.mocked(useSettings).mockReturnValue({
      data: { openRouterApiKey: 'test-api-key-123' },
      isLoading: false,
    });

    const { result } = renderHook(() => React.useContext(OpenRouterApiKeyContext), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.setApiKey(null);
    });

    expect(mockUpdateSettings).toHaveBeenCalledWith({ openRouterApiKey: undefined });
  });

  it('should reset API key using resetApiKey', async () => {
    vi.mocked(useSettings).mockReturnValue({
      data: { openRouterApiKey: 'test-api-key-123' },
      isLoading: false,
    });

    const { result } = renderHook(() => React.useContext(OpenRouterApiKeyContext), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.resetApiKey();
    });

    expect(mockUpdateSettings).toHaveBeenCalledWith({ openRouterApiKey: undefined });
  });

  it('should handle errors when saving API key', async () => {
    vi.mocked(useSettings).mockReturnValue({ data: {}, isLoading: false });
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockUpdateSettings.mockRejectedValue(new Error('Save failed'));

    const { result } = renderHook(() => React.useContext(OpenRouterApiKeyContext), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await expect(result.current.setApiKey('new-key')).rejects.toThrow('Save failed');
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to save OpenRouter API key', expect.any(Error));
    consoleErrorSpy.mockRestore();
  });

  it('should do nothing when trying to save without backend', async () => {
    vi.mocked(useStorage).mockReturnValue({
      backend: null,
      user: null,
      isUserLoading: false,
    });

    const { result } = renderHook(() => React.useContext(OpenRouterApiKeyContext), { wrapper });

    await act(async () => {
      await result.current.setApiKey('new-key');
    });

    expect(mockUpdateSettings).not.toHaveBeenCalled();
  });
});
