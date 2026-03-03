# Design: Import / Export Journal Entries

**Date:** 2026-03-02
**Branch:** feature/import-export
**Status:** Approved

## Context

- Journal entries are stored in Firestore under `users/{userId}/entries/{entryId}`
- Each entry has: content, title, date, createdAt, updatedAt, moods, moodEmojis, subjectEmoji, themes, themeEmojis, keyTakeaways, places, characters, linkedEntryIds, conversationHistory, aiProcessedAt, summaryGeneratedAt, conversationMode, isDraft
- Stack: Next.js 15, TypeScript, Firebase, Tailwind + Shadcn UI
- Inspiration: Rosebud.app (data portability via JSON + Markdown)

## Decisions

| Question | Decision |
|---|---|
| Export formats | JSON (full backup) + Markdown ZIP (human-readable) |
| Import format | JSON only |
| Export scope | All entries at once |
| Import behavior | Merge — skip duplicates (same entry ID) |
| Conversation history | Included in JSON, excluded from Markdown |
| UI placement | "..." menu (MoreHorizontal icon) in sidebar header |

## Architecture

**Approach:** Client-side only (no API routes). Reads from Firestore directly, generates files in the browser using `jszip` + `file-saver`.

### New files

```
src/
  hooks/
    use-export.ts          ← export logic (JSON + Markdown ZIP)
    use-import.ts          ← import logic (JSON, merge with skip)
  components/
    export-import-menu.tsx ← "..." button + dropdown + import confirmation dialog
```

### Modified files

```
src/components/journal-sidebar/sidebar-header.tsx  ← add "..." menu button
```

### New dependencies

- `jszip` — generate ZIP for Markdown export
- `file-saver` — trigger browser download

## Data Formats

### JSON export (`mivoa-export-2026-03-02.json`)

```json
{
  "version": 1,
  "exportedAt": "2026-03-02T14:30:00Z",
  "userId": "abc123",
  "entries": [
    {
      "id": "2026-03-02-143045123",
      "content": "...",
      "title": "...",
      "date": "2026-03-02",
      "createdAt": "2026-03-02T14:30:45.123Z",
      "updatedAt": "2026-03-02T14:31:00.000Z",
      "moods": ["calm"],
      "moodEmojis": { "calm": "😌" },
      "subjectEmoji": "💼",
      "themes": ["work"],
      "themeEmojis": { "work": "💼" },
      "keyTakeaways": ["..."],
      "places": [],
      "characters": [],
      "linkedEntryIds": [],
      "conversationHistory": [
        { "role": "user", "content": "...", "timestamp": "2026-03-02T14:30:50Z" }
      ]
    }
  ]
}
```

Firestore `Timestamp` values are serialized as ISO 8601 strings.

### Markdown export — one file per entry (`2026-03-02-143045123.md`)

```markdown
---
title: My title
date: 2026-03-02
moods: calm, happy
themes: work, creativity
places: Paris
characters: Marie
keyTakeaways:
  - First insight
---

Entry content here...
```

YAML frontmatter for metadata, body for content. Compatible with Obsidian.
All files bundled in a ZIP: `mivoa-export-2026-03-02.zip`.

## UI

### Sidebar header menu

```
┌─────────────────────┐
│  📓 Mivoa      [···]│
└─────────────────────┘
                 ↓ click
         ┌───────────────────┐
         │ ↑ Export JSON     │
         │ ↑ Export Markdown │
         │ ↓ Import JSON     │
         └───────────────────┘
```

- Uses Shadcn `DropdownMenu` + lucide `MoreHorizontal` icon
- Export items show a spinner + disabled state during generation
- Import triggers a hidden `<input type="file" accept=".json">`

### Import confirmation dialog

Before writing to Firestore, show:
> "23 entries found in file. 18 new entries will be imported (5 already present will be skipped). Continue?"

## Error Handling

| Scenario | Response |
|---|---|
| Invalid JSON on import | Toast: "Invalid file" |
| Unknown format version | Toast: "Unsupported format" |
| Firestore write error | Toast: "Import failed" |
| Export success | Toast: "Export downloaded" |
| Import success | Toast: "X entries imported" |

## Export Flow

1. User clicks "Export JSON" → fetch all entries from Firestore → serialize Timestamps to ISO strings → `saveAs(blob, 'mivoa-export-2026-03-02.json')`
2. User clicks "Export Markdown" → same fetch → generate one `.md` per entry with YAML frontmatter → bundle into ZIP → `saveAs(blob, 'mivoa-export-2026-03-02.zip')`

## Import Flow

1. User clicks "Import JSON" → `<input type="file">` opens
2. `FileReader` reads the file → JSON parse → validate version field
3. Compare entry IDs against existing Firestore entries
4. Show confirmation dialog with counts (total / new / skipped)
5. On confirm → batch `setDoc` for each new entry (skip existing IDs)
6. Toast success or error
