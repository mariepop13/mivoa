/* eslint-disable react/display-name */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useChatConversation } from '../use-chat-conversation';
import { OpenRouterApiKeyContext } from '@/context/OpenRouterApiKeyContext';
import { LanguageContext, SUPPORTED_LANGUAGES } from '@/context/LanguageContext';
import { ModelContext } from '@/context/ModelContext';
import * as chatService from '@/ai/services/chat-service';

vi.mock('@/ai/services/chat-service');

const mockApiKey = 'test-api-key';
const mockLanguage = 'en';
const mockModel = 'test-model';

const createWrapper = (overrides: { apiKey?: string | null } = {}) =>
  ({ children }: { children: React.ReactNode }) => (
    <OpenRouterApiKeyContext.Provider value={{ apiKey: 'apiKey' in overrides ? (overrides.apiKey as string | null) : mockApiKey, setApiKey: vi.fn(), resetApiKey: vi.fn(), isLoading: false }}>
      <LanguageContext.Provider value={{ language: mockLanguage, setLanguage: vi.fn(), supportedLanguages: SUPPORTED_LANGUAGES }}>
        <ModelContext.Provider value={{ selectedModel: mockModel, setSelectedModel: vi.fn(), isLoading: false }}>
          {children}
        </ModelContext.Provider>
      </LanguageContext.Provider>
    </OpenRouterApiKeyContext.Provider>
  );

describe('useChatConversation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(chatService, 'generateInitialMessage').mockReturnValue('Initial message');
    vi.spyOn(chatService, 'sendChatMessage').mockResolvedValue('Response message');
  });

  it('initializes with initial message when apiKey is available', async () => {
    const { result } = renderHook(() => useChatConversation(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].role).toBe('assistant');
      expect(result.current.messages[0].content).toBe('Initial message');
    });
  });

  it('sends message and updates conversation', async () => {
    const { result } = renderHook(() => useChatConversation(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.messages.length).toBeGreaterThan(0);
    });

    await act(async () => {
      await result.current.sendMessage('User message');
    });

    await waitFor(() => {
      expect(chatService.sendChatMessage).toHaveBeenCalledWith({
        conversationHistory: expect.any(Array),
        userMessage: 'User message',
        apiKey: mockApiKey,
        language: mockLanguage,
        model: mockModel,
      });
      expect(result.current.messages.length).toBeGreaterThan(1);
    });
  });

  it('sets error when sendMessage fails', async () => {
    vi.spyOn(chatService, 'sendChatMessage').mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useChatConversation(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.messages.length).toBeGreaterThan(0);
    });

    await act(async () => {
      await result.current.sendMessage('User message');
    });

    await waitFor(() => {
      expect(result.current.error).toBe('API Error');
    });
  });

  it('does not send empty message', async () => {
    const { result } = renderHook(() => useChatConversation(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.messages.length).toBeGreaterThan(0);
    });

    await act(async () => {
      await result.current.sendMessage('   ');
    });

    expect(chatService.sendChatMessage).not.toHaveBeenCalled();
  });

  it('resets conversation', async () => {
    const { result } = renderHook(() => useChatConversation(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.messages.length).toBeGreaterThan(0);
    });

    act(() => {
      result.current.resetConversation();
    });

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(0);
      expect(result.current.error).toBeNull();
      expect(result.current.isTyping).toBe(false);
    });
  });

  it('sets isTyping during message send', async () => {
    let resolvePromise: () => void;
    const promise = new Promise<string>((resolve) => {
      resolvePromise = () => resolve('Response');
    });
    vi.spyOn(chatService, 'sendChatMessage').mockReturnValue(promise);

    const { result } = renderHook(() => useChatConversation(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.messages.length).toBeGreaterThan(0);
    });

    let sendPromise: Promise<void> | undefined;
    await act(async () => {
      sendPromise = result.current.sendMessage('User message');
    });

    await waitFor(() => {
      expect(result.current.isTyping).toBe(true);
    });

    resolvePromise!();
    await sendPromise!;

    await waitFor(() => {
      expect(result.current.isTyping).toBe(false);
    });
  });

  it('sets error when apiKey is not configured', async () => {
    const { result } = renderHook(() => useChatConversation(), { wrapper: createWrapper({ apiKey: null }) });

    await waitFor(() => {
      expect(result.current.messages.length).toBeGreaterThan(0);
    });

    await act(async () => {
      await result.current.sendMessage('User message');
    });

    await waitFor(() => {
      expect(result.current.error).toBe('API key not configured');
    });
  });

  it('loads conversation with messages and draftId', async () => {
    const { result } = renderHook(() => useChatConversation(), { wrapper: createWrapper() });
    const testMessages = [
      { role: 'user' as const, content: 'Hello', timestamp: new Date() },
      { role: 'assistant' as const, content: 'Hi there', timestamp: new Date() },
    ];

    act(() => {
      result.current.loadConversation(testMessages, 'draft-123');
    });

    expect(result.current.messages).toEqual(testMessages);
    expect(result.current.draftId).toBe('draft-123');
    expect(result.current.error).toBeNull();
    expect(result.current.isTyping).toBe(false);
  });

  it('loads conversation with messages but no draftId', async () => {
    const { result } = renderHook(() => useChatConversation(), { wrapper: createWrapper() });
    const testMessages = [
      { role: 'user' as const, content: 'Hello', timestamp: new Date() },
    ];

    act(() => {
      result.current.loadConversation(testMessages);
    });

    expect(result.current.messages).toEqual(testMessages);
    expect(result.current.draftId).toBeNull();
  });

  it('loads empty conversation and resets draftId', async () => {
    const { result } = renderHook(() => useChatConversation(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.messages.length).toBeGreaterThan(0);
    });

    act(() => {
      result.current.loadConversation([], null);
    });

    expect(result.current.messages).toEqual([]);
    expect(result.current.draftId).toBeNull();
  });

  it('forwards recentEntries to sendChatMessage', async () => {
    const recentEntries = [
      { content: 'Felt stressed', date: '2024-01-14', moods: ['stressed'] },
    ];

    const { result } = renderHook(
      () => useChatConversation({ recentEntries }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.messages.length).toBeGreaterThan(0);
    });

    await act(async () => {
      await result.current.sendMessage('How am I doing?');
    });

    await waitFor(() => {
      expect(chatService.sendChatMessage).toHaveBeenCalledWith(
        expect.objectContaining({ recentEntries })
      );
    });
  });

  it('schedules draft save when onDraftSave is provided', async () => {
    const mockOnDraftSave = vi.fn().mockResolvedValue('saved-draft-id');
    const dateKey = '2024-01-15';

    const { result } = renderHook(
      () => useChatConversation({ dateKey, onDraftSave: mockOnDraftSave }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.messages.length).toBeGreaterThan(0);
    });

    await act(async () => {
      await result.current.sendMessage('Test message');
    });

    await waitFor(
      () => {
        expect(mockOnDraftSave).toHaveBeenCalled();
      },
      { timeout: 1000 }
    );
  });

  it('deletes draft when resetConversation is called with onDraftDelete', async () => {
    const mockOnDraftDelete = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(
      () => useChatConversation({ onDraftDelete: mockOnDraftDelete }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.messages.length).toBeGreaterThan(0);
    });

    act(() => {
      result.current.loadConversation(
        [{ role: 'user' as const, content: 'Test', timestamp: new Date() }],
        'draft-to-delete'
      );
    });

    await act(async () => {
      await result.current.resetConversation();
    });

    await waitFor(() => {
      expect(mockOnDraftDelete).toHaveBeenCalledWith('draft-to-delete');
    });
  });
});

