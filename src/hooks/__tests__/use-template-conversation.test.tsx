/* eslint-disable react/display-name */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useTemplateConversation } from '../use-template-conversation';
import { useStorage } from '@/repositories/storage-provider';
import { OpenRouterApiKeyContext } from '@/context/OpenRouterApiKeyContext';
import { saveConversationDraft } from '@/app/handlers/journal-handlers';
import { convertTimestampToDate } from '@/utils/journal-utils';
import type { StorageBackend } from '@/repositories/storage-backend';

vi.mock('@/repositories/storage-provider', () => ({
  useStorage: vi.fn(),
  useEntriesByDate: vi.fn(),
  useEntry: vi.fn(),
  useAllEntries: vi.fn(),
}));
vi.mock('@/app/handlers/journal-handlers');
vi.mock('@/utils/journal-utils');

const createWrapper = (apiKey: string | null) =>
  ({ children }: { children: React.ReactNode }) => (
    <OpenRouterApiKeyContext.Provider
      value={{
        apiKey,
        setApiKey: vi.fn(),
        resetApiKey: vi.fn(),
        isLoading: false,
      }}
    >
      {children}
    </OpenRouterApiKeyContext.Provider>
  );

describe('useTemplateConversation', () => {
  let mockBackend: StorageBackend;
  const mockApiKey = 'test-api-key';
  const mockSelectedDate = new Date('2024-01-15');
  const mockOnSuccess = vi.fn();
  const mockOnError = vi.fn();
  const mockSaveConversationDraft = vi.mocked(saveConversationDraft);
  const mockConvertTimestampToDate = vi.mocked(convertTimestampToDate);

  beforeEach(() => {
    vi.clearAllMocks();
    mockBackend = {
      subscribeToAuthState: vi.fn(),
      subscribeToEntriesByDate: vi.fn(),
      subscribeToEntry: vi.fn(),
      subscribeToAllEntries: vi.fn(),
      subscribeToEntriesInDateRange: vi.fn(),
      subscribeToSettings: vi.fn(),
      getEntries: vi.fn(),
      createEntry: vi.fn(),
      updateEntry: vi.fn(),
      deleteEntry: vi.fn(),
      linkEntries: vi.fn(),
      unlinkEntries: vi.fn(),
      updateSettings: vi.fn(),
      signOut: vi.fn(),
    };
    vi.mocked(useStorage).mockReturnValue({
      backend: mockBackend,
      user: { uid: 'test-uid', displayName: null, email: 'test@example.com', photoURL: null },
      isUserLoading: false,
    });
    mockSaveConversationDraft.mockResolvedValue('draft-id-123');
    mockConvertTimestampToDate.mockImplementation((ts) => ts as Date);
  });

  const renderWithContext = (
    backend: StorageBackend | null,
    apiKey: string | null,
    onError?: (error: Error) => void
  ) => {
    vi.mocked(useStorage).mockReturnValue({
      backend,
      user: backend ? { uid: 'test-uid', displayName: null, email: null, photoURL: null } : null,
      isUserLoading: false,
    });

    return renderHook(
      () => useTemplateConversation({
        selectedDate: mockSelectedDate,
        onSuccess: mockOnSuccess,
        onError: onError || mockOnError,
      }),
      { wrapper: createWrapper(apiKey) }
    );
  };

  it('should call onError when backend is missing', async () => {
    const { result } = renderWithContext(null, mockApiKey);

    await act(async () => {
      await result.current.createConversationFromPrompt('Test prompt');
    });

    expect(mockOnError).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('missing backend') })
    );
    expect(mockSaveConversationDraft).not.toHaveBeenCalled();
  });

  it('should call onError when API key is missing', async () => {
    const { result } = renderWithContext(mockBackend, null);

    await act(async () => {
      await result.current.createConversationFromPrompt('Test prompt');
    });

    expect(mockOnError).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('missing backend or API key') })
    );
    expect(mockSaveConversationDraft).not.toHaveBeenCalled();
  });

  it('should call onError when prompt is too short', async () => {
    const { result } = renderWithContext(mockBackend, mockApiKey);

    await act(async () => {
      await result.current.createConversationFromPrompt('');
    });

    expect(mockOnError).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('too short') })
    );
    expect(mockSaveConversationDraft).not.toHaveBeenCalled();
  });

  it('should log warning in development mode when dependencies are missing', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubEnv('NODE_ENV', 'development');

    const { result } = renderWithContext(null, mockApiKey);

    await act(async () => {
      await result.current.createConversationFromPrompt('Test prompt');
    });

    expect(consoleWarnSpy).toHaveBeenCalled();

    vi.unstubAllEnvs();
    consoleWarnSpy.mockRestore();
  });

  it('should handle non-Error exception during conversation creation', async () => {
    mockSaveConversationDraft.mockRejectedValue('String error');
    const { result } = renderWithContext(mockBackend, mockApiKey);

    await act(async () => {
      await result.current.createConversationFromPrompt('Test prompt');
    });

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Failed to create conversation' })
      );
    });
  });

  it('should work without onError callback', async () => {
    vi.mocked(useStorage).mockReturnValue({
      backend: mockBackend,
      user: { uid: 'test-uid', displayName: null, email: null, photoURL: null },
      isUserLoading: false,
    });

    const { result } = renderHook(
      () => useTemplateConversation({
        selectedDate: mockSelectedDate,
        onSuccess: mockOnSuccess,
      }),
      { wrapper: createWrapper(mockApiKey) }
    );

    await act(async () => {
      await result.current.createConversationFromPrompt('Test prompt');
    });

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith('draft-id-123');
    });
  });

  it('should successfully create conversation from prompt', async () => {
    const { result } = renderWithContext(mockBackend, mockApiKey);

    await act(async () => {
      await result.current.createConversationFromPrompt('What am I grateful for today?');
    });

    await waitFor(() => {
      expect(mockSaveConversationDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          draftId: null,
          entryDateKey: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
          conversationHistory: expect.arrayContaining([
            expect.objectContaining({
              role: 'assistant',
              content: 'What am I grateful for today?',
            }),
          ]),
          backend: mockBackend,
        })
      );
    });

    expect(mockOnSuccess).toHaveBeenCalledWith('draft-id-123');
  });

  it('should sanitize prompt by trimming and limiting length', async () => {
    const longPrompt = `  ${  'a'.repeat(1998)  }  `;
    const { result } = renderWithContext(mockBackend, mockApiKey);

    await act(async () => {
      await result.current.createConversationFromPrompt(longPrompt);
    });

    await waitFor(() => {
      expect(mockSaveConversationDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          conversationHistory: expect.arrayContaining([
            expect.objectContaining({
              role: 'assistant',
              content: expect.stringMatching(/^a{1998}$/),
            }),
          ]),
        })
      );
    });
  });
});
