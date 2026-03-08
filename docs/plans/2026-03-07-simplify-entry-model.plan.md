---
name: bugfix/simplify-entry-model
overview: >
  Simplify the confusing draft/entry/conversation-entry model. Three interrelated problems:
  (1) The isDraft + conversationMode flags create complex conditional logic spread across many files,
  (2) JournalMainContent has 20+ props and uses render-functions-as-components,
  (3) page.tsx uses a setTimeout(0) hack to refresh entry links.
todos:
  - id: 1
    content: "Map all isDraft / conversationMode usage across the codebase to understand the full scope"
    status: pending
    dependencies: []
  - id: 2
    content: "Introduce an EntryKind discriminated union type: 'text' | 'draft' | 'conversation'"
    status: pending
    dependencies: [1]
  - id: 3
    content: "Replace isDraft/conversationMode flag checks with EntryKind type guards"
    status: pending
    dependencies: [2]
  - id: 4
    content: "Convert renderChatContent / renderEntryContent helper functions into proper React components"
    status: pending
    dependencies: []
  - id: 5
    content: "Reduce JournalMainContent props by grouping related props into sub-objects"
    status: pending
    dependencies: [4]
  - id: 6
    content: "Fix the setTimeout(0) hack in page.tsx handleLinksUpdated with a proper state invalidation"
    status: pending
    dependencies: []
  - id: 7
    content: "Update use-view-mode to use EntryKind instead of boolean flags"
    status: pending
    dependencies: [2, 3]
  - id: 8
    content: "Run full test suite and fix any broken tests"
    status: pending
    dependencies: [3, 4, 5, 6, 7]
  - id: 9
    content: "Run npm run test:ci"
    status: pending
    dependencies: [8]
---

## Overview

### Problem 1 — isDraft + conversationMode flags

Three "types" of entries exist but are distinguished by combinations of boolean flags:

| Type | isDraft | conversationMode |
|------|---------|-----------------|
| Text entry | false/undefined | false/undefined |
| Conversation draft | true | true |
| Saved conversation | false | true |

This pattern forces `isDraft !== true` checks, `isDraft === true && conversationMode === true`
combinations, and conditions like `isConversationEntrySelected && !isDraftSelected` to spread
across `use-view-mode`, `journal-main-content`, `use-journal-entries`, and `page.tsx`.

### Problem 2 — JournalMainContent prop drilling

`JournalMainContent` accepts 20+ props and delegates to `renderChatContent` and `renderEntryContent`
helper functions — these are React components in disguise (they return JSX but aren't components).
This prevents React from optimizing renders and makes the code harder to follow.

### Problem 3 — setTimeout(0) hack

```ts
// page.tsx:192 — refreshes entry after link update
journalEntries.setSelectedEntryId(null);
setTimeout(() => {
  journalEntries.setSelectedEntryId(currentEntryId);
}, 0);
```

This forces a re-render by toggling state. It works but is fragile: it creates a flash of
null state, could race with other state updates, and communicates nothing about intent.

## Architecture / Data Model

### EntryKind Discriminated Union

```ts
// src/repositories/types.ts (or a new src/utils/entry-kind.ts)
export type EntryKind = 'text' | 'draft' | 'conversation';

export function getEntryKind(entry: { isDraft?: boolean; conversationMode?: boolean }): EntryKind {
  if (entry.isDraft) return 'draft';
  if (entry.conversationMode) return 'conversation';
  return 'text';
}

export function isDraftEntry(entry: { isDraft?: boolean }): boolean {
  return entry.isDraft === true;
}

export function isConversationEntry(entry: { conversationMode?: boolean; isDraft?: boolean }): boolean {
  return entry.conversationMode === true && entry.isDraft !== true;
}
```

### Refactored JournalMainContent Props

Group props into semantically meaningful objects:

```ts
interface EntryState {
  selectedDate: Date;
  selectedEntryId: string | null;
  selectedEntry: (JournalEntryData & { id: string }) | undefined;
  selectedEntryData: JournalEntryData | null;
  entries: (JournalEntryData & { id: string })[] | null;
  content: string;
  title: string;
  recentEntries: RecentEntryContext[];
}

interface EntryActions {
  onContentChange: (content: string) => void;
  onSave: () => void;
  onDelete: () => Promise<void>;
  onChangeDate?: (date: Date) => Promise<void>;
  onNavigateToEntry?: (entry: JournalEntryData & { id: string }) => void;
  onLinksUpdated?: () => void;
}

interface SaveState {
  isSaving: boolean;
  lastSavedAt: Date | null;
  saveError: string | null;
}

interface ConversationState {
  isGeneratingSummary: boolean;
  onSummarize: (...) => Promise<void>;
  handleSaveDraft: (...) => Promise<string | null>;
  handleDeleteDraft: (draftId: string) => Promise<void>;
  conversationEntryForDate: (JournalEntryData & { id: string }) | null;
}
```

### Fix for setTimeout(0) hack

Instead of null → setTimeout → restore, use a `linksVersion` counter that triggers
re-fetching when incremented:

```ts
// page.tsx
const [linksVersion, setLinksVersion] = useState(0);

const handleLinksUpdated = useCallback(() => {
  setLinksVersion(v => v + 1);
}, []);
```

Pass `linksVersion` to the component/hook that needs to re-fetch linked entry data.
Alternatively, trigger a refetch directly through the StorageBackend subscription
(which already re-emits on data change).

## Implementation Steps

### Step 1 — Create `src/utils/entry-kind.ts`

```ts
export type EntryKind = 'text' | 'draft' | 'conversation';

export function getEntryKind(entry: {
  isDraft?: boolean;
  conversationMode?: boolean;
}): EntryKind {
  if (entry.isDraft) return 'draft';
  if (entry.conversationMode) return 'conversation';
  return 'text';
}
```

### Step 2 — Update `use-view-mode.tsx`

Replace boolean flag destructuring with `getEntryKind`:

```ts
import { getEntryKind } from '@/utils/entry-kind';

const entryKind = selectedEntry ? getEntryKind(selectedEntry) : null;
const isDraftSelected = entryKind === 'draft';
const isConversationEntrySelected = entryKind === 'conversation';
const shouldShowTabs = entryKind === 'conversation';
```

### Step 3 — Convert render helpers to components in `journal-main-content.tsx`

```tsx
// Before (function returning JSX)
function renderChatContent({ ... }): React.JSX.Element { ... }

// After (proper component)
function ChatContent({ ... }: ChatContentProps): React.JSX.Element { ... }
function EntryContent({ ... }: EntryContentProps): React.JSX.Element { ... }
```

### Step 4 — Group JournalMainContent props

Restructure the interface into grouped sub-objects and update the call site in `page.tsx`.

### Step 5 — Fix `handleLinksUpdated` in `page.tsx`

Replace the setTimeout hack with a version counter or direct subscription trigger.

## Files to Modify

- `src/hooks/use-view-mode.tsx` — use EntryKind
- `src/hooks/use-journal-entries.tsx` — use EntryKind where applicable
- `src/components/journal-main-content.tsx` — convert helpers to components, group props
- `src/app/(journal)/page.tsx` — fix setTimeout hack, update props structure
- `src/components/journal-sidebar/entry-list-item.tsx` — use EntryKind if it checks isDraft

## Files to Create

- `src/utils/entry-kind.ts` — EntryKind type + helper functions
- `src/utils/__tests__/entry-kind.test.ts` — unit tests for helpers

## Testing

### Unit Tests

- `entry-kind.test.ts`: getEntryKind returns correct kind for all flag combinations
- Update `use-view-mode` tests to use EntryKind expectations
- Verify `journal-main-content` still renders correctly after prop grouping

### Manual Testing

- Create a text entry → verify entry form shows, no chat tabs
- Start a chat (draft) → verify only chat shows, no summary tab
- Complete a chat → verify both Chat and Summary tabs appear
- Update links → verify the view updates without flicker

## Integration Points

This fix is the most invasive of the three. It touches the core component tree.
Recommend merging fixes #1 and #3 first, then this one last to minimize conflicts.

## Next Steps

With the entry model simplified:
- Adding new entry types (e.g., "guided check-in") becomes a new EntryKind value
- The tab system can be extended cleanly for future view modes
- Prop drilling reduction makes the component tree easier to extend
