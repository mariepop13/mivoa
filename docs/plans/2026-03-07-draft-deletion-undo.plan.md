---
name: bugfix/draft-deletion-undo
overview: >
  Fix two bugs: (1) undo draft deletion restores the oldest deleted draft instead of the most recent,
  (2) Timestamp imported from firebase/firestore in storage-agnostic UI components, breaking the
  StorageBackend abstraction.
todos:
  - id: 1
    content: "Fix getUndoableDraft to return the most recently deleted draft, not the oldest"
    status: pending
    dependencies: []
  - id: 2
    content: "Fix bulk deletion undo: only first draft can be undone — make it restore the most recent batch"
    status: pending
    dependencies: [1]
  - id: 3
    content: "Remove Timestamp import from journal-main-content.tsx — replace with convertTimestampToDate util"
    status: pending
    dependencies: []
  - id: 4
    content: "Audit all components for direct firebase/firestore imports — fix any found in UI layer"
    status: pending
    dependencies: [3]
  - id: 5
    content: "Update tests for use-draft-deletion to cover undo ordering"
    status: pending
    dependencies: [1, 2]
  - id: 6
    content: "Run npm run test:ci"
    status: pending
    dependencies: [5]
---

## Overview

### Bug 1 — Undo restores the wrong draft

`getUndoableDraft()` uses `.find()` which returns the **first** element in the stored array
(the oldest deleted draft). When you delete draft A then draft B within 30 seconds, undo
restores A instead of B.

```ts
// Current (broken)
function getUndoableDraft(): DeletedDraftData | null {
  const drafts = getDeletedDrafts();
  const now = Date.now();
  const validDraft = drafts.find(d => now - d.timestamp < UNDO_TIMEOUT); // ← returns OLDEST
  return validDraft || null;
}
```

Fix: use `.findLast()` or reverse before `.find()` to get the most recently deleted.

### Bug 2 — Firebase import in storage-agnostic component

`journal-main-content.tsx` imports `Timestamp` from `firebase/firestore`:

```ts
import { Timestamp } from 'firebase/firestore'; // ← breaks abstraction
```

This creates a hard Firebase dependency in a component that should work with any StorageBackend.
The `convertTimestampToDate` utility already handles this conversion — it should be used instead.

## Architecture / Data Model

### Undo Stack Behavior (fixed)

The correct UX for undo: the most recently deleted item can always be undone.
Multiple deletions within the window should each be individually undoable in reverse order
(LIFO — last in, first out).

Simplest fix: sort by timestamp descending before searching.

### Firebase Abstraction Rule

The rule: **nothing in `src/components/` or `src/hooks/` should import from `firebase/*`**.
Firebase types and instances belong only in:
- `src/firebase/` — Firebase setup and auth
- `src/repositories/firebase-storage-backend.ts` — Firebase data access

Any timestamp handling in components should use `convertTimestampToDate` from `src/utils/journal-utils.ts`.

## Implementation Steps

### Fix 1 — `getUndoableDraft` ordering

In `src/hooks/use-draft-deletion.tsx`:

```ts
function getUndoableDraft(): DeletedDraftData | null {
  const drafts = getDeletedDrafts();
  const now = Date.now();
  // Sort by timestamp descending to get most recently deleted first
  const sorted = [...drafts].sort((a, b) => b.timestamp - a.timestamp);
  return sorted.find(d => now - d.timestamp < UNDO_TIMEOUT) ?? null;
}
```

### Fix 2 — Remove Firebase import from `journal-main-content.tsx`

The `Timestamp` type is only used in the `mapConversationHistory` function signature.
The actual conversion is handled by `convertTimestampToDate`. Remove the import and
update the type annotation to use a union type without Firebase dependency:

```ts
// Before
import { Timestamp } from 'firebase/firestore';
timestamp: Timestamp | Date | string;

// After — no firebase import needed
timestamp: { toDate(): Date } | Date | string;
```

The `convertTimestampToDate` util already handles this duck-typed approach.

### Fix 3 — Audit and clean Firebase imports in UI layer

Search for `from 'firebase/` in `src/components/` and `src/hooks/`. Fix any found violations
by using the StorageBackend abstraction or utils instead.

## Files to Modify

- `src/hooks/use-draft-deletion.tsx` — fix `getUndoableDraft` ordering
- `src/components/journal-main-content.tsx` — remove `Timestamp` import from firebase/firestore
- Any other component/hook found importing from `firebase/*` directly

## Testing

### Unit Tests

Update `src/hooks/__tests__/use-draft-deletion.test.tsx` (or create if missing):
- Delete A then B → undo should restore B, not A
- Delete A, wait > 30s, delete B → undo should restore B (A expired)
- Bulk delete [A, B, C] → undo should offer to restore all 3

### Type Check

```bash
npm run typecheck
```

Verify no TypeScript errors after removing the Timestamp import.

## Security

No security impact. Undo data is stored in sessionStorage (client-side, session-scoped).
The Firebase abstraction fix is architectural, not security-related.

## Next Steps

After this fix:
- The StorageBackend abstraction is cleaner — new storage backends won't need to implement Firebase types
- Draft management is more reliable — users won't lose work due to undo confusion
