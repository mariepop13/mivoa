import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { OpenRouterApiKeyProvider, OpenRouterApiKeyContext } from '../OpenRouterApiKeyContext';
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
  <OpenRouterApiKeyProvider>{children}</OpenRouterApiKeyProvider>
);

describe('OpenRouterApiKeyContext', () => {
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

  it('should provide null apiKey when loading', () => {
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

    const { result } = renderHook(() => {
      const context = React.useContext(OpenRouterApiKeyContext);
      return context;
    }, { wrapper });

    expect(result.current.apiKey).toBeNull();
    expect(result.current.isLoading).toBe(true);
  });

  it('should load persisted API key from Firestore', async () => {
    vi.mocked(useDoc).mockReturnValue({
      data: { id: 'settings', openRouterApiKey: 'test-api-key-123' },
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => {
      const context = React.useContext(OpenRouterApiKeyContext);
      return context;
    }, { wrapper });

    await waitFor(() => {
      expect(result.current.apiKey).toBe('test-api-key-123');
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should return null when no API key exists', async () => {
    vi.mocked(useDoc).mockReturnValue({
      data: { id: 'settings' },
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => {
      const context = React.useContext(OpenRouterApiKeyContext);
      return context;
    }, { wrapper });

    await waitFor(() => {
      expect(result.current.apiKey).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should save API key to Firestore', async () => {
    vi.mocked(useDoc).mockReturnValue({
      data: { id: 'settings' },
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => {
      const context = React.useContext(OpenRouterApiKeyContext);
      return context;
    }, { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.setApiKey('new-api-key-456');
    });

    expect(setDocumentNonBlocking).toHaveBeenCalledWith(
      mockDocRef,
      {
        openRouterApiKey: 'new-api-key-456',
        updatedAt: expect.anything(),
      },
      { merge: true }
    );
  });

  it('should delete API key when setApiKey is called with null', async () => {
    vi.mocked(useDoc).mockReturnValue({
      data: { id: 'settings', openRouterApiKey: 'test-api-key-123' },
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => {
      const context = React.useContext(OpenRouterApiKeyContext);
      return context;
    }, { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.setApiKey(null);
    });

    expect(updateDocumentNonBlocking).toHaveBeenCalledWith(mockDocRef, {
      openRouterApiKey: expect.anything(),
      updatedAt: expect.anything(),
    });
  });

  it('should reset API key using resetApiKey', async () => {
    vi.mocked(useDoc).mockReturnValue({
      data: { id: 'settings', openRouterApiKey: 'test-api-key-123' },
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => {
      const context = React.useContext(OpenRouterApiKeyContext);
      return context;
    }, { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.resetApiKey();
    });

    expect(updateDocumentNonBlocking).toHaveBeenCalledWith(mockDocRef, {
      openRouterApiKey: expect.anything(),
      updatedAt: expect.anything(),
    });
  });

  it('should handle errors when saving API key', async () => {
    vi.mocked(useDoc).mockReturnValue({
      data: { id: 'settings' },
      isLoading: false,
      error: null,
    });
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(setDocumentNonBlocking).mockRejectedValue(new Error('Save failed'));

    const { result } = renderHook(() => {
      const context = React.useContext(OpenRouterApiKeyContext);
      return context;
    }, { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await expect(result.current.setApiKey('new-key')).rejects.toThrow('Save failed');
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to save OpenRouter API key to Firestore',
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

    const { result } = renderHook(() => {
      const context = React.useContext(OpenRouterApiKeyContext);
      return context;
    }, { wrapper });

    await act(async () => {
      await result.current.setApiKey('new-key');
    });

    expect(consoleWarnSpy).toHaveBeenCalledWith('Cannot save API key: missing settings doc ref or user');
    expect(setDocumentNonBlocking).not.toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
  });
});

