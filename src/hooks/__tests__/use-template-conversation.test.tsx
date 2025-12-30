import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import type { Firestore } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { useTemplateConversation } from '../use-template-conversation';
import { useFirestore } from '@/firebase';
import { useUser } from '@/firebase/auth/use-user';
import { OpenRouterApiKeyContext } from '@/context/OpenRouterApiKeyContext';
import { LanguageContext } from '@/context/LanguageContext';
import { useModel } from '@/context/ModelContext';
import { sendChatMessage, generateInitialMessage } from '@/ai/services/chat-service';
import { saveConversationDraft } from '@/app/handlers/journal-handlers';
import { convertTimestampToDate } from '@/utils/journal-utils';

vi.mock('@/firebase');
vi.mock('@/firebase/auth/use-user');
vi.mock('@/context/ModelContext');
vi.mock('@/ai/services/chat-service');
vi.mock('@/app/handlers/journal-handlers');
vi.mock('@/utils/journal-utils');

describe('useTemplateConversation', () => {
  const mockFirestore = { collection: vi.fn(), doc: vi.fn() } as unknown as Firestore;
  const mockUser = { uid: 'test-uid', email: 'test@example.com' } as unknown as User;
  const mockApiKey = 'test-api-key';
  const mockSelectedDate = new Date('2024-01-15');
  const mockOnSuccess = vi.fn();
  const mockOnError = vi.fn();
  const mockSendChatMessage = vi.mocked(sendChatMessage);
  const mockSaveConversationDraft = vi.mocked(saveConversationDraft);
  const mockConvertTimestampToDate = vi.mocked(convertTimestampToDate);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useFirestore).mockReturnValue(mockFirestore);
    vi.mocked(useUser).mockReturnValue({ user: mockUser, isLoading: false, error: null });
    vi.mocked(useModel).mockReturnValue({
      selectedModel: 'test-model',
      setSelectedModel: vi.fn(),
      isLoading: false,
    });
    mockSendChatMessage.mockResolvedValue('AI response');
    mockSaveConversationDraft.mockResolvedValue('draft-id-123');
    mockConvertTimestampToDate.mockImplementation((ts) => ts as Date);
  });

  const renderWithContext = (firestore: Firestore | null, user: User | null, apiKey: string | null, onError?: (error: Error) => void) => {
    vi.mocked(useFirestore).mockReturnValue(firestore as Firestore);
    vi.mocked(useUser).mockReturnValue({ user, isLoading: false, error: null });
    
    return renderHook(
      () => useTemplateConversation({
        selectedDate: mockSelectedDate,
        onSuccess: mockOnSuccess,
        onError: onError || mockOnError,
      }),
      {
        wrapper: ({ children }) => (
          <OpenRouterApiKeyContext.Provider
            value={{
              apiKey,
              setApiKey: vi.fn(),
              resetApiKey: vi.fn(),
              isLoading: false,
            }}
          >
            <LanguageContext.Provider value={{ language: 'en', setLanguage: vi.fn(), supportedLanguages: ['en', 'fr'] }}>
              {children}
            </LanguageContext.Provider>
          </OpenRouterApiKeyContext.Provider>
        ),
      }
    );
  };

  it('should call onError when firestore is missing', async () => {
    const { result } = renderWithContext(null, mockUser, mockApiKey);

    await result.current.createConversationFromPrompt('Test prompt');

    expect(mockOnError).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('missing firestore') })
    );
    expect(mockSendChatMessage).not.toHaveBeenCalled();
  });

  it('should call onError when user is missing', async () => {
    vi.mocked(useUser).mockReturnValue({ user: null, isLoading: false, error: null });
    const { result } = renderWithContext(mockFirestore, null, mockApiKey);

    await result.current.createConversationFromPrompt('Test prompt');

    expect(mockOnError).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('missing firestore, user, or API key') })
    );
    expect(mockSendChatMessage).not.toHaveBeenCalled();
  });

  it('should call onError when API key is missing', async () => {
    const { result } = renderWithContext(mockFirestore, mockUser, null);

    await result.current.createConversationFromPrompt('Test prompt');

    expect(mockOnError).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('missing firestore, user, or API key') })
    );
    expect(mockSendChatMessage).not.toHaveBeenCalled();
  });

  it('should call onError when prompt is too short', async () => {
    const { result } = renderWithContext(mockFirestore, mockUser, mockApiKey);

    await result.current.createConversationFromPrompt('');

    expect(mockOnError).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('too short') })
    );
    expect(mockSendChatMessage).not.toHaveBeenCalled();
  });


  it('should log warning in development mode when dependencies are missing', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubEnv('NODE_ENV', 'development');

    const { result } = renderWithContext(null, mockUser, mockApiKey);

    await result.current.createConversationFromPrompt('Test prompt');

    expect(consoleWarnSpy).toHaveBeenCalled();

    vi.unstubAllEnvs();
    consoleWarnSpy.mockRestore();
  });

  it('should handle non-Error exception during conversation creation', async () => {
    mockSendChatMessage.mockRejectedValue('String error');
    const { result } = renderWithContext(mockFirestore, mockUser, mockApiKey);

    await result.current.createConversationFromPrompt('Test prompt');

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Failed to create conversation' })
      );
    });
  });

  it('should work without onError callback', async () => {
    const { result } = renderHook(
      () => useTemplateConversation({
        selectedDate: mockSelectedDate,
        onSuccess: mockOnSuccess,
      }),
      {
        wrapper: ({ children }) => (
          <OpenRouterApiKeyContext.Provider
            value={{
              apiKey: mockApiKey,
              setApiKey: vi.fn(),
              resetApiKey: vi.fn(),
              isLoading: false,
            }}
          >
            <LanguageContext.Provider value={{ language: 'en', setLanguage: vi.fn(), supportedLanguages: ['en', 'fr'] }}>
              {children}
            </LanguageContext.Provider>
          </OpenRouterApiKeyContext.Provider>
        ),
      }
    );

    await result.current.createConversationFromPrompt('Test prompt');

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith('draft-id-123');
    });
  });

  it('should successfully create conversation from prompt', async () => {
    const { result } = renderWithContext(mockFirestore, mockUser, mockApiKey);

    await result.current.createConversationFromPrompt('What am I grateful for today?');

    await waitFor(() => {
      expect(mockSendChatMessage).toHaveBeenCalledWith({
        conversationHistory: expect.arrayContaining([
          expect.objectContaining({
            role: 'assistant',
            content: generateInitialMessage('en'),
          }),
        ]),
        userMessage: 'What am I grateful for today?',
        apiKey: mockApiKey,
        language: 'en',
        model: 'test-model',
      });
    });

    await waitFor(() => {
      expect(mockSaveConversationDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          draftId: null,
          entryDateKey: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
          conversationHistory: expect.arrayContaining([
            expect.objectContaining({ role: 'assistant' }),
            expect.objectContaining({ role: 'user' }),
            expect.objectContaining({ role: 'assistant' }),
          ]),
          firestore: mockFirestore,
          user: mockUser,
        })
      );
    });

    expect(mockOnSuccess).toHaveBeenCalledWith('draft-id-123');
  });

  it('should sanitize prompt by trimming and limiting length', async () => {
    const longPrompt = '  ' + 'a'.repeat(1998) + '  ';
    const { result } = renderWithContext(mockFirestore, mockUser, mockApiKey);

    await result.current.createConversationFromPrompt(longPrompt);

    await waitFor(() => {
      expect(mockSendChatMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          userMessage: expect.stringMatching(/^a{1998}$/),
        })
      );
    });
  });

  it('should use French language when language context is fr', async () => {
    const { result } = renderHook(
      () => useTemplateConversation({
        selectedDate: mockSelectedDate,
        onSuccess: mockOnSuccess,
        onError: mockOnError,
      }),
      {
        wrapper: ({ children }) => (
          <OpenRouterApiKeyContext.Provider
            value={{
              apiKey: mockApiKey,
              setApiKey: vi.fn(),
              resetApiKey: vi.fn(),
              isLoading: false,
            }}
          >
            <LanguageContext.Provider value={{ language: 'fr', setLanguage: vi.fn(), supportedLanguages: ['en', 'fr'] }}>
              {children}
            </LanguageContext.Provider>
          </OpenRouterApiKeyContext.Provider>
        ),
      }
    );

    await result.current.createConversationFromPrompt('Test prompt');

    await waitFor(() => {
      expect(mockSendChatMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          language: 'fr',
        })
      );
    });
  });
});

