import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEntryOperations } from '../use-entry-operations';
import { useFirestore, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { useUser } from '@/firebase/auth/use-user';
import { useEntryAnalysis } from '../use-entry-analysis';
import * as journalHandlers from '@/app/handlers/journal-handlers';
import { serverTimestamp } from 'firebase/firestore';
import type { User } from 'firebase/auth';

vi.mock('@/firebase');
vi.mock('@/firebase/auth/use-user');
vi.mock('../use-entry-analysis');
vi.mock('@/app/handlers/journal-handlers');
vi.mock('../use-subscription', () => ({
  useSubscription: vi.fn(() => ({
    plan: 'free',
    usage: { entriesUsed: 0 },
    limits: { entriesPerMonth: 10 },
    isLoading: false,
  })),
}));
vi.mock('../use-subscription-limits', () => ({
  useSubscriptionLimits: vi.fn(() => ({
    canCreateEntry: true,
    checkBeforeCreate: vi.fn().mockResolvedValue(true),
    entriesRemaining: 10,
    entriesUsed: 0,
    entriesLimit: 10,
    isLoading: false,
  })),
}));
vi.mock('firebase/firestore', () => ({
  serverTimestamp: vi.fn(() => ({ _methodName: 'serverTimestamp' })),
}));

describe('useEntryOperations', () => {
  const mockFirestore = { id: 'mock-firestore' } as any;
  const mockUser = { uid: 'test-user-id' } as Partial<User> as User;
  const mockDocRef = { id: 'mock-doc-ref' } as any;
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
    selectedEntryDocRef: mockDocRef,
    selectedEntryId: 'entry-1',
    entries: [
      { id: 'entry-1', content: 'Content 1', title: 'Title 1', date: '2024-01-15' },
      { id: 'entry-2', content: 'Content 2', title: 'Title 2', date: '2024-01-15' },
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
    vi.mocked(useFirestore).mockReturnValue(mockFirestore);
    vi.mocked(useUser).mockReturnValue({
      user: mockUser,
      isLoading: false,
      error: null,
    });
    vi.mocked(useEntryAnalysis).mockReturnValue({
      analyze: mockAnalyze,
      isAnalyzing: false,
      error: null,
    });
    vi.mocked(journalHandlers.generateEntryId).mockReturnValue('new-entry-id');
    vi.mocked(journalHandlers.createEntryDocument).mockResolvedValue(undefined);
    vi.mocked(journalHandlers.triggerEntryAnalysis).mockResolvedValue(undefined);
    vi.mocked(journalHandlers.changeEntryDate).mockResolvedValue(undefined);
    vi.mocked(updateDocumentNonBlocking).mockResolvedValue(undefined);
    vi.mocked(deleteDocumentNonBlocking).mockResolvedValue(undefined);
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
        firestore: mockFirestore,
        user: mockUser,
      });
      expect(mockUpdateEntryState).toHaveBeenCalledWith('new-entry-id', 'New content', 'New title');
      expect(journalHandlers.triggerEntryAnalysis).toHaveBeenCalled();
      expect(mockSetIsSaving).toHaveBeenCalledWith(false);
    });

  it('should not create entry when user is missing', async () => {
    vi.mocked(useUser).mockReturnValue({
      user: null,
      isLoading: false,
      error: null,
    });

      const { result } = renderHook(() => useEntryOperations(defaultParams));

      await act(async () => {
        await result.current.createNewEntry('Content');
      });

      expect(journalHandlers.createEntryDocument).not.toHaveBeenCalled();
    });

    it('should not create entry when firestore is missing', async () => {
      vi.mocked(useFirestore).mockReturnValue(null as any);

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
      expect(updateDocumentNonBlocking).toHaveBeenCalledWith(mockDocRef, {
        content: 'Updated content',
        updatedAt: serverTimestamp(),
      });
      expect(mockSetLastSavedAt).toHaveBeenCalled();
      expect(mockSetIsSaving).toHaveBeenCalledWith(false);
    });

    it('should not save when docRef is missing', async () => {
      const { result } = renderHook(() =>
        useEntryOperations({ ...defaultParams, selectedEntryDocRef: null })
      );

      await act(async () => {
        await result.current.saveEntry('Content');
      });

      expect(updateDocumentNonBlocking).not.toHaveBeenCalled();
      expect(mockSetIsSaving).not.toHaveBeenCalled();
    });

  it('should not save when user is missing', async () => {
    vi.mocked(useUser).mockReturnValue({
      user: null,
      isLoading: false,
      error: null,
    });

      const { result } = renderHook(() => useEntryOperations(defaultParams));

      await act(async () => {
        await result.current.saveEntry('Content');
      });

      expect(updateDocumentNonBlocking).not.toHaveBeenCalled();
    });

    it('should handle errors when saving entry', async () => {
      const error = new Error('Save failed');
      vi.mocked(updateDocumentNonBlocking).mockRejectedValue(error);

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
      expect(deleteDocumentNonBlocking).toHaveBeenCalledWith(mockDocRef);
      expect(mockSetSelectedEntryId).toHaveBeenCalledWith('entry-2');
      expect(mockHasInitializedRef.current).toBe(false);
      expect(mockSetIsSaving).toHaveBeenCalledWith(false);
    });

    it('should clear selection when deleting last entry', async () => {
      const { result } = renderHook(() =>
        useEntryOperations({
          ...defaultParams,
          entries: [{ id: 'entry-1', content: 'Content', title: 'Title', date: '2024-01-15' }] as any,
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

    it('should not delete when docRef is missing', async () => {
      const { result } = renderHook(() =>
        useEntryOperations({ ...defaultParams, selectedEntryDocRef: null })
      );

      await act(async () => {
        await result.current.handleDelete();
      });

      expect(deleteDocumentNonBlocking).not.toHaveBeenCalled();
    });

    it('should not delete when entryId is missing', async () => {
      const { result } = renderHook(() =>
        useEntryOperations({ ...defaultParams, selectedEntryId: null })
      );

      await act(async () => {
        await result.current.handleDelete();
      });

      expect(deleteDocumentNonBlocking).not.toHaveBeenCalled();
    });

    it('should handle errors when deleting entry', async () => {
      const error = new Error('Delete failed');
      vi.mocked(deleteDocumentNonBlocking).mockRejectedValue(error);

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
        firestore: mockFirestore,
        user: mockUser,
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

    it('should not change date when docRef is missing', async () => {
      const { result } = renderHook(() =>
        useEntryOperations({
          ...defaultParams,
          selectedEntryDocRef: null,
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

    it('should not change date when user is missing', async () => {
      vi.mocked(useUser).mockReturnValue({
        user: null,
        isLoading: false,
        error: null,
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

    it('should not change date when firestore is missing', async () => {
      vi.mocked(useFirestore).mockReturnValue(null as any);

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
        firestore: mockFirestore,
        user: mockUser,
      });
      expect(mockOnDateChange).toHaveBeenCalledWith(differentDate);
    });
  });
});

