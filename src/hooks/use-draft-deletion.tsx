'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type React from 'react';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import type { ToastActionElement } from '@/components/ui/toast';
import { useTranslation } from '@/hooks/use-translation';
import { saveConversationDraft } from '@/app/handlers/journal-handlers';
import { useFirestore } from '@/firebase';
import { useUser } from '@/firebase/auth/use-user';
import { format } from 'date-fns';
import type { JournalEntryData } from './use-journal-entries';

interface DeletedDraftData {
  draftId: string;
  draftData: JournalEntryData & { id: string };
  timestamp: number;
}

const UNDO_TIMEOUT = 30000;
const STORAGE_KEY = 'deleted_drafts';

function getDeletedDrafts(): DeletedDraftData[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveDeletedDraft(draft: DeletedDraftData): void {
  if (typeof window === 'undefined') return;
  try {
    const drafts = getDeletedDrafts();
    drafts.push(draft);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
  } catch {
    // Ignore storage errors
  }
}

function removeDeletedDraft(draftId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const drafts = getDeletedDrafts().filter(d => d.draftId !== draftId);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
  } catch {
    // Ignore storage errors
  }
}

function getUndoableDraft(): DeletedDraftData | null {
  const drafts = getDeletedDrafts();
  const now = Date.now();
  const validDraft = drafts.find(d => now - d.timestamp < UNDO_TIMEOUT);
  return validDraft || null;
}

function normalizeTimestamp(timestamp: Date | string | unknown): Date {
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp === 'string') return new Date(timestamp);
  return new Date();
}

function calculateUndoTimeRemaining(undoableDraft: DeletedDraftData | null): number | null {
  if (!undoableDraft) return null;
  const elapsed = Date.now() - undoableDraft.timestamp;
  const remaining = Math.max(0, UNDO_TIMEOUT - elapsed);
  return remaining > 0 ? Math.ceil(remaining / 1000) : null;
}

function createUndoToastAction(
  undoDelete: () => Promise<void>,
  undoableDraft: DeletedDraftData | null,
  t: (key: string) => string
): ToastActionElement | undefined {
  if (!undoableDraft) return undefined;
  const timeRemaining = calculateUndoTimeRemaining(undoableDraft);
  if (!timeRemaining || timeRemaining <= 0) return undefined;
  
  return (
    <ToastAction
      onClick={async () => {
        await undoDelete();
      }}
      className="text-sm font-medium text-primary hover:underline"
      altText={t('undoDelete')}
    >
      {t('undoDelete')} ({timeRemaining}s)
    </ToastAction>
  );
}

interface UseDraftDeletionParams {
  handleDeleteDraft: (draftId: string) => Promise<void>;
  selectedDate: Date;
  onOptimisticUpdate?: (draftId: string) => void;
  onRestore?: (draftId: string) => void;
}

interface UseDraftDeletionResult {
  deleteDraft: (draftId: string, draftData?: JournalEntryData & { id: string }) => Promise<void>;
  deleteDrafts: (draftIds: string[], draftsData?: (JournalEntryData & { id: string })[]) => Promise<void>;
  isDeleting: boolean;
  undoDelete: () => Promise<void>;
  canUndo: boolean;
  undoTimeRemaining: number | null;
}

export function useDraftDeletion({
  handleDeleteDraft,
  selectedDate,
  onOptimisticUpdate,
  onRestore,
}: UseDraftDeletionParams): UseDraftDeletionResult {
  const { toast } = useToast();
  const { t } = useTranslation();
  const firestore = useFirestore();
  const { user } = useUser();
  const [isDeleting, setIsDeleting] = useState(false);
  const deletingRef = useRef<Set<string>>(new Set());
  const [canUndo, setCanUndo] = useState(false);
  const [undoTimeRemaining, setUndoTimeRemaining] = useState<number | null>(null);

  useEffect(() => {
    const checkUndo = () => {
      const undoableDraft = getUndoableDraft();
      const hasUndoable = undoableDraft !== null;
      setCanUndo(hasUndoable);
      
      if (hasUndoable && undoableDraft) {
        const elapsed = Date.now() - undoableDraft.timestamp;
        const remaining = Math.max(0, UNDO_TIMEOUT - elapsed);
        setUndoTimeRemaining(Math.ceil(remaining / 1000));
        
        if (remaining <= 0) {
          removeDeletedDraft(undoableDraft.draftId);
          setCanUndo(false);
          setUndoTimeRemaining(null);
        }
      } else {
        setUndoTimeRemaining(null);
      }
    };
    checkUndo();
    const interval = setInterval(checkUndo, 1000);
    return () => clearInterval(interval);
  }, []);

  const undoDelete = useCallback(async (): Promise<void> => {
    const undoableDraft = getUndoableDraft();
    if (!undoableDraft || !firestore || !user) {
      return;
    }

    try {
      const dateKey = format(selectedDate, 'yyyy-MM-dd');
      const conversationHistory = undoableDraft.draftData.conversationHistory || [];
      
      await saveConversationDraft({
        draftId: undoableDraft.draftId,
        entryDateKey: dateKey,
        conversationHistory: conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: normalizeTimestamp(msg.timestamp),
        })),
        firestore,
        user,
      });

      removeDeletedDraft(undoableDraft.draftId);
      setCanUndo(false);
      setUndoTimeRemaining(null);

      if (onRestore) {
        onRestore(undoableDraft.draftId);
      }

      toast({
        title: t('draftRestored'),
        description: t('draftRestoredDescription'),
      });
    } catch (error) {
      console.error('Failed to undo delete:', error);
      toast({
        title: t('draftDeleteError'),
        description: error instanceof Error ? error.message : t('draftDeleteError'),
        variant: 'destructive',
      });
    }
  }, [firestore, user, selectedDate, onRestore, toast, t]);

  const deleteDraft = useCallback(async (
    draftId: string,
    draftData?: JournalEntryData & { id: string }
  ): Promise<void> => {
    if (deletingRef.current.has(draftId)) {
      return;
    }

    deletingRef.current.add(draftId);
    setIsDeleting(true);

    if (draftData) {
      saveDeletedDraft({
        draftId,
        draftData,
        timestamp: Date.now(),
      });
      setCanUndo(true);
    }

    if (onOptimisticUpdate) {
      onOptimisticUpdate(draftId);
    }

    try {
      await handleDeleteDraft(draftId);
      
      const undoableDraft = getUndoableDraft();
      toast({
        title: t('draftDeleted'),
        action: createUndoToastAction(undoDelete, undoableDraft, t),
      });
    } catch (error) {
      console.error('Failed to delete draft:', error);
      
      if (draftData && onRestore) {
        onRestore(draftId);
      }

      removeDeletedDraft(draftId);
      setCanUndo(false);

      toast({
        title: t('draftDeleteError'),
        description: error instanceof Error ? error.message : t('draftDeleteError'),
        variant: 'destructive',
      });
    } finally {
      deletingRef.current.delete(draftId);
      setIsDeleting(deletingRef.current.size > 0);
    }
  }, [handleDeleteDraft, onOptimisticUpdate, onRestore, toast, t, undoDelete]);

  const processBulkDeletion = useCallback(async (
    draftIds: string[],
    draftsData?: (JournalEntryData & { id: string })[]
  ): Promise<PromiseSettledResult<void>[]> => {
    if (draftIds.length === 0) return [];

    const isAnyDeleting = draftIds.some(id => deletingRef.current.has(id));
    if (isAnyDeleting) return [];

    draftIds.forEach(id => deletingRef.current.add(id));
    setIsDeleting(true);

    if (draftsData) {
      const draftsMap = new Map<string, JournalEntryData & { id: string }>();
      draftsData.forEach(draft => {
        draftsMap.set(draft.id, draft);
      });

      let savedCount = 0;
      draftIds.forEach(draftId => {
        const draft = draftsMap.get(draftId);
        if (draft) {
          saveDeletedDraft({
            draftId,
            draftData: draft,
            timestamp: Date.now(),
          });
          savedCount++;
        }
      });

      if (savedCount > 0) {
        setCanUndo(true);
      }
    }

    if (onOptimisticUpdate) {
      draftIds.forEach(id => onOptimisticUpdate(id));
    }

    return Promise.allSettled(
      draftIds.map(id => handleDeleteDraft(id))
    );
  }, [handleDeleteDraft, onOptimisticUpdate]);

  const handleBulkDeletionResults = useCallback((
    results: PromiseSettledResult<void>[],
    draftIds: string[],
    draftsData?: (JournalEntryData & { id: string })[]
  ): void => {
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failedCount = results.filter(r => r.status === 'rejected').length;

    if (failedCount > 0 && draftsData && onRestore) {
      results.forEach((result, index) => {
        if (result.status === 'rejected' && draftsData[index]) {
          onRestore(draftIds[index]);
        }
      });
    }

    draftIds.forEach((id, index) => {
      if (results[index]?.status === 'fulfilled') {
        removeDeletedDraft(id);
      }
    });

    setIsDeleting(false);
    draftIds.forEach(id => deletingRef.current.delete(id));

    if (successCount > 0) {
      const undoableDraft = getUndoableDraft();
      toast({
        title: t('draftsDeleted').replace('{{count}}', successCount.toString()),
        description: failedCount > 0 
          ? `${failedCount} ${t('draftDeleteError')}`
          : undefined,
        action: createUndoToastAction(undoDelete, undoableDraft, t),
      });
    }

    if (failedCount > 0 && successCount === 0) {
      toast({
        title: t('draftDeleteError'),
        variant: 'destructive',
      });
    }
  }, [onRestore, toast, t, undoDelete]);

  const deleteDrafts = useCallback(async (
    draftIds: string[],
    draftsData?: (JournalEntryData & { id: string })[]
  ): Promise<void> => {
    const results = await processBulkDeletion(draftIds, draftsData);
    if (results.length > 0) {
      handleBulkDeletionResults(results, draftIds, draftsData);
    }
  }, [processBulkDeletion, handleBulkDeletionResults]);

  return {
    deleteDraft,
    deleteDrafts,
    isDeleting,
    undoDelete,
    canUndo,
    undoTimeRemaining,
  };
}

