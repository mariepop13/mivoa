# Import / Export Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add JSON and Markdown export + JSON import to the journal, accessible via a "..." menu in the sidebar header.

**Architecture:** Client-side only. Reads all entries from Firestore with `getDocs`, generates files in-browser using `jszip` + `file-saver`. Import parses a JSON file, compares IDs, and batch-writes new entries with `setDoc`.

**Tech Stack:** Next.js 15, TypeScript, Vitest, Firebase Firestore, Shadcn UI (DropdownMenu, AlertDialog), jszip, file-saver

---

### Task 1: Install dependencies

**Files:**
- Modify: `package.json` (auto via npm)

**Step 1: Install jszip and file-saver**

```bash
npm install jszip file-saver
npm install --save-dev @types/file-saver
```

**Step 2: Verify install**

```bash
npm ls jszip file-saver
```

Expected: both listed under dependencies.

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "📦 deps: add jszip and file-saver for client-side export"
```

---

### Task 2: Add translation keys

**Files:**
- Modify: `src/locales/en.json`
- Modify: `src/locales/fr.json`

**Step 1: Add keys to `src/locales/en.json`**

Add these keys anywhere in the object (keep alphabetical order with neighbors):

```json
"exportJSON": "Export JSON",
"exportMarkdown": "Export Markdown",
"exportSuccess": "Export downloaded",
"importJSON": "Import JSON",
"importConfirmTitle": "Import entries",
"importConfirmDescription": "{{total}} entries found. {{new}} new entries will be imported ({{skipped}} already present will be skipped).",
"importSuccess": "{{count}} entries imported",
"importError": "Import failed",
"importInvalidFile": "Invalid file",
"importUnsupportedVersion": "Unsupported format version",
"dataManagement": "Data"
```

**Step 2: Add keys to `src/locales/fr.json`**

```json
"exportJSON": "Exporter en JSON",
"exportMarkdown": "Exporter en Markdown",
"exportSuccess": "Export téléchargé",
"importJSON": "Importer un JSON",
"importConfirmTitle": "Importer des entrées",
"importConfirmDescription": "{{total}} entrées trouvées. {{new}} nouvelles entrées seront importées ({{skipped}} déjà présentes seront ignorées).",
"importSuccess": "{{count}} entrées importées",
"importError": "Erreur lors de l'import",
"importInvalidFile": "Fichier invalide",
"importUnsupportedVersion": "Version de format non supportée",
"dataManagement": "Données"
```

**Step 3: Commit**

```bash
git add src/locales/en.json src/locales/fr.json
git commit -m "🌐 i18n: add import/export translation keys"
```

---

### Task 3: Create `use-export` hook with tests

**Files:**
- Create: `src/hooks/use-export.ts`
- Create: `src/hooks/__tests__/use-export.test.ts`

**Step 1: Write the failing tests**

Create `src/hooks/__tests__/use-export.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useExport } from '../use-export';
import { useFirestore } from '@/firebase';
import { useUser } from '@/firebase/auth/use-user';
import { collection, getDocs } from 'firebase/firestore';
import type { User } from 'firebase/auth';

vi.mock('@/firebase');
vi.mock('@/firebase/auth/use-user');
vi.mock('jszip');
vi.mock('file-saver');

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  getDocs: vi.fn(),
  Timestamp: {
    fromDate: vi.fn((d: Date) => ({ toDate: () => d, seconds: 0, nanoseconds: 0 })),
  },
}));

const mockFirestore = { id: 'mock-firestore' } as any;
const mockUser = { uid: 'test-uid' } as Partial<User> as User;

const mockEntry = {
  id: '2026-03-02-143045123',
  content: 'Test content',
  title: 'Test title',
  date: '2026-03-02',
  createdAt: '2026-03-02T14:30:45.000Z',
  updatedAt: '2026-03-02T14:31:00.000Z',
  moods: ['calm'],
  themes: ['work'],
  keyTakeaways: ['insight'],
  places: [],
  characters: [],
  linkedEntryIds: [],
  conversationHistory: [],
};

describe('useExport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useFirestore).mockReturnValue(mockFirestore);
    vi.mocked(useUser).mockReturnValue({ user: mockUser, isLoading: false, error: null });
    vi.mocked(collection).mockReturnValue({ id: 'mock-col' } as any);
    vi.mocked(getDocs).mockResolvedValue({
      docs: [{ id: mockEntry.id, data: () => mockEntry }],
    } as any);
  });

  it('exports isExporting as false initially', () => {
    const { result } = renderHook(() => useExport());
    expect(result.current.isExporting).toBe(false);
  });

  it('calls getDocs with the correct collection path', async () => {
    const { result } = renderHook(() => useExport());
    await act(async () => {
      await result.current.exportJSON();
    });
    expect(collection).toHaveBeenCalledWith(mockFirestore, 'users/test-uid/entries');
    expect(getDocs).toHaveBeenCalled();
  });

  it('does nothing when firestore is null', async () => {
    vi.mocked(useFirestore).mockReturnValue(null as any);
    const { result } = renderHook(() => useExport());
    await act(async () => {
      await result.current.exportJSON();
    });
    expect(getDocs).not.toHaveBeenCalled();
  });

  it('does nothing when user is null', async () => {
    vi.mocked(useUser).mockReturnValue({ user: null, isLoading: false, error: null });
    const { result } = renderHook(() => useExport());
    await act(async () => {
      await result.current.exportJSON();
    });
    expect(getDocs).not.toHaveBeenCalled();
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
npm run test:run -- src/hooks/__tests__/use-export.test.ts
```

Expected: FAIL with "Cannot find module '../use-export'"

**Step 3: Implement `src/hooks/use-export.ts`**

```typescript
import { collection, getDocs, Timestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useUser } from '@/firebase/auth/use-user';
import { useCallback, useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { JournalEntryData } from './use-journal-entries';

function timestampToISO(value: string | Timestamp | unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === 'string') return value;
  return new Date().toISOString();
}

function serializeEntry(entry: JournalEntryData & { id: string }): Record<string, unknown> {
  return {
    id: entry.id,
    content: entry.content,
    title: entry.title,
    date: entry.date,
    createdAt: timestampToISO(entry.createdAt),
    updatedAt: timestampToISO(entry.updatedAt),
    moods: entry.moods ?? [],
    moodEmojis: entry.moodEmojis ?? {},
    subjectEmoji: entry.subjectEmoji,
    themes: entry.themes ?? [],
    themeEmojis: entry.themeEmojis ?? {},
    keyTakeaways: entry.keyTakeaways ?? [],
    places: entry.places ?? [],
    characters: entry.characters ?? [],
    linkedEntryIds: entry.linkedEntryIds ?? [],
    conversationHistory: (entry.conversationHistory ?? []).map((msg) => ({
      role: msg.role,
      content: msg.content,
      timestamp: timestampToISO(msg.timestamp),
    })),
  };
}

function entryToMarkdown(entry: JournalEntryData & { id: string }): string {
  const lines: string[] = ['---'];
  if (entry.title) lines.push(`title: ${entry.title}`);
  lines.push(`date: ${entry.date}`);
  if (entry.moods?.length) lines.push(`moods: ${entry.moods.join(', ')}`);
  if (entry.themes?.length) lines.push(`themes: ${entry.themes.join(', ')}`);
  if (entry.places?.length) lines.push(`places: ${entry.places.join(', ')}`);
  if (entry.characters?.length) lines.push(`characters: ${entry.characters.join(', ')}`);
  if (entry.keyTakeaways?.length) {
    lines.push('keyTakeaways:');
    entry.keyTakeaways.forEach((k) => lines.push(`  - ${k}`));
  }
  lines.push('---', '', entry.content);
  return lines.join('\n');
}

export function useExport() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [isExporting, setIsExporting] = useState(false);

  const fetchAllEntries = useCallback(async (): Promise<(JournalEntryData & { id: string })[]> => {
    if (!firestore || !user) return [];
    const col = collection(firestore, `users/${user.uid}/entries`);
    const snapshot = await getDocs(col);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as JournalEntryData & { id: string }));
  }, [firestore, user]);

  const exportJSON = useCallback(async (): Promise<void> => {
    if (!firestore || !user) return;
    setIsExporting(true);
    try {
      const entries = await fetchAllEntries();
      const dateStr = new Date().toISOString().slice(0, 10);
      const payload = {
        version: 1,
        exportedAt: new Date().toISOString(),
        userId: user.uid,
        entries: entries.map(serializeEntry),
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      saveAs(blob, `mivoa-export-${dateStr}.json`);
    } finally {
      setIsExporting(false);
    }
  }, [fetchAllEntries, firestore, user]);

  const exportMarkdown = useCallback(async (): Promise<void> => {
    if (!firestore || !user) return;
    setIsExporting(true);
    try {
      const entries = await fetchAllEntries();
      const zip = new JSZip();
      entries.forEach((entry) => {
        zip.file(`${entry.id}.md`, entryToMarkdown(entry));
      });
      const dateStr = new Date().toISOString().slice(0, 10);
      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, `mivoa-export-${dateStr}.zip`);
    } finally {
      setIsExporting(false);
    }
  }, [fetchAllEntries, firestore, user]);

  return { exportJSON, exportMarkdown, isExporting };
}
```

**Step 4: Run tests to verify they pass**

```bash
npm run test:run -- src/hooks/__tests__/use-export.test.ts
```

Expected: all 4 tests PASS

**Step 5: Commit**

```bash
git add src/hooks/use-export.ts src/hooks/__tests__/use-export.test.ts
git commit -m "✨ feat(export): add useExport hook with JSON and Markdown export"
```

---

### Task 4: Create `use-import` hook with tests

**Files:**
- Create: `src/hooks/use-import.ts`
- Create: `src/hooks/__tests__/use-import.test.ts`

**Step 1: Write the failing tests**

Create `src/hooks/__tests__/use-import.test.ts`:

```typescript
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
```

**Step 2: Run tests to verify they fail**

```bash
npm run test:run -- src/hooks/__tests__/use-import.test.ts
```

Expected: FAIL with "Cannot find module '../use-import'"

**Step 3: Implement `src/hooks/use-import.ts`**

```typescript
import { collection, getDocs, setDoc, doc, Timestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useUser } from '@/firebase/auth/use-user';
import { useCallback, useState } from 'react';
import type { JournalEntryData } from './use-journal-entries';

export interface ImportPreview {
  total: number;
  newCount: number;
  skippedCount: number;
  entries: (JournalEntryData & { id: string })[];
}

function isoToTimestamp(value: unknown): Timestamp {
  if (typeof value === 'string') return Timestamp.fromDate(new Date(value));
  return Timestamp.now();
}

function deserializeEntry(raw: Record<string, unknown>): JournalEntryData & { id: string } {
  const history = raw.conversationHistory as Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }> | undefined;

  return {
    id: raw.id as string,
    content: (raw.content as string) ?? '',
    title: raw.title as string | undefined,
    date: raw.date as string,
    createdAt: isoToTimestamp(raw.createdAt),
    updatedAt: isoToTimestamp(raw.updatedAt),
    moods: raw.moods as string[] | undefined,
    moodEmojis: raw.moodEmojis as Record<string, string> | undefined,
    subjectEmoji: raw.subjectEmoji as string | undefined,
    themes: raw.themes as string[] | undefined,
    themeEmojis: raw.themeEmojis as Record<string, string> | undefined,
    keyTakeaways: raw.keyTakeaways as string[] | undefined,
    places: raw.places as string[] | undefined,
    characters: raw.characters as string[] | undefined,
    linkedEntryIds: raw.linkedEntryIds as string[] | undefined,
    conversationHistory: history?.map((msg) => ({
      role: msg.role,
      content: msg.content,
      timestamp: isoToTimestamp(msg.timestamp),
    })),
  };
}

export function useImport() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [isImporting, setIsImporting] = useState(false);

  const parseFile = useCallback(async (file: File): Promise<ImportPreview | null> => {
    if (!firestore || !user) return null;

    const text = await file.text();
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(text) as Record<string, unknown>;
    } catch {
      throw new Error('invalid_json');
    }

    if (parsed.version !== 1) throw new Error('unsupported_version');

    const rawEntries = parsed.entries as Array<Record<string, unknown>>;
    const col = collection(firestore, `users/${user.uid}/entries`);
    const snapshot = await getDocs(col);
    const existingIds = new Set(snapshot.docs.map((d) => d.id));

    const entries = rawEntries.map(deserializeEntry);
    const newEntries = entries.filter((e) => !existingIds.has(e.id));

    return {
      total: entries.length,
      newCount: newEntries.length,
      skippedCount: entries.length - newEntries.length,
      entries: newEntries,
    };
  }, [firestore, user]);

  const importEntries = useCallback(async (preview: ImportPreview): Promise<number> => {
    if (!firestore || !user) return 0;
    setIsImporting(true);
    try {
      await Promise.all(
        preview.entries.map((entry) => {
          const { id, ...data } = entry;
          const ref = doc(firestore, `users/${user.uid}/entries/${id}`);
          return setDoc(ref, data);
        })
      );
      return preview.newCount;
    } finally {
      setIsImporting(false);
    }
  }, [firestore, user]);

  return { parseFile, importEntries, isImporting };
}
```

**Step 4: Run tests to verify they pass**

```bash
npm run test:run -- src/hooks/__tests__/use-import.test.ts
```

Expected: all 6 tests PASS

**Step 5: Commit**

```bash
git add src/hooks/use-import.ts src/hooks/__tests__/use-import.test.ts
git commit -m "✨ feat(import): add useImport hook with merge strategy"
```

---

### Task 5: Create `ExportImportMenu` component

**Files:**
- Create: `src/components/export-import-menu.tsx`

No unit tests needed for this component — it wires together hooks already tested and Shadcn UI components. Manual testing is sufficient (see Task 6).

**Step 1: Create `src/components/export-import-menu.tsx`**

```typescript
'use client';

import { useRef, useState } from 'react';
import { MoreHorizontal, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/use-translation';
import { useExport } from '@/hooks/use-export';
import { useImport, type ImportPreview } from '@/hooks/use-import';

export function ExportImportMenu(): React.JSX.Element {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { exportJSON, exportMarkdown, isExporting } = useExport();
  const { parseFile, importEntries, isImporting } = useImport();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleExportJSON = async () => {
    try {
      await exportJSON();
      toast({ title: t('exportSuccess') });
    } catch {
      toast({ title: t('importError'), variant: 'destructive' });
    }
  };

  const handleExportMarkdown = async () => {
    try {
      await exportMarkdown();
      toast({ title: t('exportSuccess') });
    } catch {
      toast({ title: t('importError'), variant: 'destructive' });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    try {
      const result = await parseFile(file);
      if (!result) return;
      setPreview(result);
      setIsDialogOpen(true);
    } catch (err) {
      const message = err instanceof Error && err.message === 'unsupported_version'
        ? t('importUnsupportedVersion')
        : t('importInvalidFile');
      toast({ title: message, variant: 'destructive' });
    }
  };

  const handleConfirmImport = async () => {
    if (!preview) return;
    try {
      const count = await importEntries(preview);
      setIsDialogOpen(false);
      setPreview(null);
      toast({
        title: t('importSuccess').replace('{{count}}', String(count)),
      });
    } catch {
      toast({ title: t('importError'), variant: 'destructive' });
    }
  };

  const confirmDescription = preview
    ? t('importConfirmDescription')
        .replace('{{total}}', String(preview.total))
        .replace('{{new}}', String(preview.newCount))
        .replace('{{skipped}}', String(preview.skippedCount))
    : '';

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={t('dataManagement')}>
            <MoreHorizontal className="h-[1.2rem] w-[1.2rem]" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onClick={handleExportJSON}
            disabled={isExporting}
          >
            <Download className="mr-2 h-4 w-4" />
            {t('exportJSON')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleExportMarkdown}
            disabled={isExporting}
          >
            <Download className="mr-2 h-4 w-4" />
            {t('exportMarkdown')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
          >
            <Upload className="mr-2 h-4 w-4" />
            {t('importJSON')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('importConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isImporting}>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmImport} disabled={isImporting}>
              {t('importJSON')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/export-import-menu.tsx
git commit -m "✨ feat(ui): add ExportImportMenu component"
```

---

### Task 6: Integrate menu into sidebar header

**Files:**
- Modify: `src/components/journal-sidebar/sidebar-header.tsx`

**Step 1: Add `ExportImportMenu` to the header**

In `sidebar-header.tsx`, add the import at the top:

```typescript
import { ExportImportMenu } from '@/components/export-import-menu';
```

Then in the JSX, add `<ExportImportMenu />` next to `<SettingsMenu />` in the flex row at line 38:

```tsx
<div className="flex items-center gap-2 flex-shrink-0">
  <UserMenu />
  <SettingsMenu />
  <ExportImportMenu />
</div>
```

**Step 2: Run the full test suite**

```bash
npm run test:run
```

Expected: all tests pass (no regressions).

**Step 3: Manual smoke test**

1. `npm run dev`
2. Open http://localhost:3000, sign in
3. Click the "..." button in the sidebar header — dropdown should appear with 3 items
4. Click "Export JSON" — file `mivoa-export-YYYY-MM-DD.json` should download
5. Open the file, verify structure: `{ version: 1, exportedAt, userId, entries: [...] }`
6. Click "Export Markdown" — ZIP should download; open it and verify `.md` files with YAML frontmatter
7. Click "Import JSON", select the exported file — dialog shows counts, click confirm — toast "X entries imported"
8. Import the same file again — dialog shows 0 new / X skipped

**Step 4: Commit**

```bash
git add src/components/journal-sidebar/sidebar-header.tsx
git commit -m "✨ feat(sidebar): integrate ExportImportMenu into sidebar header"
```

---

### Task 7: Typecheck and lint

**Step 1: Run typecheck**

```bash
npm run typecheck
```

Expected: no errors.

**Step 2: Run lint**

```bash
npm run lint
```

Expected: no errors.

**Step 3: Fix any issues found, then commit if needed**

```bash
git add -A
git commit -m "🔧 fix(types): resolve typecheck/lint issues in import-export"
```

---

## Summary of files

| Action | File |
|---|---|
| Create | `src/hooks/use-export.ts` |
| Create | `src/hooks/__tests__/use-export.test.ts` |
| Create | `src/hooks/use-import.ts` |
| Create | `src/hooks/__tests__/use-import.test.ts` |
| Create | `src/components/export-import-menu.tsx` |
| Modify | `src/components/journal-sidebar/sidebar-header.tsx` |
| Modify | `src/locales/en.json` |
| Modify | `src/locales/fr.json` |
