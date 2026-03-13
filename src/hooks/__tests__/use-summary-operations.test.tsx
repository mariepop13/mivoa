import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSummaryOperations } from '../use-summary-operations';
import { useStorage } from '@/repositories/storage-provider';
import { useEntryAnalysis } from '../use-entry-analysis';
import { LanguageContext } from '@/context/LanguageContext';
import { OpenRouterApiKeyContext } from '@/context/OpenRouterApiKeyContext';
import { ModelContext } from '@/context/ModelContext';
import * as conversationSummaryService from '@/ai/services/conversation-summary-service';
import * as journalHandlers from '@/app/handlers/journal-handlers';
import type { StorageBackend } from '@/repositories/storage-backend';

vi.mock('@/repositories/storage-provider', () => ({
  useStorage: vi.fn(),
  useEntriesByDate: vi.fn(),
  useEntry: vi.fn(),
  useAllEntries: vi.fn(),
}));
vi.mock('../use-entry-analysis');
vi.mock('@/ai/services/conversation-summary-service');
vi.mock('@/app/handlers/journal-handlers');

describe('useSummaryOperations', () => {
  let mockBackend: StorageBackend;
  const mockAnalyze = vi.fn().mockResolvedValue({ mood: 'happy', themes: [], keyTakeaways: [] });

  const mockUpdateEntryState = vi.fn();
  const mockSetIsGeneratingSummary = vi.fn();
  const mockSetSaveError = vi.fn();

  const defaultParams = {
    dateKey: '2024-01-15',
    updateEntryState: mockUpdateEntryState,
    setIsGeneratingSummary: mockSetIsGeneratingSummary,
    setSaveError: mockSetSaveError,
  };

  const renderWithContexts = (
    apiKey: string | null,
    language: 'en' | 'fr',
    selectedModel: string | undefined
  ) => renderHook(() => useSummaryOperations(defaultParams), {
    wrapper: ({ children }) => (
      <LanguageContext.Provider
        value={{
          language,
          setLanguage: vi.fn(),
          supportedLanguages: ['en', 'fr'],
          t: (key: string) => key,
          isLoading: false,
          error: null,
        }}
      >
        <OpenRouterApiKeyContext.Provider
          value={{
            apiKey,
            setApiKey: vi.fn(),
            resetApiKey: vi.fn(),
            isLoading: false,
          }}
        >
          <ModelContext.Provider
            value={{
              selectedModel: selectedModel || 'google/gemini-3-flash-preview',
              setSelectedModel: vi.fn(),
              isLoading: false,
            }}
          >
            {children}
          </ModelContext.Provider>
        </OpenRouterApiKeyContext.Provider>
      </LanguageContext.Provider>
    ),
  });

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
      user: { uid: 'test-user-id', displayName: null, email: null, photoURL: null },
      isUserLoading: false,
    });
    vi.mocked(useEntryAnalysis).mockReturnValue({
      analyze: mockAnalyze,
      isAnalyzing: false,
      error: null,
    });
    vi.mocked(conversationSummaryService.generateConversationSummary).mockResolvedValue({
      content: 'Summary content',
      title: 'Summary title',
    });
    vi.mocked(journalHandlers.generateEntryId).mockReturnValue('summary-entry-id');
    vi.mocked(journalHandlers.saveSummaryAsEntry).mockResolvedValue(undefined);
    vi.mocked(journalHandlers.triggerEntryAnalysis).mockReturnValue(undefined);
  });

  it('should generate summary successfully', async () => {
    const { result } = renderWithContexts('test-api-key', 'en', undefined);

    const conversationHistory = [
      { role: 'user' as const, content: 'Hello', timestamp: new Date() },
      { role: 'assistant' as const, content: 'Hi', timestamp: new Date() },
    ];

    await act(async () => {
      await result.current.handleSummarizeConversation(conversationHistory);
    });

    expect(mockSetIsGeneratingSummary).toHaveBeenCalledWith(true);
    expect(mockSetSaveError).toHaveBeenCalledWith(null);
    expect(conversationSummaryService.generateConversationSummary).toHaveBeenCalled();
    const callArgs = vi.mocked(conversationSummaryService.generateConversationSummary).mock.calls[0];
    expect(callArgs?.[0]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ role: 'user', content: 'Hello' }),
        expect.objectContaining({ role: 'assistant', content: 'Hi' }),
      ])
    );
    expect(callArgs?.[1]).toBe('test-api-key');
    expect(callArgs?.[2]).toBe('en');
    expect(journalHandlers.saveSummaryAsEntry).toHaveBeenCalled();
    expect(mockUpdateEntryState).toHaveBeenCalledWith('summary-entry-id', 'Summary content', 'Summary title');
    expect(mockSetIsGeneratingSummary).toHaveBeenCalledWith(false);
  });

  it('should not generate summary when apiKey is missing', async () => {
    const { result } = renderWithContexts(null, 'en', undefined);

    await act(async () => {
      await result.current.handleSummarizeConversation([]);
    });

    expect(mockSetSaveError).toHaveBeenCalledWith('API key not configured or services unavailable');
    expect(conversationSummaryService.generateConversationSummary).not.toHaveBeenCalled();
  });

  it('should not generate summary when backend is missing', async () => {
    vi.mocked(useStorage).mockReturnValue({
      backend: null,
      user: null,
      isUserLoading: false,
    });

    const { result } = renderWithContexts('test-api-key', 'en', undefined);

    await act(async () => {
      await result.current.handleSummarizeConversation([]);
    });

    expect(mockSetSaveError).toHaveBeenCalledWith('API key not configured or services unavailable');
  });

  it('should use selected model when provided', async () => {
    const { result } = renderWithContexts('test-api-key', 'en', 'custom-model');

    await act(async () => {
      await result.current.handleSummarizeConversation([]);
    });

    expect(conversationSummaryService.generateConversationSummary).toHaveBeenCalledWith(
      expect.any(Array),
      'test-api-key',
      'en',
      'custom-model'
    );
  });

  it('should use French language when language is fr', async () => {
    const { result } = renderWithContexts('test-api-key', 'fr', undefined);

    await act(async () => {
      await result.current.handleSummarizeConversation([]);
    });

    expect(conversationSummaryService.generateConversationSummary).toHaveBeenCalled();
    const callArgs = vi.mocked(conversationSummaryService.generateConversationSummary).mock.calls[0];
    expect(callArgs?.[1]).toBe('test-api-key');
    expect(callArgs?.[2]).toBe('fr');
  });

  it('should handle errors when generating summary', async () => {
    const error = new Error('Summary generation failed');
    vi.mocked(conversationSummaryService.generateConversationSummary).mockRejectedValue(error);

    const { result } = renderWithContexts('test-api-key', 'en', undefined);

    await act(async () => {
      await result.current.handleSummarizeConversation([]);
    });

    expect(mockSetSaveError).toHaveBeenCalledWith('Summary generation failed');
    expect(mockSetIsGeneratingSummary).toHaveBeenCalledWith(false);
  });

  it('should convert conversation history to ChatMessage format', async () => {
    const { result } = renderWithContexts('test-api-key', 'en', undefined);

    const conversationHistory = [
      { role: 'user' as const, content: 'Message 1', timestamp: new Date('2024-01-15T10:00:00Z') },
      { role: 'assistant' as const, content: 'Message 2', timestamp: new Date('2024-01-15T10:01:00Z') },
    ];

    await act(async () => {
      await result.current.handleSummarizeConversation(conversationHistory);
    });

    expect(conversationSummaryService.generateConversationSummary).toHaveBeenCalled();
    const callArgs = vi.mocked(conversationSummaryService.generateConversationSummary).mock.calls[0];
    expect(callArgs?.[0]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ role: 'user', content: 'Message 1' }),
        expect.objectContaining({ role: 'assistant', content: 'Message 2' }),
      ])
    );
    expect(callArgs?.[1]).toBe('test-api-key');
    expect(callArgs?.[2]).toBe('en');
  });
});
