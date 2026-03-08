import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDraftDeletion } from '../use-draft-deletion';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/use-translation';
import { useStorage } from '@/repositories/storage-provider';
import * as journalHandlers from '@/app/handlers/journal-handlers';
import type { StorageBackend } from '@/repositories/storage-backend';
import type { JournalEntryData } from '../use-journal-entries';

vi.mock('@/hooks/use-toast');
vi.mock('@/hooks/use-translation');
vi.mock('@/repositories/storage-provider');
vi.mock('@/app/handlers/journal-handlers');
vi.mock('@/components/ui/toast', () => ({
  ToastAction: ({ children }: { children: React.ReactNode }) => children,
}));

const STORAGE_KEY = 'deleted_drafts';
const UNDO_TIMEOUT = 30000;

function makeDraftData(id: string): JournalEntryData & { id: string } {
  return {
    id,
    content: `Content of ${id}`,
    date: '2024-01-15',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
    conversationHistory: [],
  };
}

describe('useDraftDeletion', () => {
  const mockToast = vi.fn();
  const mockHandleDeleteDraft = vi.fn().mockResolvedValue(undefined);
  const mockOnOptimisticUpdate = vi.fn();
  const mockOnRestore = vi.fn();

  const defaultParams = {
    handleDeleteDraft: mockHandleDeleteDraft,
    selectedDate: new Date('2024-01-15'),
    onOptimisticUpdate: mockOnOptimisticUpdate,
    onRestore: mockOnRestore,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();

    const mockBackend: Partial<StorageBackend> = {
      createEntry: vi.fn().mockResolvedValue(undefined),
      updateEntry: vi.fn().mockResolvedValue(undefined),
    };

    vi.mocked(useToast).mockReturnValue({
      toast: mockToast,
      dismiss: vi.fn(),
      toasts: [],
    });
    vi.mocked(useTranslation).mockReturnValue({
      t: (key: string) => key,
      language: 'en',
      isLoading: false,
      error: null,
    });
    vi.mocked(useStorage).mockReturnValue({
      backend: mockBackend as StorageBackend,
      user: { uid: 'test-user', displayName: null, email: null, photoURL: null },
      isUserLoading: false,
    });
    vi.mocked(journalHandlers.saveConversationDraft).mockResolvedValue('restored-id');
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  describe('undo ordering — LIFO', () => {
    it('restores the most recently deleted draft when two drafts are deleted in sequence', async () => {
      const now = Date.now();
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify([
        { draftId: 'draft-A', draftData: makeDraftData('draft-A'), timestamp: now - 5000 },
        { draftId: 'draft-B', draftData: makeDraftData('draft-B'), timestamp: now - 2000 },
      ]));

      const { result } = renderHook(() => useDraftDeletion(defaultParams));

      await act(async () => {
        await result.current.undoDelete();
      });

      expect(vi.mocked(journalHandlers.saveConversationDraft)).toHaveBeenCalledWith(
        expect.objectContaining({ draftId: 'draft-B' })
      );
    });

    it('skips expired drafts and restores the most recent valid draft', async () => {
      const now = Date.now();
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify([
        { draftId: 'draft-A', draftData: makeDraftData('draft-A'), timestamp: now - (UNDO_TIMEOUT + 5000) },
        { draftId: 'draft-B', draftData: makeDraftData('draft-B'), timestamp: now - 5000 },
      ]));

      const { result } = renderHook(() => useDraftDeletion(defaultParams));

      await act(async () => {
        await result.current.undoDelete();
      });

      expect(vi.mocked(journalHandlers.saveConversationDraft)).toHaveBeenCalledWith(
        expect.objectContaining({ draftId: 'draft-B' })
      );
    });

    it('does not call saveConversationDraft when all drafts have expired', async () => {
      const now = Date.now();
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify([
        { draftId: 'draft-A', draftData: makeDraftData('draft-A'), timestamp: now - (UNDO_TIMEOUT + 1000) },
      ]));

      const { result } = renderHook(() => useDraftDeletion(defaultParams));

      await act(async () => {
        await result.current.undoDelete();
      });

      expect(vi.mocked(journalHandlers.saveConversationDraft)).not.toHaveBeenCalled();
    });
  });

  describe('bulk deletion undo', () => {
    it('keeps successfully deleted drafts in undo stack after bulk deletion', async () => {
      const draftDataA = makeDraftData('draft-A');
      const draftDataB = makeDraftData('draft-B');
      const draftDataC = makeDraftData('draft-C');

      const { result } = renderHook(() => useDraftDeletion(defaultParams));

      await act(async () => {
        await result.current.deleteDrafts(
          ['draft-A', 'draft-B', 'draft-C'],
          [draftDataA, draftDataB, draftDataC]
        );
      });

      expect(result.current.canUndo).toBe(true);

      await act(async () => {
        await result.current.undoDelete();
      });

      expect(vi.mocked(journalHandlers.saveConversationDraft)).toHaveBeenCalled();
    });

    it('removes only failed bulk deletions from the undo stack and restores them to the UI', async () => {
      const mockHandleWithFailure = vi.fn()
        .mockRejectedValueOnce(new Error('network error'))
        .mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useDraftDeletion({ ...defaultParams, handleDeleteDraft: mockHandleWithFailure })
      );

      const draftDataA = makeDraftData('draft-A');
      const draftDataB = makeDraftData('draft-B');

      await act(async () => {
        await result.current.deleteDrafts(['draft-A', 'draft-B'], [draftDataA, draftDataB]);
      });

      expect(mockOnRestore).toHaveBeenCalledWith('draft-A');
      expect(mockOnRestore).not.toHaveBeenCalledWith('draft-B');

      const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]');
      expect(stored.some((d: { draftId: string }) => d.draftId === 'draft-B')).toBe(true);
      expect(stored.some((d: { draftId: string }) => d.draftId === 'draft-A')).toBe(false);
    });
  });
});
