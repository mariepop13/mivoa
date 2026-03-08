---
name: bugfix/recent-entries-context
overview: >
  Fix the recentEntries bug where AI context only receives entries from the currently selected date
  instead of the last 7 days. Also enrich AI context to include conversation summaries from past entries.
todos:
  - id: 1
    content: "Understand current recentEntries data flow: useEntriesByDate → useJournalEntries → recentEntries"
    status: pending
    dependencies: []
  - id: 2
    content: "Add useAllEntries hook call in useJournalEntries to access cross-date entry data"
    status: pending
    dependencies: [1]
  - id: 3
    content: "Fix recentEntries computation to filter from all entries across last 7 days"
    status: pending
    dependencies: [2]
  - id: 4
    content: "Include conversation summaries (conversationSummary.title + keyTakeaways) in recentEntries context"
    status: pending
    dependencies: [3]
  - id: 5
    content: "Update recentEntries type to include summary field"
    status: pending
    dependencies: [4]
  - id: 6
    content: "Update AI prompt builders to use the enriched context"
    status: pending
    dependencies: [5]
  - id: 7
    content: "Write/update tests for useJournalEntries recentEntries logic"
    status: pending
    dependencies: [3]
  - id: 8
    content: "Run npm run test:ci to verify no regressions"
    status: pending
    dependencies: [7]
---

## Overview

### Bug Description

`recentEntries` in `use-journal-entries.tsx` is computed from `entries`, which comes from
`useEntriesByDate(dateKey)` — a hook that only fetches entries for the **currently selected date**.

The filter `entry.date >= sevenDaysAgoKey` always passes because every entry in the collection has
`date === dateKey`. Result: the AI receives entries from today only as "recent context", never from
the past week.

### Impact

Every AI feature that uses `recentEntries` as context is affected:
- `chat-service.ts` uses it for conversation context
- `entry-analysis-service.ts` uses it for analysis
- `journal-prompt-service.ts` uses it for prompt generation

### Root Cause

```ts
// use-journal-entries.tsx
const { data: entriesRaw } = useEntriesByDate(dateKey); // ← only today's entries

const recentEntries = useMemo(() => {
  return entries
    .filter((entry) => entry.date >= sevenDaysAgoKey) // always true: date === dateKey
    ...
}, [entries, selectedEntryId, selectedDate]);
```

## Architecture / Data Model

### Fix Strategy

Replace the source of `recentEntries` with `useAllEntries()` from `storage-provider.tsx`,
which subscribes to ALL user entries across all dates. Filter client-side to the last 7 days.

### Performance

`useAllEntries()` is already used in other parts of the app (entry linking, export).
The subscription is already open in many scenarios — no significant new cost.

Limit to `MAX_RECENT_ENTRIES = 7` entries (already exists) to keep prompt size controlled.

### Enriched Context Type

```ts
// Extended type for AI context
type RecentEntryContext = {
  content: string;
  title?: string;
  date: string;
  summary?: string;        // conversationSummary?.shortSummary or keyTakeaways[0]
  moods?: string[];
  themes?: string[];
}
```

## Implementation Steps

### Step 1 — Add `useAllEntries` to `useJournalEntries`

In `src/hooks/use-journal-entries.tsx`:

```ts
import { useStorage, useEntriesByDate, useEntry, useAllEntries } from '@/repositories/storage-provider';

// Inside useJournalEntries:
const { data: allEntriesRaw } = useAllEntries();
```

### Step 2 — Fix `recentEntries` computation

```ts
const recentEntries = useMemo(() => {
  if (!allEntriesRaw) return [];

  const sevenDaysAgo = new Date(selectedDate);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - DAYS_TO_LOOK_BACK);
  const sevenDaysAgoKey = format(sevenDaysAgo, 'yyyy-MM-dd');

  return (allEntriesRaw as unknown as (JournalEntryData & { id: string })[])
    .filter((entry) => entry.date >= sevenDaysAgoKey && entry.date <= dateKey && entry.id !== selectedEntryId && !entry.isDraft)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, MAX_RECENT_ENTRIES)
    .map((entry) => ({
      content: entry.content,
      title: entry.title,
      date: entry.date,
      moods: entry.moods,
      themes: entry.themes,
    }));
}, [allEntriesRaw, selectedEntryId, selectedDate, dateKey]);
```

### Step 3 — Update the `recentEntries` type in `UseJournalEntriesResult`

```ts
recentEntries: Array<{
  content: string;
  title?: string;
  date: string;
  moods?: string[];
  themes?: string[];
}>;
```

### Step 4 — Propagate the type change

Update `JournalMainContentProps` and any component/service that accepts `recentEntries`.
Check `src/ai/utils/prompt-builders.ts` to use the new fields.

## Files to Modify

- `src/hooks/use-journal-entries.tsx` — core fix
- `src/repositories/storage-provider.tsx` — verify `useAllEntries` export (likely already present)
- `src/ai/utils/prompt-builders.ts` — use moods/themes in context if available
- `src/components/journal-main-content.tsx` — update prop type if needed

## Files to Create

- None

## Testing

### Unit Tests

Update `src/hooks/__tests__/use-journal-entries.test.tsx`:
- Test that `recentEntries` returns entries from different dates within the 7-day window
- Test that entries older than 7 days are excluded
- Test that drafts (`isDraft: true`) are excluded from context
- Test that the currently selected entry is excluded

### Integration

- Manually test with multiple entries on different days
- Verify AI chat uses entries from past dates in its responses

## Security

No security impact. This fix only changes what data is included in AI context.
Data is already accessible to the authenticated user.

## Next Steps

After this fix is merged, the foundation is ready for:
- Feature: AI Memory (cross-session context)
- Feature: Weekly AI Review (has accurate data to summarize)
- Feature: Daily guided check-in (can reference past patterns)
