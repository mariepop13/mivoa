import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useJournalEntries } from '../use-journal-entries';
import { useStorage, useEntriesByDate, useEntry, useAllEntries } from '@/repositories/storage-provider';
import { LanguageContext, SUPPORTED_LANGUAGES } from '@/context/LanguageContext';
import { OpenRouterApiKeyContext } from '@/context/OpenRouterApiKeyContext';
import { ModelContext } from '@/context/ModelContext';
import * as journalHandlers from '@/app/handlers/journal-handlers';
import * as summaryService from '@/ai/services/conversation-summary-service';
import type { StorageBackend } from '@/repositories/storage-backend';

vi.mock('@/repositories/storage-provider', () => ({
  useStorage: vi.fn(),
  useEntriesByDate: vi.fn(),
  useEntry: vi.fn(),
  useAllEntries: vi.fn(),
}));
vi.mock('@/app/handlers/journal-handlers');
vi.mock('@/ai/services/conversation-summary-service');
vi.mock('@/hooks/use-entry-analysis', () => ({
  useEntryAnalysis: () => ({
    analyze: vi.fn().mockResolvedValue({ mood: 'happy', themes: [], keyTakeaways: [] }),
  }),
}));

let mockBackend: StorageBackend;
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
    mockBackend = {
      subscribeToAuthState: vi.fn(),
      subscribeToEntriesByDate: vi.fn(),
      subscribeToEntry: vi.fn(),
      subscribeToAllEntries: vi.fn(),
      subscribeToSettings: vi.fn(),
      getEntries: vi.fn(),
      createEntry: vi.fn().mockResolvedValue(undefined),
      updateEntry: vi.fn().mockResolvedValue(undefined),
      deleteEntry: vi.fn().mockResolvedValue(undefined),
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
    vi.mocked(useEntriesByDate).mockReturnValue({ data: null, isLoading: false });
    vi.mocked(useAllEntries).mockReturnValue({ data: null, isLoading: false });
    vi.mocked(useEntry).mockReturnValue({ data: null, isLoading: false });
    vi.mocked(journalHandlers.generateEntryId).mockReturnValue('test-entry-id');
    vi.mocked(journalHandlers.createEntryDocument).mockResolvedValue(undefined);
    vi.mocked(journalHandlers.triggerEntryAnalysis).mockReturnValue(undefined);
    vi.mocked(journalHandlers.saveSummaryAsEntry).mockResolvedValue(undefined);
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
    vi.mocked(useEntry).mockReturnValue({
      data: { id: 'test-id', content: 'Old content', date: '2024-01-15', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      isLoading: false,
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

    expect(mockBackend.updateEntry).toHaveBeenCalledWith('test-id', { content: 'New content' });
    expect(result.current.lastSavedAt).not.toBeNull();
  });

  it('deletes entry', async () => {
    const mockEntries = [
      { id: 'entry-1', content: 'Content 1', date: '2024-01-15', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'entry-2', content: 'Content 2', date: '2024-01-15', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ];

    vi.mocked(useEntriesByDate).mockReturnValue({
      data: mockEntries as any,
      isLoading: false,
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

    expect(mockBackend.deleteEntry).toHaveBeenCalledWith('entry-1');
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

  it('calculates recent entries from all entries across different dates', async () => {
    // Use noon local time to avoid UTC-midnight timezone edge cases
    const today = new Date('2024-01-15T12:00:00');

    const allEntries = [
      { id: 'entry-1', content: 'Today entry', date: '2024-01-15', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'entry-2', content: 'Three days ago', date: '2024-01-12', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'entry-3', content: 'Eight days ago', date: '2024-01-07', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ];

    vi.mocked(useAllEntries).mockReturnValue({ data: allEntries as any, isLoading: false });

    const { result } = renderHook(() => useJournalEntries({ selectedDate: today }), { wrapper });

    await waitFor(() => {
      expect(result.current.recentEntries.length).toBeGreaterThan(0);
    });

    const recent = result.current.recentEntries;
    expect(recent.some(e => e.date === '2024-01-15')).toBe(true);
    expect(recent.some(e => e.date === '2024-01-12')).toBe(true);
    expect(recent.some(e => e.date === '2024-01-07')).toBe(false);
  });

  it('excludes entries older than 7 days from recent entries', async () => {
    // Use noon local time to avoid UTC-midnight timezone edge cases
    const today = new Date('2024-01-15T12:00:00');

    const allEntries = [
      { id: 'entry-1', content: 'Within 7 days', date: '2024-01-09', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'entry-2', content: 'Eight days ago', date: '2024-01-07', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'entry-3', content: 'Much older', date: '2023-12-01', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ];

    vi.mocked(useAllEntries).mockReturnValue({ data: allEntries as any, isLoading: false });

    const { result } = renderHook(() => useJournalEntries({ selectedDate: today }), { wrapper });

    await waitFor(() => {
      expect(result.current.recentEntries).toBeDefined();
    });

    const recent = result.current.recentEntries;
    expect(recent.some(e => e.date === '2024-01-09')).toBe(true);
    expect(recent.some(e => e.date === '2024-01-07')).toBe(false);
    expect(recent.some(e => e.date === '2023-12-01')).toBe(false);
  });

  it('excludes drafts from recent entries', async () => {
    const today = new Date('2024-01-15');

    const allEntries = [
      { id: 'entry-1', content: 'Normal entry', date: '2024-01-14', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'draft-1', content: 'Draft entry', date: '2024-01-13', isDraft: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ];

    vi.mocked(useAllEntries).mockReturnValue({ data: allEntries as any, isLoading: false });

    const { result } = renderHook(() => useJournalEntries({ selectedDate: today }), { wrapper });

    await waitFor(() => {
      expect(result.current.recentEntries).toBeDefined();
    });

    const recent = result.current.recentEntries;
    expect(recent.some(e => e.date === '2024-01-14')).toBe(true);
    expect(recent.some(e => e.content === 'Draft entry')).toBe(false);
  });

  it('excludes the currently selected entry from recent entries', async () => {
    const today = new Date('2024-01-15');

    const allEntries = [
      { id: 'selected-entry', content: 'Selected', date: '2024-01-14', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'other-entry', content: 'Other', date: '2024-01-13', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ];

    vi.mocked(useAllEntries).mockReturnValue({ data: allEntries as any, isLoading: false });

    const { result } = renderHook(() => useJournalEntries({ selectedDate: today }), { wrapper });

    await act(async () => {
      result.current.setSelectedEntryId('selected-entry');
    });

    await waitFor(() => {
      expect(result.current.selectedEntryId).toBe('selected-entry');
    });

    const recent = result.current.recentEntries;
    expect(recent.some(e => e.content === 'Selected')).toBe(false);
    expect(recent.some(e => e.content === 'Other')).toBe(true);
  });

  it('should save draft with handleSaveDraft', async () => {
    const mockMessages = [
      { role: 'user' as const, content: 'Hello', timestamp: new Date() },
      { role: 'assistant' as const, content: 'Hi', timestamp: new Date() },
    ];

    vi.mocked(useEntriesByDate).mockReturnValue({ data: [], isLoading: false });
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

    vi.mocked(useEntriesByDate).mockReturnValue({ data: [], isLoading: false });
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

    vi.mocked(useEntriesByDate).mockReturnValue({ data: [], isLoading: false });
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
    vi.mocked(useEntriesByDate).mockReturnValue({ data: [], isLoading: false });
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
      backend: mockBackend,
    });
  });

  it('should handle delete draft errors', async () => {
    vi.mocked(useEntriesByDate).mockReturnValue({ data: [], isLoading: false });
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
    vi.mocked(useEntriesByDate).mockReturnValue({ data: [], isLoading: false });

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
