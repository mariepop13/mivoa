# Design: Visual Redesign "Carnet vivant" + UX Improvements

**Date**: 2026-03-08
**Status**: Approved
**Approach**: A — Full redesign with organic palette and UX restructuring

## Context

The current Mivoa design uses Shadcn defaults (purple accent, white background) which is clean but generic. As a personal journaling app inspired by Rosebud.app, the aesthetic should feel intimate and invite introspection — not look like a generic SaaS product.

## Goals

1. **New visual identity** — warm, organic palette replacing the purple/white defaults
2. **Mobile navigation** — replace current header/sidebar approach with a bottom bar
3. **Editor ↔ Chat transition** — clear visual tabs with entry status indicator
4. **Readability** — better typographic hierarchy, less visual noise from AI badges

## Color Palette

All changes go in `src/app/globals.css` as CSS variable overrides.

### Light Mode
| Token | Value | Role |
|---|---|---|
| `--background` | `#FAF7F2` | Warm cream — replaces white |
| `--foreground` | `#3D2B1F` | Warm brown — replaces dark gray |
| `--primary` | `#C4714A` | Terracotta — replaces purple |
| `--primary-foreground` | `#FFFFFF` | White on terracotta |
| `--secondary` | `#7C9E8A` | Sage green |
| `--secondary-foreground` | `#FFFFFF` | White on sage |
| `--muted` | `#EDE8E0` | Warm off-white |
| `--muted-foreground` | `#7A6A5E` | Warm medium gray |
| `--border` | `#D8D0C4` | Warm light border |
| `--card` | `#FFFFFF` | Pure white for cards |
| `--card-foreground` | `#3D2B1F` | Warm brown |

### Dark Mode
| Token | Value | Role |
|---|---|---|
| `--background` | `#1C1612` | Warm dark brown — replaces blue-black |
| `--foreground` | `#F0EBE3` | Warm cream |
| `--primary` | `#D4845C` | Lighter terracotta |
| `--secondary` | `#8FB09C` | Lighter sage green |
| `--muted` | `#2A241E` | Dark warm muted |
| `--muted-foreground` | `#9E8E82` | Warm mid tone |
| `--border` | `#3A332A` | Warm dark border |
| `--card` | `#231E19` | Slightly lighter than background |
| `--card-foreground` | `#F0EBE3` | Warm cream |

## Typography

No new font imports needed — Merriweather is already loaded.

- **Journal editor text**: `font-merriweather text-lg leading-relaxed max-w-[68ch]`
- **Entry date header**: `font-space-grotesk font-bold text-xl text-primary`
- **UI elements** (sidebar, buttons, nav): Space Grotesk — unchanged
- **Chat messages**: Inter — unchanged

Change in `entry-content-form.tsx`: apply Merriweather class to the textarea.

## Mobile Navigation

### Current issues
- Mobile sidebar overlays with backdrop — disruptive
- Mobile header takes vertical space
- No clear way to switch between editor and chat on mobile

### New approach: Bottom Bar

Replace `journal-mobile-header.tsx` with a `journal-bottom-bar.tsx` component.

**Bottom bar tabs (mobile only, hidden on `md:`):**
- `Entrées` (CalendarDays icon) — opens sidebar as bottom sheet
- `Journal` (PenLine icon) — shows editor view
- `Chat IA` (Sparkles icon) — shows chat view

**Sidebar on mobile**: becomes a bottom sheet (slides up from bottom) triggered by the "Entrées" tab. Use existing `Sheet` component from Shadcn (side="bottom").

**Desktop**: unchanged — sidebar on left, editor + chat in main area with tabs.

## Editor ↔ Chat Tabs

### Current issues
- Switching between write mode and chat mode is not visually obvious
- Entry status (draft / conversation / text) is not visible at a glance

### New approach: Visible tabs

In `journal-main-content.tsx`, add a tab bar at the top of the content area:

```
[ Journal ]  [ Chat IA ●brouillon ]
```

- Two tabs: `Journal` and `Chat IA`
- Status badge next to "Chat IA" tab:
  - `brouillon` — amber/orange dot
  - `conversation` — sage green dot
  - (absent for plain text entries — no chat started)
- Tab switching updates the visible panel (editor or chat)
- On mobile, these tabs move into the bottom bar

## Readability

- **AI badges** (moods, themes, places, characters) in `entry-detections.tsx`: reduce size from current to `text-xs`, move below the editor content, add a subtle separator
- **Chat messages**: user messages use terracotta tint (`bg-primary/10 border-primary/20`), assistant messages use sage green tint (`bg-secondary/10 border-secondary/20`) — more differentiated than current blue/muted
- **Editor max-width**: constrain editor textarea to `max-w-2xl mx-auto` on large screens
- **Vertical spacing**: increase `gap` between major sections (date, editor, badges) for breathing room

## Files to Modify

| File | Change |
|---|---|
| `src/app/globals.css` | New CSS variable values (palette) |
| `src/components/entry-content-form.tsx` | Add Merriweather class to textarea |
| `src/components/journal-mobile-header.tsx` | Replace with bottom bar or hide |
| `src/components/journal-bottom-bar.tsx` | **New file** — mobile bottom navigation |
| `src/components/journal-main-content.tsx` | Add editor/chat tab bar, status badge |
| `src/components/entry-detections.tsx` | Smaller badges, moved below editor |
| `src/components/chat-message.tsx` | Warm-tinted message bubbles |
| `src/app/(journal)/page.tsx` | Wire up bottom bar, mobile layout adjustments |

## Out of Scope

- Login screen redesign (separate task if needed)
- Settings page redesign
- Animation/transition overhaul (can follow later)
- Dark mode fine-tuning beyond token changes (CSS variables handle it automatically)
