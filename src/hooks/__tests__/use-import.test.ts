import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useImport } from '../use-import';
import { useFirestore } from '@/firebase';
import { useUser } from '@/firebase/auth/use-user';
import { collection, getDocs, setDoc, doc } from 'firebase/firestore';
import type { User } from 'firebase/auth';

vi.mock('@/firebase');
vi.mock('@/firebase/auth/use-user');

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
  doc: vi.fn(),
  Timestamp: {
    fromDate: vi.fn((d: Date) => ({ toDate: () => d, seconds: 0, nanoseconds: 0 })),
    now: vi.fn(() => ({ seconds: 0, nanoseconds: 0 })),
  },
}));

const mockFirestore = { id: 'mock-firestore' } as any;
const mockUser = { uid: 'test-uid' } as Partial<User> as User;

const validExportPayload = {
  version: 1,
  exportedAt: '2026-03-02T14:30:00Z',
  userId: 'old-uid',
  entries: [
    {
      id: '2026-03-02-143045123',
      content: 'Test content',
      title: 'Test',
      date: '2026-03-02',
      createdAt: '2026-03-02T14:30:45.000Z',
      updatedAt: '2026-03-02T14:31:00.000Z',
      moods: ['calm'],
      themes: [],
      keyTakeaways: [],
      places: [],
      characters: [],
      linkedEntryIds: [],
      conversationHistory: [],
    },
    {
      id: '2026-03-01-100000000',
      content: 'Existing content',
      title: 'Existing',
      date: '2026-03-01',
      createdAt: '2026-03-01T10:00:00.000Z',
      updatedAt: '2026-03-01T10:01:00.000Z',
      moods: [],
      themes: [],
      keyTakeaways: [],
      places: [],
      characters: [],
      linkedEntryIds: [],
      conversationHistory: [],
    },
  ],
};

function makeFile(content: string): File {
  return new File([content], 'export.json', { type: 'application/json' });
}

describe('useImport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useFirestore).mockReturnValue(mockFirestore);
    vi.mocked(useUser).mockReturnValue({ user: mockUser, isLoading: false, error: null });
    vi.mocked(collection).mockReturnValue({ id: 'mock-col' } as any);
    vi.mocked(doc).mockReturnValue({ id: 'mock-doc' } as any);
    vi.mocked(getDocs).mockResolvedValue({
      docs: [{ id: '2026-03-01-100000000' }],
    } as any);
    vi.mocked(setDoc).mockResolvedValue(undefined);
  });

  it('exposes isImporting as false initially', () => {
    const { result } = renderHook(() => useImport());
    expect(result.current.isImporting).toBe(false);
  });

  it('returns null when firestore is null', async () => {
    vi.mocked(useFirestore).mockReturnValue(null as any);
    const { result } = renderHook(() => useImport());
    const file = makeFile(JSON.stringify(validExportPayload));
    const preview = await result.current.parseFile(file);
    expect(preview).toBeNull();
  });

  it('throws on invalid JSON', async () => {
    const { result } = renderHook(() => useImport());
    const file = makeFile('not json');
    await expect(result.current.parseFile(file)).rejects.toThrow('invalid_json');
  });

  it('throws on unsupported version', async () => {
    const { result } = renderHook(() => useImport());
    const payload = { ...validExportPayload, version: 99 };
    const file = makeFile(JSON.stringify(payload));
    await expect(result.current.parseFile(file)).rejects.toThrow('unsupported_version');
  });

  it('correctly computes new vs skipped counts', async () => {
    const { result } = renderHook(() => useImport());
    const file = makeFile(JSON.stringify(validExportPayload));
    const preview = await result.current.parseFile(file);
    expect(preview).not.toBeNull();
    expect(preview!.total).toBe(2);
    expect(preview!.newCount).toBe(1);
    expect(preview!.skippedCount).toBe(1);
  });

  it('calls setDoc for each new entry on importEntries', async () => {
    const { result } = renderHook(() => useImport());
    const file = makeFile(JSON.stringify(validExportPayload));
    let preview: Awaited<ReturnType<typeof result.current.parseFile>>;
    await act(async () => {
      preview = await result.current.parseFile(file);
    });
    await act(async () => {
      await result.current.importEntries(preview!);
    });
    expect(setDoc).toHaveBeenCalledTimes(1);
  });
});
