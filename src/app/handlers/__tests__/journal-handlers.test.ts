import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  changeEntryDate,
  generateEntryId,
  triggerEntryAnalysis,
  createEntryDocument,
  saveSummaryAsEntry,
  saveConversationDraft,
  deleteDraft,
  updateConversationEntry,
  createEntryLink,
  deleteEntryLink,
} from '../journal-handlers';
import { setDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { format } from 'date-fns';
import { doc, serverTimestamp, type Firestore, writeBatch } from 'firebase/firestore';

vi.mock('@/firebase');
vi.mock('date-fns', () => ({
  format: vi.fn((date: Date, formatStr: string) => {
    if (formatStr === 'yyyy-MM-dd') {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return '';
  }),
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((firestore, path) => ({ id: 'mock-doc', path })),
  serverTimestamp: vi.fn(() => ({ _methodName: 'serverTimestamp' })),
  Timestamp: {
    fromDate: vi.fn((date: Date) => ({ seconds: Math.floor(date.getTime() / 1000), nanoseconds: 0 })),
  },
  arrayUnion: vi.fn((...items) => ({ _methodName: 'arrayUnion', items })),
  arrayRemove: vi.fn((...items) => ({ _methodName: 'arrayRemove', items })),
  writeBatch: vi.fn(() => ({
    update: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined),
  })),
}));

describe('changeEntryDate', () => {
  const mockFirestore = { id: 'mock-firestore' } as unknown as Firestore;
  const mockUser = { uid: 'test-user-id' };
  const mockEntryId = 'test-entry-id';
  const mockNewDate = new Date(2024, 0, 20);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(updateDocumentNonBlocking).mockResolvedValue(undefined);
  });

  it('should format date correctly', async () => {
    await changeEntryDate({
      entryId: mockEntryId,
      newDate: mockNewDate,
      firestore: mockFirestore,
      user: mockUser,
    });

    expect(format).toHaveBeenCalledWith(mockNewDate, 'yyyy-MM-dd');
  });

  it('should create correct document reference', async () => {
    await changeEntryDate({
      entryId: mockEntryId,
      newDate: mockNewDate,
      firestore: mockFirestore,
      user: mockUser,
    });

    expect(doc).toHaveBeenCalledWith(mockFirestore, `users/${mockUser.uid}/entries/${mockEntryId}`);
  });

  it('should update document with new date and updatedAt timestamp', async () => {
    await changeEntryDate({
      entryId: mockEntryId,
      newDate: mockNewDate,
      firestore: mockFirestore,
      user: mockUser,
    });

    expect(updateDocumentNonBlocking).toHaveBeenCalledWith(
      { id: 'mock-doc', path: `users/${mockUser.uid}/entries/${mockEntryId}` },
      {
        date: '2024-01-20',
        updatedAt: { _methodName: 'serverTimestamp' },
      }
    );
  });

  it('should handle different dates correctly', async () => {
    const differentDate = new Date(2024, 11, 31);
    
    await changeEntryDate({
      entryId: mockEntryId,
      newDate: differentDate,
      firestore: mockFirestore,
      user: mockUser,
    });

    expect(format).toHaveBeenCalledWith(differentDate, 'yyyy-MM-dd');
    expect(updateDocumentNonBlocking).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        date: '2024-12-31',
      })
    );
  });

  it('should return promise that resolves when update completes', async () => {
    const promise = changeEntryDate({
      entryId: mockEntryId,
      newDate: mockNewDate,
      firestore: mockFirestore,
      user: mockUser,
    });

    expect(promise).toBeInstanceOf(Promise);
    await expect(promise).resolves.toBeUndefined();
  });

  it('should handle update errors', async () => {
    const mockError = new Error('Update failed');
    vi.mocked(updateDocumentNonBlocking).mockRejectedValue(mockError);

    await expect(
      changeEntryDate({
        entryId: mockEntryId,
        newDate: mockNewDate,
        firestore: mockFirestore,
        user: mockUser,
      })
    ).rejects.toThrow('Update failed');
  });

  it('should use serverTimestamp for updatedAt', async () => {
    await changeEntryDate({
      entryId: mockEntryId,
      newDate: mockNewDate,
      firestore: mockFirestore,
      user: mockUser,
    });

    expect(serverTimestamp).toHaveBeenCalled();
  });

  describe('generateEntryId', () => {
    it('should generate entry ID with date key and timestamp', () => {
      const dateKey = '2024-01-20';
      const entryId = generateEntryId(dateKey);
      
      expect(entryId).toMatch(/^2024-01-20-\d{9}$/);
      expect(entryId.startsWith(dateKey)).toBe(true);
    });

    it('should generate unique IDs for same date key', async () => {
      const dateKey = '2024-01-20';
      const id1 = generateEntryId(dateKey);
      await new Promise((resolve) => setTimeout(resolve, 5));
      const id2 = generateEntryId(dateKey);
      
      expect(id1).not.toBe(id2);
    });
  });

  describe('triggerEntryAnalysis', () => {
    const mockFirestore = { id: 'mock-firestore' } as unknown as Firestore;
    const mockUser = { uid: 'test-user-id' };
    const mockEntryId = 'test-entry-id';

    beforeEach(() => {
      vi.clearAllMocks();
      vi.mocked(updateDocumentNonBlocking).mockResolvedValue(undefined);
    });

    it('should not trigger analysis for content shorter than minimum length', () => {
      const mockAnalyze = vi.fn();
      
      triggerEntryAnalysis({
        content: 'short',
        entryId: mockEntryId,
        firestore: mockFirestore,
        user: mockUser,
        analyze: mockAnalyze,
      });

      expect(mockAnalyze).not.toHaveBeenCalled();
    });

    it('should trigger analysis for content longer than minimum length', async () => {
      const mockAnalysis = {
        moods: ['happy'],
        moodEmojis: { happy: '😊' },
        themes: ['gratitude'],
      };
      const mockAnalyze = vi.fn().mockResolvedValue(mockAnalysis);
      
      triggerEntryAnalysis({
        content: 'This is a longer content that should trigger analysis because it exceeds the minimum length requirement.',
        entryId: mockEntryId,
        firestore: mockFirestore,
        user: mockUser,
        analyze: mockAnalyze,
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockAnalyze).toHaveBeenCalled();
    });

    it('should save analysis data when analysis succeeds', async () => {
      const mockAnalysis = {
        moods: ['happy'],
        moodEmojis: { happy: '😊' },
        themes: ['gratitude'],
      };
      const mockAnalyze = vi.fn().mockResolvedValue(mockAnalysis);
      
      triggerEntryAnalysis({
        content: 'This is a longer content that should trigger analysis because it exceeds the minimum length requirement.',
        entryId: mockEntryId,
        firestore: mockFirestore,
        user: mockUser,
        analyze: mockAnalyze,
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(updateDocumentNonBlocking).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          moods: ['happy'],
          moodEmojis: { happy: '😊' },
          themes: ['gratitude'],
        })
      );
    });

    it('should not save when analysis returns null', async () => {
      const mockAnalyze = vi.fn().mockResolvedValue(null);
      
      triggerEntryAnalysis({
        content: 'This is a longer content that should trigger analysis because it exceeds the minimum length requirement.',
        entryId: mockEntryId,
        firestore: mockFirestore,
        user: mockUser,
        analyze: mockAnalyze,
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(updateDocumentNonBlocking).not.toHaveBeenCalled();
    });
  });

  describe('createEntryDocument', () => {
    const mockFirestore = { id: 'mock-firestore' } as unknown as Firestore;
    const mockUser = { uid: 'test-user-id' };

    beforeEach(() => {
      vi.clearAllMocks();
      vi.mocked(setDocumentNonBlocking).mockResolvedValue(undefined);
    });

    it('should create entry document with required fields', async () => {
      await createEntryDocument({
        entryId: 'entry-id',
        content: 'Entry content',
        title: '',
        dateKey: '2024-01-20',
        firestore: mockFirestore,
        user: mockUser,
      });

      expect(setDocumentNonBlocking).toHaveBeenCalledWith(
        expect.any(Object),
        {
          content: 'Entry content',
          date: '2024-01-20',
          createdAt: { _methodName: 'serverTimestamp' },
          updatedAt: { _methodName: 'serverTimestamp' },
        },
        {}
      );
    });

    it('should include title when provided', async () => {
      await createEntryDocument({
        entryId: 'entry-id',
        content: 'Entry content',
        title: 'Entry title',
        dateKey: '2024-01-20',
        firestore: mockFirestore,
        user: mockUser,
      });

      expect(setDocumentNonBlocking).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          title: 'Entry title',
        }),
        {}
      );
    });
  });

  describe('saveSummaryAsEntry', () => {
    const mockFirestore = { id: 'mock-firestore' } as unknown as Firestore;
    const mockUser = { uid: 'test-user-id' };
    const mockConversationHistory = [
      { role: 'user' as const, content: 'Hello', timestamp: new Date() },
      { role: 'assistant' as const, content: 'Hi', timestamp: new Date() },
    ];

    beforeEach(() => {
      vi.clearAllMocks();
      vi.mocked(setDocumentNonBlocking).mockResolvedValue(undefined);
    });

    it('should save summary as entry with conversation history', async () => {
      await saveSummaryAsEntry({
        entryId: 'entry-id',
        entryDateKey: '2024-01-20',
        summary: { content: 'Summary content', title: 'Summary title' },
        conversationHistory: mockConversationHistory,
        firestore: mockFirestore,
        user: mockUser,
      });

      expect(setDocumentNonBlocking).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          content: 'Summary content',
          title: 'Summary title',
          date: '2024-01-20',
          conversationMode: true,
          isDraft: false,
        }),
        {}
      );
    });

    it('should use draftId when provided', async () => {
      await saveSummaryAsEntry({
        entryId: 'entry-id',
        entryDateKey: '2024-01-20',
        summary: { content: 'Summary', title: 'Title' },
        conversationHistory: mockConversationHistory,
        firestore: mockFirestore,
        user: mockUser,
        draftId: 'draft-id',
      });

      expect(doc).toHaveBeenCalledWith(mockFirestore, 'users/test-user-id/entries/draft-id');
    });
  });

  describe('saveConversationDraft', () => {
    const mockFirestore = { id: 'mock-firestore' } as unknown as Firestore;
    const mockUser = { uid: 'test-user-id' };
    const mockConversationHistory = [
      { role: 'user' as const, content: 'Hello', timestamp: new Date() },
    ];

    beforeEach(() => {
      vi.clearAllMocks();
      vi.mocked(setDocumentNonBlocking).mockResolvedValue(undefined);
    });

    it('should save draft and return draft ID', async () => {
      const draftId = await saveConversationDraft({
        draftId: null,
        entryDateKey: '2024-01-20',
        conversationHistory: mockConversationHistory,
        firestore: mockFirestore,
        user: mockUser,
      });

      expect(draftId).toBeDefined();
      expect(setDocumentNonBlocking).toHaveBeenCalled();
    });

    it('should use existing draftId when provided', async () => {
      const existingDraftId = 'existing-draft-id';
      const draftId = await saveConversationDraft({
        draftId: existingDraftId,
        entryDateKey: '2024-01-20',
        conversationHistory: mockConversationHistory,
        firestore: mockFirestore,
        user: mockUser,
      });

      expect(draftId).toBe(existingDraftId);
    });
  });

  describe('deleteDraft', () => {
    const mockFirestore = { id: 'mock-firestore' } as unknown as Firestore;
    const mockUser = { uid: 'test-user-id' };

    beforeEach(() => {
      vi.clearAllMocks();
      vi.mocked(deleteDocumentNonBlocking).mockResolvedValue(undefined);
    });

    it('should delete draft document', async () => {
      await deleteDraft({
        draftId: 'draft-id',
        firestore: mockFirestore,
        user: mockUser,
      });

      expect(deleteDocumentNonBlocking).toHaveBeenCalledWith(
        expect.any(Object)
      );
    });
  });

  describe('updateConversationEntry', () => {
    const mockFirestore = { id: 'mock-firestore' } as unknown as Firestore;
    const mockUser = { uid: 'test-user-id' };
    const mockConversationHistory = [
      { role: 'user' as const, content: 'Hello', timestamp: new Date() },
    ];

    beforeEach(() => {
      vi.clearAllMocks();
      vi.mocked(updateDocumentNonBlocking).mockResolvedValue(undefined);
    });

    it('should update conversation entry with new history', async () => {
      await updateConversationEntry({
        entryId: 'entry-id',
        conversationHistory: mockConversationHistory,
        firestore: mockFirestore,
        user: mockUser,
      });

      expect(updateDocumentNonBlocking).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          conversationHistory: expect.any(Array),
          updatedAt: { _methodName: 'serverTimestamp' },
        })
      );
    });
  });

  describe('createEntryLink', () => {
    const mockFirestore = { id: 'mock-firestore' } as unknown as Firestore;
    const mockUser = { uid: 'test-user-id' };

    beforeEach(() => {
      vi.clearAllMocks();
      const mockBatch = {
        update: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined),
      };
      vi.mocked(writeBatch).mockReturnValue(mockBatch as any);
    });

    it('should create bidirectional link between entries', async () => {
      await createEntryLink({
        fromEntryId: 'entry-1',
        toEntryId: 'entry-2',
        firestore: mockFirestore,
        user: mockUser,
      });

      const mockBatch = vi.mocked(writeBatch).mock.results[0].value as any;
      expect(mockBatch.update).toHaveBeenCalledTimes(2);
      expect(mockBatch.commit).toHaveBeenCalled();
    });
  });

  describe('deleteEntryLink', () => {
    const mockFirestore = { id: 'mock-firestore' } as unknown as Firestore;
    const mockUser = { uid: 'test-user-id' };

    beforeEach(() => {
      vi.clearAllMocks();
      const mockBatch = {
        update: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined),
      };
      vi.mocked(writeBatch).mockReturnValue(mockBatch as any);
    });

    it('should remove bidirectional link between entries', async () => {
      await deleteEntryLink({
        fromEntryId: 'entry-1',
        toEntryId: 'entry-2',
        firestore: mockFirestore,
        user: mockUser,
      });

      const mockBatch = vi.mocked(writeBatch).mock.results[0].value as any;
      expect(mockBatch.update).toHaveBeenCalledTimes(2);
      expect(mockBatch.commit).toHaveBeenCalled();
    });
  });
});

