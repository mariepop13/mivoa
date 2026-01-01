import { useState, useEffect, useCallback, useContext, useRef, useMemo } from 'react';
import { OpenRouterApiKeyContext } from '@/context/OpenRouterApiKeyContext';
import { LanguageContext } from '@/context/LanguageContext';
import { useModel } from '@/context/ModelContext';
import { sendChatMessage, generateInitialMessage } from '@/ai/services/chat-service';
import { useMessageEditing } from '@/hooks/use-message-editing';
import type { ChatMessage } from '@/ai/types/chat';

interface UseChatConversationParams {
  dateKey?: string;
  onDraftSave?: (messages: ChatMessage[], draftId: string | null) => Promise<string | null>;
  onDraftDelete?: (draftId: string) => Promise<void>;
}

interface UseChatConversationResult {
  messages: ChatMessage[];
  isTyping: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  resetConversation: () => Promise<void>;
  loadConversation: (messages: ChatMessage[], draftId?: string | null) => void;
  editMessage: (messageIndex: number, newContent: string) => Promise<void>;
  regenerateFrom: (messageIndex: number) => Promise<void>;
  deleteMessage: (messageIndex: number) => Promise<void>;
  isEditing: boolean;
  isRegenerating: boolean;
  draftId: string | null;
}

const DRAFT_SAVE_DEBOUNCE_MS = 500;

// eslint-disable-next-line max-lines-per-function
export function useChatConversation(params?: UseChatConversationParams): UseChatConversationResult {
  const { dateKey, onDraftSave, onDraftDelete } = params || {};
  const { apiKey } = useContext(OpenRouterApiKeyContext);
  const { language } = useContext(LanguageContext);
  const { selectedModel } = useModel();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  // Tracks the draft ID or entry ID for which initialization has occurred.
  // Changed from boolean to string | null to properly handle draft/entry switching
  // and prevent re-initialization when switching between drafts and entries.
  const hasInitializedRef = useRef<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const lang = (language || 'en') as 'en' | 'fr';

  const conversationHistory = useMemo(() => messages, [messages]);

  const scheduleDraftSave = useCallback((finalMessages: ChatMessage[]) => {
    if (!onDraftSave || !dateKey || finalMessages.length === 0) {
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const savedDraftId = await onDraftSave(finalMessages, draftId);
        if (savedDraftId) {
          setDraftId(savedDraftId);
        }
      } catch (err) {
        console.error('Failed to save draft:', err);
      }
    }, DRAFT_SAVE_DEBOUNCE_MS);
  }, [onDraftSave, dateKey, draftId]);

  const handleDraftSave = useCallback(async (updatedMessages: ChatMessage[]) => {
    if (!onDraftSave || !dateKey || updatedMessages.length === 0) {
      return;
    }
    try {
      const savedDraftId = await onDraftSave(updatedMessages, draftId);
      if (savedDraftId) {
        setDraftId(savedDraftId);
      }
    } catch (err) {
      console.error('Failed to save draft:', err);
    }
  }, [onDraftSave, dateKey, draftId]);

  const handleMessagesUpdate = useCallback((updatedMessages: ChatMessage[]) => {
    setMessages(updatedMessages);
    scheduleDraftSave(updatedMessages);
  }, [scheduleDraftSave]);

  const {
    editMessage: editMessageInternal,
    regenerateFrom: regenerateFromInternal,
    deleteMessage: deleteMessageInternal,
    isEditing,
    isRegenerating,
    error: editingError,
  } = useMessageEditing({
    messages,
    onMessagesUpdate: handleMessagesUpdate,
    onDraftSave: handleDraftSave,
  });

  useEffect(() => {
    const currentDraftKey = draftId || '';
    const isInitialized = hasInitializedRef.current !== null;
    if (!draftId && !isInitialized && messages.length === 0) {
      const initialMessageContent = generateInitialMessage(lang);
      const initialMessage: ChatMessage = {
        role: 'assistant',
        content: initialMessageContent,
        timestamp: new Date(),
      };
      setMessages([initialMessage]);
      hasInitializedRef.current = currentDraftKey;
    }
  }, [draftId, messages.length, lang, selectedModel]);

  const loadConversation = useCallback((loadedMessages: ChatMessage[], loadedDraftId?: string | null): void => {
    if (loadedDraftId !== undefined) {
      const draftKey = loadedDraftId || '';
      hasInitializedRef.current = draftKey;
      setDraftId(loadedDraftId);
    } else {
      hasInitializedRef.current = loadedMessages.length > 0 ? '' : null;
      setDraftId(null);
    }
    setMessages(loadedMessages);
    setError(null);
    setIsTyping(false);
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!apiKey) {
      setError('API key not configured');
      return;
    }

    if (!content.trim()) {
      return;
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsTyping(true);
    setError(null);

    try {
      const response = await sendChatMessage({
        conversationHistory,
        userMessage: userMessage.content,
        apiKey,
        language: lang,
        model: selectedModel,
      });

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);
      scheduleDraftSave(finalMessages);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send message';
      setError(message);
      console.error('Failed to send chat message:', err);
    } finally {
      setIsTyping(false);
    }
  }, [apiKey, messages, lang, selectedModel, scheduleDraftSave, conversationHistory]);

  const resetConversation = useCallback(async (): Promise<void> => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    
    const currentDraftId = draftId;
    setMessages([]);
    setError(null);
    setIsTyping(false);
    setDraftId(null);
    hasInitializedRef.current = '';

    if (currentDraftId && onDraftDelete) {
      try {
        await onDraftDelete(currentDraftId);
      } catch (err) {
        console.error('Failed to delete draft:', err);
      }
    }
  }, [draftId, onDraftDelete]);

  useEffect(() => () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
  }, []);

  return {
    messages,
    isTyping: isTyping || isRegenerating,
    error: error || editingError,
    sendMessage,
    resetConversation,
    loadConversation,
    editMessage: editMessageInternal,
    regenerateFrom: regenerateFromInternal,
    deleteMessage: deleteMessageInternal,
    isEditing,
    isRegenerating,
    draftId,
  };
}

