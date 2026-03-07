import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ModelProvider, useModel, DEFAULT_MODEL } from '../ModelContext';

const mockUpdateSettings = vi.fn();

vi.mock('@/repositories/storage-provider', () => ({
  useStorage: vi.fn(),
  useSettings: vi.fn(),
}));

import { useStorage, useSettings } from '@/repositories/storage-provider';

const mockBackend = { updateSettings: mockUpdateSettings };

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ModelProvider>{children}</ModelProvider>
);

describe('ModelContext', () => {
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

  it('should provide default model when loading', () => {
    vi.mocked(useStorage).mockReturnValue({
      backend: null,
      user: null,
      isUserLoading: true,
    });
    vi.mocked(useSettings).mockReturnValue({ data: null, isLoading: true });

    const { result } = renderHook(() => useModel(), { wrapper });

    expect(result.current.selectedModel).toBe(DEFAULT_MODEL);
    expect(result.current.isLoading).toBe(true);
  });

  it('should load persisted model from Firestore', async () => {
    vi.mocked(useSettings).mockReturnValue({
      data: { selectedModel: 'openai/gpt-4o-mini' },
      isLoading: false,
    });

    const { result } = renderHook(() => useModel(), { wrapper });

    await waitFor(() => {
      expect(result.current.selectedModel).toBe('openai/gpt-4o-mini');
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should use default model when no persisted model exists', async () => {
    vi.mocked(useSettings).mockReturnValue({ data: {}, isLoading: false });

    const { result } = renderHook(() => useModel(), { wrapper });

    await waitFor(() => {
      expect(result.current.selectedModel).toBe(DEFAULT_MODEL);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should update model and save to backend', async () => {
    vi.mocked(useSettings).mockReturnValue({
      data: { selectedModel: DEFAULT_MODEL },
      isLoading: false,
    });

    const { result } = renderHook(() => useModel(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.setSelectedModel('openai/gpt-4o-mini');
    });

    expect(mockUpdateSettings).toHaveBeenCalledWith({ selectedModel: 'openai/gpt-4o-mini' });
    expect(result.current.selectedModel).toBe('openai/gpt-4o-mini');
  });

  it('should reset to default model when setSelectedModel is called with null', async () => {
    vi.mocked(useSettings).mockReturnValue({
      data: { selectedModel: 'openai/gpt-4o-mini' },
      isLoading: false,
    });

    const { result } = renderHook(() => useModel(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.setSelectedModel(null);
    });

    expect(mockUpdateSettings).toHaveBeenCalledWith({ selectedModel: DEFAULT_MODEL });
    expect(result.current.selectedModel).toBe(DEFAULT_MODEL);
  });

  it('should handle errors when saving model', async () => {
    vi.mocked(useSettings).mockReturnValue({
      data: { selectedModel: DEFAULT_MODEL },
      isLoading: false,
    });
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockUpdateSettings.mockRejectedValue(new Error('Save failed'));

    const { result } = renderHook(() => useModel(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await expect(result.current.setSelectedModel('openai/gpt-4o-mini')).rejects.toThrow('Save failed');
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to save selected model', expect.any(Error));
    consoleErrorSpy.mockRestore();
  });

  it('should warn when trying to save without backend', async () => {
    vi.mocked(useStorage).mockReturnValue({
      backend: null,
      user: null,
      isUserLoading: false,
    });
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { result } = renderHook(() => useModel(), { wrapper });

    await act(async () => {
      await result.current.setSelectedModel('openai/gpt-4o-mini');
    });

    expect(consoleWarnSpy).toHaveBeenCalledWith('Cannot save model: storage backend not available');
    expect(mockUpdateSettings).not.toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
  });
});
