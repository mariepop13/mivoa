# Test Refactor Design

**Date:** 2026-03-02
**Branch:** develop
**Scope:** 73 test files → ~25-30 modified, CI workflow updated

## Goal

Align the test suite with a behavior-only philosophy and fix a CI double-run inefficiency.

## Philosophy

**Behavior-only:** Tests verify what the user sees and experiences, not implementation details.

```ts
// ❌ Implementation detail — remove
expect(useWordCount).toHaveBeenCalledWith(content);

// ✅ Behavior — keep
expect(screen.getByText('5 words')).toBeInTheDocument();
```

Exception: hooks and services may keep contract assertions on **external** dependencies (mocked API calls, Firebase, OpenRouter) — those are the hook's public contract, not an implementation detail.

## Rules by Category

### Utils / Lib / AI Utils — No changes
`src/utils/`, `src/lib/`, `src/ai/utils/`

These are already correct: pure input → output tests, no mocks, fast. Leave untouched.

### Components — Remove implementation detail assertions
`src/components/__tests__/`

**Remove:**
- `expect(SomeHook).toHaveBeenCalledWith(...)` on internal hooks
- `expect(MockComponent).toHaveBeenCalledTimes(N)` when the rendered output is already asserted
- Tests that verify React-internal behavior (key generation, internal component call counts)

**Keep:**
- Render output assertions (`getByText`, `getByRole`, `queryByText`)
- User interaction tests (`userEvent.click`, `fireEvent.change`)
- Conditional rendering based on props

### Hooks — Extract wrappers, remove redundant assertions
`src/hooks/__tests__/`

**Remove:**
- Inline duplicated context wrappers — extract to a local `createWrapper(overrides?)` helper per file
- State assertions that duplicate what the service return value already proves

**Keep:**
- Loading/error/success state transitions
- Edge cases (empty content, missing API key, etc.)
- Contract assertions on external service mocks (these ARE the hook's behavior)

### Services / Context / Firebase — Light cleanup only
`src/ai/services/__tests__/`, `src/context/__tests__/`, `src/firebase/__tests__/`

Minimal changes. Remove duplicate assertions where the same condition is checked twice.

## CI Changes

`/.github/workflows/test.yml`

**Before:**
```
job: test     → npm ci + lint + typecheck + vitest run (no coverage)
job: coverage → npm ci + vitest run --coverage + upload Codecov
```
Tests run twice on two separate runners.

**After:**
```
job: test     → npm ci + lint + typecheck + vitest run --coverage → upload artifact
job: coverage → needs: [test] → download artifact → upload to Codecov
```
Tests run once. Coverage artifact shared between jobs. Both jobs still visible in GitHub PR checks.

## Files Affected

| Category | Files | Action |
|---|---|---|
| `src/components/__tests__/` | ~15 files | Remove impl-detail assertions |
| `src/hooks/__tests__/` | ~10 files | Extract wrappers, remove redundant assertions |
| `.github/workflows/test.yml` | 1 file | Add `needs`, artifact upload/download |
| `src/utils/`, `src/lib/`, `src/ai/utils/` | 0 files | No changes |
| `src/ai/services/`, `src/context/`, `src/firebase/` | ~5 files | Light cleanup |

## Success Criteria

- All tests still pass after refactor
- No `expect(SomeHook).toHaveBeenCalledWith(...)` assertions remain in component tests
- No duplicated context wrapper definitions within the same test file
- CI runs tests exactly once per PR
- Coverage still uploaded to Codecov
- No new test files created
