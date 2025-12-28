import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useChatConversation } from '../use-chat-conversation';
import { OpenRouterApiKeyContext } from '@/context/OpenRouterApiKeyContext';
import { LanguageContext, SUPPORTED_LANGUAGES } from '@/context/LanguageContext';
import { ModelContext } from '@/context/ModelContext';
import * as chatService from '@/ai/services/chat-service';

vi.mock('@/ai/services/chat-service');

const mockApiKey = 'test-api-key';
const mockLanguage = 'en';
const mockModel = 'test-model';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <OpenRouterApiKeyContext.Provider value={{ apiKey: mockApiKey, setApiKey: vi.fn(), resetApiKey: vi.fn(), isLoading: false }}>
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
    const { result } = renderHook(() => useChatConversation(), { wrapper });

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].role).toBe('assistant');
      expect(result.current.messages[0].content).toBe('Initial message');
    });
  });

  it('sends message and updates conversation', async () => {
    const { result } = renderHook(() => useChatConversation(), { wrapper });

    await waitFor(() => {
      expect(result.current.messages.length).toBeGreaterThan(0);
    });

    await result.current.sendMessage('User message');

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

    const { result } = renderHook(() => useChatConversation(), { wrapper });

    await waitFor(() => {
      expect(result.current.messages.length).toBeGreaterThan(0);
    });

    await result.current.sendMessage('User message');

    await waitFor(() => {
      expect(result.current.error).toBe('API Error');
    });
  });

  it('does not send empty message', async () => {
    const { result } = renderHook(() => useChatConversation(), { wrapper });

    await waitFor(() => {
      expect(result.current.messages.length).toBeGreaterThan(0);
    });

    await result.current.sendMessage('   ');

    expect(chatService.sendChatMessage).not.toHaveBeenCalled();
  });

  it('resets conversation', async () => {
    const { result } = renderHook(() => useChatConversation(), { wrapper });

    await waitFor(() => {
      expect(result.current.messages.length).toBeGreaterThan(0);
    });

    result.current.resetConversation();

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

    const { result } = renderHook(() => useChatConversation(), { wrapper });

    await waitFor(() => {
      expect(result.current.messages.length).toBeGreaterThan(0);
    });

    const sendPromise = result.current.sendMessage('User message');

    await waitFor(() => {
      expect(result.current.isTyping).toBe(true);
    });

    resolvePromise!();
    await sendPromise;

    await waitFor(() => {
      expect(result.current.isTyping).toBe(false);
    });
  });
});

