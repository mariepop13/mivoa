import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEntryOperations } from '../use-entry-operations';
import { useStorage } from '@/repositories/storage-provider';
import { useEntryAnalysis } from '../use-entry-analysis';
import * as journalHandlers from '@/app/handlers/journal-handlers';
import type { StorageBackend } from '@/repositories/storage-backend';

vi.mock('@/repositories/storage-provider', () => ({
  useStorage: vi.fn(),
  useEntriesByDate: vi.fn(),
  useEntry: vi.fn(),
  useAllEntries: vi.fn(),
}));
vi.mock('../use-entry-analysis');
vi.mock('@/app/handlers/journal-handlers');

describe('useEntryOperations', () => {
  let mockBackend: StorageBackend;
  const mockAnalyze = vi.fn().mockResolvedValue({ mood: 'happy', themes: [], keyTakeaways: [] });

  const mockUpdateEntryState = vi.fn();
  const mockSetIsSaving = vi.fn();
  const mockSetSaveError = vi.fn();
  const mockSetLastSavedAt = vi.fn();
  const mockSetSelectedEntryId = vi.fn();
  const mockSetContent = vi.fn();
  const mockSetTitle = vi.fn();
  const mockHasInitializedRef = { current: false };

  const defaultParams = {
    dateKey: '2024-01-15',
    selectedEntryId: 'entry-1',
    entries: [
      { id: 'entry-1', content: 'Content 1', title: 'Title 1', date: '2024-01-15', createdAt: '2024-01-15T00:00:00Z', updatedAt: '2024-01-15T00:00:00Z' },
      { id: 'entry-2', content: 'Content 2', title: 'Title 2', date: '2024-01-15', createdAt: '2024-01-15T00:00:00Z', updatedAt: '2024-01-15T00:00:00Z' },
    ] as any,
    updateEntryState: mockUpdateEntryState,
    setIsSaving: mockSetIsSaving,
    setSaveError: mockSetSaveError,
    setLastSavedAt: mockSetLastSavedAt,
    setSelectedEntryId: mockSetSelectedEntryId,
    setContent: mockSetContent,
    setTitle: mockSetTitle,
    hasInitializedRef: mockHasInitializedRef,
  };

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
    vi.mocked(useEntryAnalysis).mockReturnValue({
      analyze: mockAnalyze,
      isAnalyzing: false,
      error: null,
    });
    vi.mocked(journalHandlers.generateEntryId).mockReturnValue('new-entry-id');
    vi.mocked(journalHandlers.createEntryDocument).mockResolvedValue(undefined);
    vi.mocked(journalHandlers.triggerEntryAnalysis).mockReturnValue(undefined);
    vi.mocked(journalHandlers.changeEntryDate).mockResolvedValue(undefined);
  });

  describe('createNewEntry', () => {
    it('should create a new entry successfully', async () => {
      const { result } = renderHook(() => useEntryOperations(defaultParams));

      await act(async () => {
        await result.current.createNewEntry('New content', 'New title');
      });

      expect(mockSetIsSaving).toHaveBeenCalledWith(true);
      expect(mockSetSaveError).toHaveBeenCalledWith(null);
      expect(journalHandlers.generateEntryId).toHaveBeenCalledWith('2024-01-15');
      expect(journalHandlers.createEntryDocument).toHaveBeenCalledWith({
        entryId: 'new-entry-id',
        content: 'New content',
        title: 'New title',
        dateKey: '2024-01-15',
        backend: mockBackend,
      });
      expect(mockUpdateEntryState).toHaveBeenCalledWith('new-entry-id', 'New content', 'New title');
      expect(journalHandlers.triggerEntryAnalysis).toHaveBeenCalled();
      expect(mockSetIsSaving).toHaveBeenCalledWith(false);
    });

    it('should not create entry when backend is missing', async () => {
      vi.mocked(useStorage).mockReturnValue({
        backend: null,
        user: null,
        isUserLoading: false,
      });

      const { result } = renderHook(() => useEntryOperations(defaultParams));

      await act(async () => {
        await result.current.createNewEntry('Content');
      });

      expect(journalHandlers.createEntryDocument).not.toHaveBeenCalled();
    });

    it('should handle errors when creating entry', async () => {
      const error = new Error('Creation failed');
      vi.mocked(journalHandlers.createEntryDocument).mockRejectedValue(error);

      const { result } = renderHook(() => useEntryOperations(defaultParams));

      await act(async () => {
        await result.current.createNewEntry('Content');
      });

      expect(mockSetSaveError).toHaveBeenCalledWith('Creation failed');
      expect(mockSetIsSaving).toHaveBeenCalledWith(false);
    });
  });

  describe('saveEntry', () => {
    it('should save entry successfully', async () => {
      const { result } = renderHook(() => useEntryOperations(defaultParams));

      await act(async () => {
        await result.current.saveEntry('Updated content');
      });

      expect(mockSetIsSaving).toHaveBeenCalledWith(true);
      expect(mockSetSaveError).toHaveBeenCalledWith(null);
      expect(mockBackend.updateEntry).toHaveBeenCalledWith('entry-1', {
        content: 'Updated content',
      });
      expect(mockSetLastSavedAt).toHaveBeenCalled();
      expect(mockSetIsSaving).toHaveBeenCalledWith(false);
    });

    it('should not save when selectedEntryId is missing', async () => {
      const { result } = renderHook(() =>
        useEntryOperations({ ...defaultParams, selectedEntryId: null })
      );

      await act(async () => {
        await result.current.saveEntry('Content');
      });

      expect(mockBackend.updateEntry).not.toHaveBeenCalled();
      expect(mockSetIsSaving).not.toHaveBeenCalled();
    });

    it('should not save when backend is missing', async () => {
      vi.mocked(useStorage).mockReturnValue({
        backend: null,
        user: null,
        isUserLoading: false,
      });

      const { result } = renderHook(() => useEntryOperations(defaultParams));

      await act(async () => {
        await result.current.saveEntry('Content');
      });

      expect(mockSetIsSaving).not.toHaveBeenCalled();
    });

    it('should handle errors when saving entry', async () => {
      const error = new Error('Save failed');
      vi.mocked(mockBackend.updateEntry).mockRejectedValue(error);

      const { result } = renderHook(() => useEntryOperations(defaultParams));

      await act(async () => {
        await result.current.saveEntry('Content');
      });

      expect(mockSetSaveError).toHaveBeenCalledWith('Save failed');
      expect(mockSetLastSavedAt).toHaveBeenCalledWith(null);
      expect(mockSetIsSaving).toHaveBeenCalledWith(false);
    });
  });

  describe('handleDelete', () => {
    it('should delete entry and select next entry', async () => {
      const { result } = renderHook(() => useEntryOperations(defaultParams));

      await act(async () => {
        await result.current.handleDelete();
      });

      expect(mockSetIsSaving).toHaveBeenCalledWith(true);
      expect(mockSetSaveError).toHaveBeenCalledWith(null);
      expect(mockBackend.deleteEntry).toHaveBeenCalledWith('entry-1');
      expect(mockSetSelectedEntryId).toHaveBeenCalledWith('entry-2');
      expect(mockHasInitializedRef.current).toBe(false);
      expect(mockSetIsSaving).toHaveBeenCalledWith(false);
    });

    it('should clear selection when deleting last entry', async () => {
      const { result } = renderHook(() =>
        useEntryOperations({
          ...defaultParams,
          entries: [{ id: 'entry-1', content: 'Content', title: 'Title', date: '2024-01-15', createdAt: '2024-01-15T00:00:00Z', updatedAt: '2024-01-15T00:00:00Z' }] as any,
        })
      );

      await act(async () => {
        await result.current.handleDelete();
      });

      expect(mockSetSelectedEntryId).toHaveBeenCalledWith(null);
      expect(mockSetContent).toHaveBeenCalledWith('');
      expect(mockSetTitle).toHaveBeenCalledWith('');
      expect(mockSetLastSavedAt).toHaveBeenCalledWith(null);
    });

    it('should not delete when backend is missing', async () => {
      vi.mocked(useStorage).mockReturnValue({
        backend: null,
        user: null,
        isUserLoading: false,
      });

      const { result } = renderHook(() => useEntryOperations(defaultParams));

      await act(async () => {
        await result.current.handleDelete();
      });

      expect(mockSetIsSaving).not.toHaveBeenCalled();
    });

    it('should not delete when entryId is missing', async () => {
      const { result } = renderHook(() =>
        useEntryOperations({ ...defaultParams, selectedEntryId: null })
      );

      await act(async () => {
        await result.current.handleDelete();
      });

      expect(mockBackend.deleteEntry).not.toHaveBeenCalled();
    });

    it('should handle errors when deleting entry', async () => {
      const error = new Error('Delete failed');
      vi.mocked(mockBackend.deleteEntry).mockRejectedValue(error);

      const { result } = renderHook(() => useEntryOperations(defaultParams));

      await act(async () => {
        await result.current.handleDelete();
      });

      expect(mockSetSaveError).toHaveBeenCalledWith('Delete failed');
      expect(mockSetIsSaving).toHaveBeenCalledWith(false);
    });
  });

  describe('changeEntryDate', () => {
    const mockNewDate = new Date(2024, 0, 20);
    const mockOnDateChange = vi.fn();

    it('should change entry date successfully', async () => {
      const { result } = renderHook(() =>
        useEntryOperations({
          ...defaultParams,
          onDateChange: mockOnDateChange,
        })
      );

      await act(async () => {
        await result.current.changeEntryDate(mockNewDate);
      });

      expect(mockSetIsSaving).toHaveBeenCalledWith(true);
      expect(mockSetSaveError).toHaveBeenCalledWith(null);
      expect(journalHandlers.changeEntryDate).toHaveBeenCalledWith({
        entryId: 'entry-1',
        newDate: mockNewDate,
        backend: mockBackend,
      });
      expect(mockOnDateChange).toHaveBeenCalledWith(mockNewDate);
      expect(mockSetIsSaving).toHaveBeenCalledWith(false);
    });

    it('should not call onDateChange when not provided', async () => {
      const { result } = renderHook(() => useEntryOperations(defaultParams));

      await act(async () => {
        await result.current.changeEntryDate(mockNewDate);
      });

      expect(journalHandlers.changeEntryDate).toHaveBeenCalled();
      expect(mockOnDateChange).not.toHaveBeenCalled();
    });

    it('should not change date when backend is missing', async () => {
      vi.mocked(useStorage).mockReturnValue({
        backend: null,
        user: null,
        isUserLoading: false,
      });

      const { result } = renderHook(() =>
        useEntryOperations({
          ...defaultParams,
          onDateChange: mockOnDateChange,
        })
      );

      await act(async () => {
        await result.current.changeEntryDate(mockNewDate);
      });

      expect(journalHandlers.changeEntryDate).not.toHaveBeenCalled();
      expect(mockOnDateChange).not.toHaveBeenCalled();
    });

    it('should not change date when entryId is missing', async () => {
      const { result } = renderHook(() =>
        useEntryOperations({
          ...defaultParams,
          selectedEntryId: null,
          onDateChange: mockOnDateChange,
        })
      );

      await act(async () => {
        await result.current.changeEntryDate(mockNewDate);
      });

      expect(journalHandlers.changeEntryDate).not.toHaveBeenCalled();
      expect(mockOnDateChange).not.toHaveBeenCalled();
    });

    it('should handle errors when changing date', async () => {
      const error = new Error('Change date failed');
      vi.mocked(journalHandlers.changeEntryDate).mockRejectedValue(error);

      const { result } = renderHook(() =>
        useEntryOperations({
          ...defaultParams,
          onDateChange: mockOnDateChange,
        })
      );

      await act(async () => {
        await result.current.changeEntryDate(mockNewDate);
      });

      expect(mockSetSaveError).toHaveBeenCalledWith('Change date failed');
      expect(mockOnDateChange).not.toHaveBeenCalled();
      expect(mockSetIsSaving).toHaveBeenCalledWith(false);
    });

    it('should handle different dates correctly', async () => {
      const differentDate = new Date(2024, 11, 31);
      const { result } = renderHook(() =>
        useEntryOperations({
          ...defaultParams,
          onDateChange: mockOnDateChange,
        })
      );

      await act(async () => {
        await result.current.changeEntryDate(differentDate);
      });

      expect(journalHandlers.changeEntryDate).toHaveBeenCalledWith({
        entryId: 'entry-1',
        newDate: differentDate,
        backend: mockBackend,
      });
      expect(mockOnDateChange).toHaveBeenCalledWith(differentDate);
    });
  });
});
