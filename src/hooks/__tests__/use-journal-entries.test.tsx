import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useJournalEntries } from '../use-journal-entries';
import { useCollection, useDoc, useFirestore, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { useUser } from '@/firebase/auth/use-user';
import { LanguageContext, SUPPORTED_LANGUAGES } from '@/context/LanguageContext';
import { OpenRouterApiKeyContext } from '@/context/OpenRouterApiKeyContext';
import { ModelContext } from '@/context/ModelContext';
import * as journalHandlers from '@/app/handlers/journal-handlers';
import * as summaryService from '@/ai/services/conversation-summary-service';
import type { User } from 'firebase/auth';

vi.mock('@/firebase');
vi.mock('@/firebase/auth/use-user');
vi.mock('@/app/handlers/journal-handlers');
vi.mock('@/ai/services/conversation-summary-service');
vi.mock('firebase/firestore', () => {
  class MockTimestamp {
    seconds: number;
    nanoseconds: number;
    constructor(seconds: number, nanoseconds: number) {
      this.seconds = seconds;
      this.nanoseconds = nanoseconds;
    }
    toMillis(): number {
      return this.seconds * 1000 + this.nanoseconds / 1000000;
    }
    static now(): MockTimestamp {
      return new MockTimestamp(Math.floor(Date.now() / 1000), 0);
    }
  }
  return {
    collection: vi.fn(() => ({ id: 'mock-collection' })),
    doc: vi.fn(() => ({ id: 'mock-doc' })),
    query: vi.fn((ref) => ref),
    where: vi.fn(() => ({})),
    Timestamp: MockTimestamp,
    serverTimestamp: vi.fn(() => ({ _methodName: 'serverTimestamp' })),
  };
});
vi.mock('@/hooks/use-entry-analysis', () => ({
  useEntryAnalysis: () => ({
    analyze: vi.fn().mockResolvedValue({ mood: 'happy', themes: [], keyTakeaways: [] }),
  }),
}));

const mockFirestore = { id: 'mock-firestore' } as any;
const mockUser = { uid: 'test-user-id' } as Partial<User> as User;
const mockDate = new Date('2024-01-15');

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <LanguageContext.Provider value={{ language: 'en', setLanguage: vi.fn(), supportedLanguages: SUPPORTED_LANGUAGES }}>
    <OpenRouterApiKeyContext.Provider value={{ apiKey: 'test-key', setApiKey: vi.fn(), resetApiKey: vi.fn(), isLoading: false }}>
      <ModelContext.Provider value={{ selectedModel: 'test-model', setSelectedModel: vi.fn(), isLoading: false }}>
        {children}
      </ModelContext.Provider>
    </OpenRouterApiKeyContext.Provider>
  </LanguageContext.Provider>
);

describe('useJournalEntries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useFirestore).mockReturnValue(mockFirestore);
    vi.mocked(useUser).mockReturnValue({ user: mockUser, isLoading: false, error: null });
    vi.mocked(useCollection).mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });
    vi.mocked(useDoc).mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });
    vi.mocked(journalHandlers.generateEntryId).mockReturnValue('test-entry-id');
    vi.mocked(journalHandlers.createEntryDocument).mockResolvedValue(undefined);
    vi.mocked(journalHandlers.triggerEntryAnalysis).mockImplementation(() => {});
    vi.mocked(journalHandlers.saveSummaryAsEntry).mockResolvedValue(undefined);
    vi.mocked(deleteDocumentNonBlocking).mockResolvedValue(undefined);
    vi.mocked(updateDocumentNonBlocking).mockResolvedValue(undefined);
    vi.mocked(summaryService.generateConversationSummary).mockResolvedValue({
      content: 'Summary content',
      title: 'Summary title',
      insights: [],
    });
  });

  it('initializes with empty state', () => {
    const { result } = renderHook(() => useJournalEntries({ selectedDate: mockDate }), { wrapper });

    expect(result.current.entries).toBeNull();
    expect(result.current.selectedEntryId).toBeNull();
    expect(result.current.content).toBe('');
    expect(result.current.title).toBe('');
    expect(result.current.isSaving).toBe(false);
  });

  it('creates new entry', async () => {
    const { result } = renderHook(() => useJournalEntries({ selectedDate: mockDate }), { wrapper });

    await act(async () => {
      await result.current.createNewEntry('Test content', 'Test title');
    });

    expect(journalHandlers.createEntryDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        content: 'Test content',
        title: 'Test title',
      })
    );
  });

  it('saves entry when saveEntry is called', async () => {
    vi.mocked(useDoc).mockReturnValue({
      data: { id: 'test-id', content: 'Old content', date: '2024-01-15', createdAt: new Date() },
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useJournalEntries({ selectedDate: mockDate }), { wrapper });

    await act(async () => {
      result.current.setSelectedEntryId('test-id');
    });

    await waitFor(() => {
      expect(result.current.selectedEntryId).toBe('test-id');
      expect(result.current.content).toBe('Old content');
    });

    await act(async () => {
      await result.current.saveEntry('New content');
    });

    expect(updateDocumentNonBlocking).toHaveBeenCalled();
    expect(result.current.lastSavedAt).not.toBeNull();
  });

  it('deletes entry', async () => {
    const { Timestamp } = await import('firebase/firestore');
    const mockEntries = [
      { id: 'entry-1', content: 'Content 1', date: '2024-01-15', createdAt: Timestamp.now() },
      { id: 'entry-2', content: 'Content 2', date: '2024-01-15', createdAt: Timestamp.now() },
    ];

    vi.mocked(useCollection).mockReturnValue({
      data: mockEntries as any,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useJournalEntries({ selectedDate: mockDate }), { wrapper });

    await waitFor(() => {
      expect(result.current.entries).not.toBeNull();
    });

    await act(async () => {
      result.current.setSelectedEntryId('entry-1');
    });

    await waitFor(() => {
      expect(result.current.selectedEntryId).toBe('entry-1');
    });

    await act(async () => {
      await result.current.handleDelete();
    });

    expect(deleteDocumentNonBlocking).toHaveBeenCalled();
  });

  it('generates summary from conversation', async () => {
    const { result } = renderHook(() => useJournalEntries({ selectedDate: mockDate }), { wrapper });

    const conversationHistory = [
      { role: 'user' as const, content: 'User message', timestamp: new Date() },
      { role: 'assistant' as const, content: 'AI response', timestamp: new Date() },
    ];

    await act(async () => {
      await result.current.handleSummarizeConversation(conversationHistory);
    });

    expect(summaryService.generateConversationSummary).toHaveBeenCalled();
    expect(journalHandlers.saveSummaryAsEntry).toHaveBeenCalled();
  });

  it('calculates recent entries', async () => {
    const { Timestamp } = await import('firebase/firestore');
    const today = new Date('2024-01-15');
    const threeDaysAgo = new Date('2024-01-12');
    const oldDate = threeDaysAgo.toISOString().split('T')[0];

    const mockEntries = [
      { id: 'entry-1', content: 'Recent', date: '2024-01-15', createdAt: Timestamp.now() },
      { id: 'entry-2', content: 'Old', date: oldDate, createdAt: Timestamp.now() },
    ];

    vi.mocked(useCollection).mockReturnValue({
      data: mockEntries as any,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useJournalEntries({ selectedDate: today }), { wrapper });

    await waitFor(() => {
      expect(result.current.recentEntries.length).toBeGreaterThan(0);
    });

    const recent = result.current.recentEntries;
    expect(recent.some(e => e.date === '2024-01-15')).toBe(true);
  });

  it('should save draft with handleSaveDraft', async () => {
    const mockMessages = [
      { role: 'user' as const, content: 'Hello', timestamp: new Date() },
      { role: 'assistant' as const, content: 'Hi', timestamp: new Date() },
    ];

    vi.mocked(useCollection).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });
    vi.mocked(journalHandlers.saveConversationDraft).mockResolvedValue('new-draft-id');

    const { result } = renderHook(() => useJournalEntries({ selectedDate: mockDate }), { wrapper });

    await waitFor(() => {
      expect(result.current.entries).not.toBeNull();
    });

    await act(async () => {
      const draftId = await result.current.handleSaveDraft(mockMessages, null);
      expect(draftId).toBe('new-draft-id');
    });

    expect(journalHandlers.saveConversationDraft).toHaveBeenCalled();
  });

  it('should update conversation entry when entryId is provided', async () => {
    const mockMessages = [
      { role: 'user' as const, content: 'Hello', timestamp: new Date() },
    ];

    vi.mocked(useCollection).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });
    vi.mocked(journalHandlers.updateConversationEntry).mockResolvedValue(undefined);

    const { result } = renderHook(() => useJournalEntries({ selectedDate: mockDate }), { wrapper });

    await waitFor(() => {
      expect(result.current.entries).not.toBeNull();
    });

    await act(async () => {
      const entryId = await result.current.handleSaveDraft(mockMessages, null, 'existing-entry-id');
      expect(entryId).toBe('existing-entry-id');
    });

    expect(journalHandlers.updateConversationEntry).toHaveBeenCalled();
  });

  it('should return null when saving draft fails', async () => {
    const mockMessages = [
      { role: 'user' as const, content: 'Hello', timestamp: new Date() },
    ];

    vi.mocked(useCollection).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });
    vi.mocked(journalHandlers.saveConversationDraft).mockRejectedValue(new Error('Save failed'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useJournalEntries({ selectedDate: mockDate }), { wrapper });

    await waitFor(() => {
      expect(result.current.entries).not.toBeNull();
    });

    await act(async () => {
      const draftId = await result.current.handleSaveDraft(mockMessages, null);
      expect(draftId).toBeNull();
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('should delete draft with handleDeleteDraft', async () => {
    vi.mocked(useCollection).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });
    vi.mocked(journalHandlers.deleteDraft).mockResolvedValue(undefined);

    const { result } = renderHook(() => useJournalEntries({ selectedDate: mockDate }), { wrapper });

    await waitFor(() => {
      expect(result.current.entries).not.toBeNull();
    });

    await act(async () => {
      await result.current.handleDeleteDraft('draft-to-delete');
    });

    expect(journalHandlers.deleteDraft).toHaveBeenCalledWith({
      draftId: 'draft-to-delete',
      firestore: mockFirestore,
      user: mockUser,
    });
  });

  it('should handle delete draft errors', async () => {
    vi.mocked(useCollection).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });
    vi.mocked(journalHandlers.deleteDraft).mockRejectedValue(new Error('Delete failed'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useJournalEntries({ selectedDate: mockDate }), { wrapper });

    await waitFor(() => {
      expect(result.current.entries).not.toBeNull();
    });

    await act(async () => {
      await result.current.handleDeleteDraft('draft-to-delete');
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('should return null when handleSaveDraft is called with empty messages', async () => {
    vi.mocked(useCollection).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useJournalEntries({ selectedDate: mockDate }), { wrapper });

    await waitFor(() => {
      expect(result.current.entries).not.toBeNull();
    });

    await act(async () => {
      const draftId = await result.current.handleSaveDraft([], null);
      expect(draftId).toBeNull();
    });

    expect(journalHandlers.saveConversationDraft).not.toHaveBeenCalled();
  });
});

