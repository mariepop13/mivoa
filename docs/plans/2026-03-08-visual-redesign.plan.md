# Visual Redesign "Carnet vivant" Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the generic purple/white Shadcn aesthetic with a warm organic palette (cream, terracotta, sage green) and improve mobile navigation and UX readability.

**Architecture:** Pure CSS token swap in `globals.css` propagates the palette everywhere via Tailwind variables. New `JournalBottomBar` replaces `JournalMobileHeader` for mobile nav. `JournalViewTabs` gains an entry status badge. All changes are additive or drop-in replacements.

**Tech Stack:** Next.js 15 App Router, Tailwind CSS + CSS variables, Shadcn UI, Vitest + Testing Library, Lucide icons.

---

## Task 1: Update color palette in globals.css

**Files:**
- Modify: `src/app/globals.css`

**Step 1: Replace `:root` block with warm light-mode tokens**

```css
:root {
  --background: 39 44% 96%;
  --foreground: 24 32% 18%;
  --card: 0 0% 100%;
  --card-foreground: 24 32% 18%;
  --popover: 0 0% 100%;
  --popover-foreground: 24 32% 18%;
  --primary: 19 51% 53%;
  --primary-foreground: 0 0% 100%;
  --secondary: 145 15% 55%;
  --secondary-foreground: 0 0% 100%;
  --muted: 38 26% 90%;
  --muted-foreground: 26 13% 42%;
  --accent: 38 26% 90%;
  --accent-foreground: 24 32% 18%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 0 0% 98%;
  --border: 36 20% 81%;
  --input: 36 20% 81%;
  --ring: 19 51% 53%;
  --radius: 0.5rem;
  --chart-1: 19 51% 53%;
  --chart-2: 145 15% 55%;
  --chart-3: 30 80% 55%;
  --chart-4: 38 26% 70%;
  --chart-5: 340 75% 55%;
}
```

**Step 2: Replace `.dark` block with warm dark-mode tokens**

```css
.dark {
  --background: 23 22% 9%;
  --foreground: 38 30% 92%;
  --card: 31 17% 12%;
  --card-foreground: 38 30% 92%;
  --popover: 23 22% 9%;
  --popover-foreground: 38 30% 92%;
  --primary: 20 58% 60%;
  --primary-foreground: 0 0% 100%;
  --secondary: 144 17% 63%;
  --secondary-foreground: 0 0% 100%;
  --muted: 29 17% 14%;
  --muted-foreground: 26 13% 57%;
  --accent: 29 17% 14%;
  --accent-foreground: 38 30% 92%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 0 0% 98%;
  --border: 34 16% 20%;
  --input: 34 16% 20%;
  --ring: 20 58% 60%;
}
```

**Step 3: Verify in browser**

Run: `NEXT_PUBLIC_STORAGE_BACKEND=local npm run dev`

Open http://localhost:3000. Check:
- Background is warm cream (light) / dark brown (dark)
- Buttons (e.g. "Save") are terracotta, not purple
- No white flashes or clashing colors

**Step 4: Commit**

```bash
git add src/app/globals.css
git commit -m "🎨 style: apply warm organic color palette (terracotta + sage green)"
```

---

## Task 2: Verify Merriweather in editor textarea

**Files:**
- Read: `src/components/entry-content-form.tsx` (already read — uses `font-serif`)
- Read: `tailwind.config.ts` (already read — `serif: ['var(--font-merriweather)', 'serif']`)

**Step 1: Confirm font mapping is correct**

`tailwind.config.ts` maps `font-serif` → `var(--font-merriweather)`. The textarea in `entry-content-form.tsx` already uses `font-serif`. No change needed to the class.

**Step 2: Verify Merriweather loads**

Check `src/app/layout.tsx` to confirm `merriweather` is imported from `next/font/google` and applied as `--font-merriweather`. It should already be there.

```bash
grep -n "merriweather\|font-merriweather" src/app/layout.tsx
```

Expected: shows import and variable declaration.

**Step 3: Increase editor font size for readability**

In `src/components/entry-content-form.tsx`, update the textarea classes to increase leading and make it feel more like a physical journal:

Change:
```tsx
className="flex-1 w-full resize-none bg-transparent text-foreground
  placeholder:text-muted-foreground/60 focus:outline-none text-base sm:text-lg
  leading-[1.75] font-serif py-2"
```

To:
```tsx
className="flex-1 w-full resize-none bg-transparent text-foreground
  placeholder:text-muted-foreground/50 focus:outline-none text-base sm:text-[1.125rem]
  leading-[1.85] font-serif py-2 tracking-[0.01em]"
```

**Step 4: Verify visually**

Type some text in the journal editor. It should render in Merriweather serif font with comfortable line height.

**Step 5: Commit**

```bash
git add src/components/entry-content-form.tsx
git commit -m "🎨 style: increase editor leading and tracking for readability"
```

---

## Task 3: Add entry status badge to JournalViewTabs

**Files:**
- Modify: `src/components/journal-view-tabs.tsx`
- Modify: `src/components/journal-main-content.tsx`
- Test: `src/components/__tests__/journal-view-tabs.test.tsx`

**Step 1: Write the failing test**

Create `src/components/__tests__/journal-view-tabs.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { JournalViewTabs } from '../journal-view-tabs';

describe('JournalViewTabs', () => {
  const defaultProps = {
    viewMode: 'summary' as const,
    onViewModeChange: vi.fn(),
  };

  it('shows no status badge when entryKind is undefined', () => {
    render(<JournalViewTabs {...defaultProps} />);
    expect(screen.queryByTestId('entry-status-badge')).toBeNull();
  });

  it('shows draft badge when entryKind is draft', () => {
    render(<JournalViewTabs {...defaultProps} entryKind="draft" />);
    expect(screen.getByTestId('entry-status-badge')).toBeInTheDocument();
    expect(screen.getByTestId('entry-status-badge')).toHaveTextContent(/brouillon|draft/i);
  });

  it('shows conversation badge when entryKind is conversation', () => {
    render(<JournalViewTabs {...defaultProps} entryKind="conversation" />);
    expect(screen.getByTestId('entry-status-badge')).toBeInTheDocument();
    expect(screen.getByTestId('entry-status-badge')).toHaveTextContent(/conversation/i);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/components/__tests__/journal-view-tabs.test.tsx
```

Expected: FAIL — `entryKind` prop does not exist yet.

**Step 3: Add `entryKind` prop and status badge to JournalViewTabs**

Update `src/components/journal-view-tabs.tsx`:

```tsx
'use client';

import { MessageSquare, FileText } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';

type EntryKind = 'text' | 'draft' | 'conversation';

interface JournalViewTabsProps {
  viewMode: 'chat' | 'summary';
  onViewModeChange: (mode: 'chat' | 'summary') => void;
  className?: string;
  entryKind?: EntryKind;
}

function EntryStatusBadge({ entryKind }: { entryKind: EntryKind }): React.JSX.Element | null {
  if (entryKind === 'draft') {
    return (
      <span
        data-testid="entry-status-badge"
        className="ml-1.5 inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
      >
        brouillon
      </span>
    );
  }
  if (entryKind === 'conversation') {
    return (
      <span
        data-testid="entry-status-badge"
        className="ml-1.5 inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-secondary/20 text-secondary dark:bg-secondary/20 dark:text-secondary"
      >
        conversation
      </span>
    );
  }
  return null;
}

export function JournalViewTabs({
  viewMode,
  onViewModeChange,
  className,
  entryKind,
}: JournalViewTabsProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "flex items-center gap-1 p-1 sm:p-1.5 bg-muted/50 rounded-lg sm:rounded-lg border border-border/50",
        className
      )}
      role="tablist"
      aria-label="View mode selection"
    >
      <button
        type="button"
        role="tab"
        id="summary-tab"
        aria-selected={viewMode === 'summary'}
        aria-controls="summary-panel"
        onClick={() => onViewModeChange('summary')}
        className={cn(
          "flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-md text-sm font-medium transition-all duration-200 flex-1 sm:flex-initial",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          viewMode === 'summary'
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-background/50"
        )}
      >
        <FileText className="h-4 w-4 shrink-0" />
        <span className="whitespace-nowrap">{t('summary')}</span>
      </button>
      <button
        type="button"
        role="tab"
        id="chat-tab"
        aria-selected={viewMode === 'chat'}
        aria-controls="chat-panel"
        onClick={() => onViewModeChange('chat')}
        className={cn(
          "flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-md text-sm font-medium transition-all duration-200 flex-1 sm:flex-initial",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          viewMode === 'chat'
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-background/50"
        )}
      >
        <MessageSquare className="h-4 w-4 shrink-0" />
        <span className="whitespace-nowrap">{t('conversation')}</span>
        {entryKind && entryKind !== 'text' && <EntryStatusBadge entryKind={entryKind} />}
      </button>
    </div>
  );
}
```

**Step 4: Pass `entryKind` from JournalMainContent**

In `src/components/journal-main-content.tsx`, add `entryKind` to the `JournalViewTabs` call.

Import `getEntryKind` at the top:
```tsx
import { getEntryKind } from '@/utils/entry-kind';
```

Inside `JournalMainContent`, compute `entryKind`:
```tsx
const entryKind = selectedEntry ? getEntryKind(selectedEntry) : undefined;
```

Then in the JSX where `JournalViewTabs` is rendered:
```tsx
<JournalViewTabs
  viewMode={viewMode}
  onViewModeChange={setViewMode}
  className="w-full sm:w-auto"
  entryKind={entryKind}
/>
```

**Step 5: Run tests**

```bash
npx vitest run src/components/__tests__/journal-view-tabs.test.tsx
```

Expected: PASS all 3 tests.

**Step 6: Run full CI check**

```bash
npm run test:ci
```

Expected: all pass.

**Step 7: Commit**

```bash
git add src/components/journal-view-tabs.tsx src/components/__tests__/journal-view-tabs.test.tsx src/components/journal-main-content.tsx
git commit -m "✨ feat: add entry status badge (brouillon/conversation) to view tabs"
```

---

## Task 4: Create JournalBottomBar mobile navigation component

**Files:**
- Create: `src/components/journal-bottom-bar.tsx`
- Create: `src/components/__tests__/journal-bottom-bar.test.tsx`

**Step 1: Write the failing test**

Create `src/components/__tests__/journal-bottom-bar.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { JournalBottomBar } from '../journal-bottom-bar';

describe('JournalBottomBar', () => {
  const defaultProps = {
    viewMode: 'summary' as const,
    onViewModeChange: vi.fn(),
    onSidebarToggle: vi.fn(),
    shouldShowChat: false,
  };

  it('renders 3 navigation tabs', () => {
    render(<JournalBottomBar {...defaultProps} />);
    expect(screen.getByRole('button', { name: /entrées/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /journal/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /chat/i })).toBeInTheDocument();
  });

  it('calls onSidebarToggle when Entrées tab is clicked', () => {
    render(<JournalBottomBar {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /entrées/i }));
    expect(defaultProps.onSidebarToggle).toHaveBeenCalledOnce();
  });

  it('calls onViewModeChange with summary when Journal tab is clicked', () => {
    render(<JournalBottomBar {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /journal/i }));
    expect(defaultProps.onViewModeChange).toHaveBeenCalledWith('summary');
  });

  it('calls onViewModeChange with chat when Chat tab is clicked', () => {
    render(<JournalBottomBar {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /chat/i }));
    expect(defaultProps.onViewModeChange).toHaveBeenCalledWith('chat');
  });

  it('shows Journal tab as active when shouldShowChat is false', () => {
    render(<JournalBottomBar {...defaultProps} shouldShowChat={false} />);
    const journalTab = screen.getByRole('button', { name: /journal/i });
    expect(journalTab).toHaveAttribute('aria-selected', 'true');
  });

  it('shows Chat tab as active when shouldShowChat is true', () => {
    render(<JournalBottomBar {...defaultProps} shouldShowChat={true} />);
    const chatTab = screen.getByRole('button', { name: /chat/i });
    expect(chatTab).toHaveAttribute('aria-selected', 'true');
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/components/__tests__/journal-bottom-bar.test.tsx
```

Expected: FAIL — module not found.

**Step 3: Create JournalBottomBar component**

Create `src/components/journal-bottom-bar.tsx`:

```tsx
'use client';

import { CalendarDays, PenLine, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface JournalBottomBarProps {
  viewMode: 'chat' | 'summary';
  onViewModeChange: (mode: 'chat' | 'summary') => void;
  onSidebarToggle: () => void;
  shouldShowChat: boolean;
}

interface BottomBarTabProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  ariaSelected?: boolean;
}

function BottomBarTab({ icon, label, isActive, onClick, ariaSelected }: BottomBarTabProps): React.JSX.Element {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={ariaSelected}
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center gap-1 flex-1 py-2 px-1 text-xs font-medium transition-colors',
        isActive
          ? 'text-primary'
          : 'text-muted-foreground hover:text-foreground'
      )}
    >
      <span className={cn(
        'p-1.5 rounded-lg transition-colors',
        isActive ? 'bg-primary/10' : ''
      )}>
        {icon}
      </span>
      {label}
    </button>
  );
}

export function JournalBottomBar({
  onViewModeChange,
  onSidebarToggle,
  shouldShowChat,
}: JournalBottomBarProps): React.JSX.Element {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-sm border-t border-border"
      aria-label="Navigation principale"
    >
      <div className="flex items-stretch h-16" role="tablist">
        <BottomBarTab
          icon={<CalendarDays className="h-5 w-5" />}
          label="Entrées"
          isActive={false}
          ariaSelected={undefined}
          onClick={onSidebarToggle}
        />
        <BottomBarTab
          icon={<PenLine className="h-5 w-5" />}
          label="Journal"
          isActive={!shouldShowChat}
          ariaSelected={!shouldShowChat}
          onClick={() => onViewModeChange('summary')}
        />
        <BottomBarTab
          icon={<Sparkles className="h-5 w-5" />}
          label="Chat IA"
          isActive={shouldShowChat}
          ariaSelected={shouldShowChat}
          onClick={() => onViewModeChange('chat')}
        />
      </div>
    </nav>
  );
}
```

**Step 4: Run test to verify it passes**

```bash
npx vitest run src/components/__tests__/journal-bottom-bar.test.tsx
```

Expected: PASS all 6 tests.

**Step 5: Commit**

```bash
git add src/components/journal-bottom-bar.tsx src/components/__tests__/journal-bottom-bar.test.tsx
git commit -m "✨ feat: add mobile bottom navigation bar component"
```

---

## Task 5: Integrate JournalBottomBar into JournalMainContent

**Files:**
- Modify: `src/components/journal-main-content.tsx`

**Step 1: Replace JournalMobileHeader with JournalBottomBar**

In `src/components/journal-main-content.tsx`:

1. Remove the import of `JournalMobileHeader`
2. Add import for `JournalBottomBar`
3. Replace the `<JournalMobileHeader ... />` JSX with `<JournalBottomBar ... />`
4. Add bottom padding on mobile so content doesn't hide behind the bar

Change the import block:
```tsx
// Remove this:
import { JournalMobileHeader } from '@/components/journal-mobile-header';
// Add this:
import { JournalBottomBar } from '@/components/journal-bottom-bar';
```

Update the return JSX in `JournalMainContent`. Replace:
```tsx
return (
  <div className="flex-1 flex flex-col bg-background">
    <JournalMobileHeader
      title={getEntryTitle(selectedEntry, entries)}
      onSidebarToggle={onSidebarToggle}
      isSidebarOpen={isSidebarOpen}
    />
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-5xl mx-auto p-4 sm:p-5 lg:p-8 w-full">
```

With:
```tsx
return (
  <div className="flex-1 flex flex-col bg-background">
    <div className="flex-1 overflow-y-auto pb-16 md:pb-0">
      <div className="max-w-5xl mx-auto p-4 sm:p-5 lg:p-8 w-full">
```

And close the outer `</div>` after the scroll container, then add the bottom bar before the final closing:
```tsx
    </div>
    <JournalBottomBar
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      onSidebarToggle={onSidebarToggle}
      shouldShowChat={shouldShowChat}
    />
  </div>
```

**Step 2: Run full CI check**

```bash
npm run test:ci
```

Expected: all pass. If any lint errors on the removed `isSidebarOpen` prop, remove it from the destructuring in `JournalMainContent` if it's no longer used.

**Step 3: Verify visually on mobile viewport**

In browser DevTools, switch to a mobile viewport (e.g. iPhone 12, 390px wide). Verify:
- Bottom bar appears with 3 tabs
- Clicking "Entrées" opens the sidebar
- Clicking "Journal" shows the editor
- Clicking "Chat IA" shows the chat
- No top header visible on mobile

**Step 4: Commit**

```bash
git add src/components/journal-main-content.tsx
git commit -m "♻️ refactor: replace mobile header with bottom navigation bar"
```

---

## Task 6: Update AI detection badges to warm tones

**Files:**
- Modify: `src/components/entry-detections.tsx`

**Step 1: Update RAINBOW_COLORS to warm palette**

The current rainbow colors (red, yellow, blue, violet) clash with the warm palette. Replace with warm organic variants:

In `src/components/entry-detections.tsx`, change `RAINBOW_COLORS`:

```tsx
const RAINBOW_COLORS = [
  'bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-700',
  'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700',
  'bg-rose-100 dark:bg-rose-900/20 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-700',
  'bg-stone-100 dark:bg-stone-900/20 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700',
] as const;
```

**Step 2: Run test:ci**

```bash
npm run test:ci
```

Expected: all pass (no tests for this visual change).

**Step 3: Verify visually**

Open an entry with moods/themes/places. Badges should show amber, emerald, rose, stone tones — harmonious with the warm palette.

**Step 4: Commit**

```bash
git add src/components/entry-detections.tsx
git commit -m "🎨 style: update AI detection badges to warm organic color palette"
```

---

## Task 7: Editor max-width and vertical spacing

**Files:**
- Modify: `src/components/entry-content-form.tsx`

**Step 1: Add max-width constraint to editor**

The editor should be constrained to a comfortable reading/writing width on large screens. In `src/components/entry-content-form.tsx`:

Change the outer div from:
```tsx
<div className="flex-1 flex flex-col px-4 sm:px-6 lg:px-8">
```

To:
```tsx
<div className="flex-1 flex flex-col px-4 sm:px-6 lg:px-8 max-w-3xl w-full mx-auto">
```

**Step 2: Increase date/title spacing for breathing room**

In the title block, change:
```tsx
<div className="pt-5 sm:pt-6 lg:pt-8 pb-5 sm:pb-6 lg:pb-8 border-b border-border/60">
```

To:
```tsx
<div className="pt-6 sm:pt-8 lg:pt-10 pb-6 sm:pb-8 lg:pb-10 border-b border-border/40">
```

**Step 3: Run test:ci**

```bash
npm run test:ci
```

Expected: all pass.

**Step 4: Verify visually**

On a wide screen (1440px+), the editor text should be centered with comfortable margins on both sides, not stretching full width.

**Step 5: Commit**

```bash
git add src/components/entry-content-form.tsx
git commit -m "🎨 style: constrain editor max-width and increase vertical spacing"
```

---

## Task 8: Final verification and cleanup

**Step 1: Run full CI**

```bash
npm run test:ci
```

Expected: all linting, typecheck, and tests pass.

**Step 2: Visual smoke test in browser**

Test the following scenarios:

| Scenario | Expected |
|---|---|
| Light mode, new entry | Cream background, terracotta buttons |
| Dark mode, new entry | Warm brown background, lighter terracotta |
| Mobile (< 768px) | Bottom bar visible, no top header |
| Tap "Chat IA" tab | Chat view opens, bottom bar shows Chat active |
| Tap "Journal" tab | Editor opens with Merriweather font |
| Conversation entry | Status badge shows "conversation" in tabs |
| Draft entry | Status badge shows "brouillon" in tabs |
| AI analysis run | Warm-toned badges (amber, emerald, rose) |
| Editor on wide screen | Text area centered, max ~768px wide |

**Step 3: Create PR**

```bash
git push -u origin feature/visual-redesign
```

Then run `/git:create-pr` to create the pull request to `develop`.
