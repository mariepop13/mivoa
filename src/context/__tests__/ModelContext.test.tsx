import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ModelProvider, useModel } from '../ModelContext';
import { useUser, useFirestore, useDoc, setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

vi.mock('@/firebase');
vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    doc: vi.fn(),
    serverTimestamp: vi.fn(() => ({ _methodName: 'serverTimestamp' })),
    deleteField: vi.fn(() => ({ _methodName: 'deleteField' })),
  };
});

const mockFirestore = { id: 'mock-firestore' } as unknown as Firestore;
const mockUser = { uid: 'test-user-id' } as Partial<User> as User;
const mockDocRef = { id: 'mock-doc-ref' } as ReturnType<typeof doc>;

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ModelProvider>{children}</ModelProvider>
);

describe('ModelContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useFirestore).mockReturnValue(mockFirestore);
    vi.mocked(useUser).mockReturnValue({
      user: mockUser,
      isLoading: false,
      error: null,
    });
    vi.mocked(doc).mockReturnValue(mockDocRef);
    vi.mocked(setDocumentNonBlocking).mockResolvedValue(undefined);
    vi.mocked(updateDocumentNonBlocking).mockResolvedValue(undefined);
  });

  it('should provide default model when loading', () => {
    vi.mocked(useUser).mockReturnValue({
      user: null,
      isLoading: true,
      error: null,
    });
    vi.mocked(useDoc).mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    const { result } = renderHook(() => useModel(), { wrapper });

    expect(result.current.selectedModel).toBe('google/gemini-3-flash-preview');
    expect(result.current.isLoading).toBe(true);
  });

  it('should load persisted model from Firestore', async () => {
    vi.mocked(useDoc).mockReturnValue({
      data: { id: 'settings', selectedModel: 'openai/gpt-4o-mini' },
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useModel(), { wrapper });

    await waitFor(() => {
      expect(result.current.selectedModel).toBe('openai/gpt-4o-mini');
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should use default model when no persisted model exists', async () => {
    vi.mocked(useDoc).mockReturnValue({
      data: { id: 'settings' },
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useModel(), { wrapper });

    await waitFor(() => {
      expect(result.current.selectedModel).toBe('google/gemini-3-flash-preview');
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should update model and save to Firestore', async () => {
    vi.mocked(useDoc).mockReturnValue({
      data: { id: 'settings', selectedModel: 'google/gemini-3-flash-preview' },
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useModel(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.setSelectedModel('openai/gpt-4o-mini');
    });

    expect(setDocumentNonBlocking).toHaveBeenCalledWith(
      mockDocRef,
      {
        selectedModel: 'openai/gpt-4o-mini',
        updatedAt: expect.anything(),
      },
      { merge: true }
    );
    expect(result.current.selectedModel).toBe('openai/gpt-4o-mini');
  });

  it('should reset to default model when setSelectedModel is called with null', async () => {
    vi.mocked(useDoc).mockReturnValue({
      data: { id: 'settings', selectedModel: 'openai/gpt-4o-mini' },
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useModel(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.setSelectedModel(null);
    });

    expect(updateDocumentNonBlocking).toHaveBeenCalledWith(mockDocRef, {
      selectedModel: expect.anything(),
      updatedAt: expect.anything(),
    });
    expect(result.current.selectedModel).toBe('google/gemini-3-flash-preview');
  });

  it('should handle errors when saving model', async () => {
    vi.mocked(useDoc).mockReturnValue({
      data: { id: 'settings', selectedModel: 'google/gemini-3-flash-preview' },
      isLoading: false,
      error: null,
    });
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(setDocumentNonBlocking).mockRejectedValue(new Error('Save failed'));

    const { result } = renderHook(() => useModel(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await expect(result.current.setSelectedModel('openai/gpt-4o-mini')).rejects.toThrow('Save failed');
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to save selected model to Firestore',
      expect.any(Error)
    );
    consoleErrorSpy.mockRestore();
  });

  it('should warn when trying to save without user or doc ref', async () => {
    vi.mocked(useUser).mockReturnValue({
      user: null,
      isLoading: false,
      error: null,
    });
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { result } = renderHook(() => useModel(), { wrapper });

    await act(async () => {
      await result.current.setSelectedModel('openai/gpt-4o-mini');
    });

    expect(consoleWarnSpy).toHaveBeenCalledWith('Cannot save model: missing settings doc ref or user');
    expect(setDocumentNonBlocking).not.toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
  });
});

