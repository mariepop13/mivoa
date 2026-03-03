# Test Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Align the test suite with behavior-only philosophy and fix CI double-run inefficiency.

**Architecture:** Four independent task groups (CI, Components, Hooks, Services) executed by separate subagents. Each subagent commits its own changes. No new test files created — only modifications and deletions within existing files.

**Tech Stack:** Vitest, @testing-library/react, userEvent, GitHub Actions

**Design doc:** `docs/plans/2026-03-02-test-refactor-design.md`

---

## Core Rules (read before every task)

**Remove** any assertion that verifies an internal hook was called from a component test:
```ts
// ❌ Remove
expect(useWordCount).toHaveBeenCalledWith(content);
expect(SomeHook).toHaveBeenCalled();
```

**Remove** mock call count assertions when the rendered output already proves the behavior:
```ts
// ❌ Remove — redundant when getByText('Message 1') already passes
expect(ChatMessage).toHaveBeenCalledTimes(2);

// ✅ Keep — this is the actual behavior assertion
expect(screen.getByText('Message 1')).toBeInTheDocument();
```

**Remove** tests whose sole purpose is verifying that a mock was called with a prop value (not behavior):
```ts
// ❌ Remove — this tests React wiring, not behavior
it('should call useWordCount with content prop', () => {
  render(<WordCountBadge content={content} />);
  expect(useWordCount).toHaveBeenCalledWith(content);
});
```

**Keep** contract assertions in hooks and services on external dependencies:
```ts
// ✅ Keep — this IS the hook's behavior contract
expect(entryAnalysisService.analyzeEntry).toHaveBeenCalledWith(
  content, apiKey, lang, model
);
```

**Extract** duplicated context wrappers in hook test files to a local helper:
```ts
// ❌ Before — repeated inline in multiple tests
const wrapperWithoutKey = ({ children }) => (
  <OpenRouterApiKeyContext.Provider value={{ apiKey: null, ... }}>
    ...
  </OpenRouterApiKeyContext.Provider>
);

// ✅ After — single helper at top of file
const createWrapper = (overrides = {}) => ({ children }) => (
  <OpenRouterApiKeyContext.Provider value={{ apiKey: 'test-key', ...overrides }}>
    ...
  </OpenRouterApiKeyContext.Provider>
);
```

---

## Task 1: Fix CI double-run

**Files:**
- Modify: `.github/workflows/test.yml`

**Step 1: Update test job to run with coverage and save artifact**

Replace the test run step in the `test` job:
```yaml
- name: Run tests (lint, typecheck, test)
  run: npm run lint && npm run typecheck && npx vitest run --coverage --reporter=verbose
  timeout-minutes: 5
  env:
    CI: true
    TEST_OPENROUTER_API_KEY: ${{ secrets.TEST_OPENROUTER_API_KEY }}

- name: Upload coverage artifact
  uses: actions/upload-artifact@v4
  with:
    name: coverage-report
    path: ./coverage/coverage-final.json
    retention-days: 1
```

**Step 2: Update coverage job to depend on test and download artifact**

```yaml
coverage:
  runs-on: ubuntu-latest
  needs: [test]

  steps:
  - name: Download coverage artifact
    uses: actions/download-artifact@v4
    with:
      name: coverage-report
      path: ./coverage

  - name: Upload coverage to Codecov
    uses: codecov/codecov-action@v3
    with:
      files: ./coverage/coverage-final.json
      flags: unittests
      name: codecov-umbrella
      fail_ci_if_error: false
```

**Step 3: Remove the duplicate npm ci + vitest run from coverage job** (they are no longer needed)

**Step 4: Verify the full YAML is valid**

```bash
cat .github/workflows/test.yml
```

**Step 5: Commit**

```bash
git add .github/workflows/test.yml
git commit -m "⚡ perf(ci): run tests once, share coverage artifact between jobs"
```

---

## Task 2: Refactor component tests

**Files to modify** (remove impl-detail assertions only — do NOT remove behavior assertions):
- `src/components/__tests__/word-count-badge.test.tsx`
- `src/components/__tests__/chat-messages-list.test.tsx`
- `src/components/__tests__/ai-prompt-suggestion.test.tsx`
- `src/components/__tests__/api-key-form.test.tsx`
- `src/components/__tests__/api-key-status.test.tsx`
- `src/components/__tests__/chat-input-form.test.tsx`
- `src/components/__tests__/chat-message.test.tsx`
- `src/components/__tests__/journal-auth-error.test.tsx`
- `src/components/__tests__/journal-entry-status.test.tsx`
- `src/components/__tests__/model-card.test.tsx`
- `src/components/__tests__/oauth-connect-button.test.tsx`
- `src/components/__tests__/settings-api-key-section.test.tsx`
- `src/components/__tests__/settings-language-section.test.tsx`
- `src/components/__tests__/settings-menu.test.tsx`
- `src/components/__tests__/settings-model-section.test.tsx`
- `src/components/__tests__/settings-theme-section.test.tsx`
- `src/components/__tests__/template-prompt-dialog.test.tsx`
- `src/components/__tests__/templates-dialog.test.tsx`

**Step 1: Read each file and identify violations**

For each file, look for:
1. `expect(SomeHook).toHaveBeenCalledWith(...)` — remove entire `it()` block if that's its only assertion
2. `expect(MockComponent).toHaveBeenCalledTimes(N)` — remove line if rendered output already asserted above
3. `expect(MockComponent).toHaveBeenCalled()` — remove if component rendering already verified via screen queries
4. Tests named "should call X with Y prop" — strong signal for removal

**Step 2: For word-count-badge.test.tsx specifically**

Remove the last test entirely:
```ts
// Remove this entire it() block:
it('should call useWordCount with content prop', () => {
  const content = 'Test content';
  render(<WordCountBadge content={content} />);
  expect(useWordCount).toHaveBeenCalledWith(content);
});
```

**Step 3: For chat-messages-list.test.tsx specifically**

Remove "should generate unique keys for messages" test — it only checks `calls.length >= 2` which is already proven by the "should render all messages" test.

Remove `expect(ChatMessage).toHaveBeenCalledTimes(2)` from "should render all messages" test — the `getByText` assertions already prove this.

Remove `expect(ChatEmptyState).toHaveBeenCalled()` — replace with `expect(screen.getByText('Empty State')).toBeInTheDocument()` (the mock renders `<div>Empty State</div>`).

**Step 4: Run tests after each file to make sure nothing breaks**

```bash
npx vitest run src/components/__tests__/<filename>.test.tsx --reporter=verbose
```

Expected: all tests PASS (we only removed assertions, never logic)

**Step 5: Commit**

```bash
git add src/components/__tests__/
git commit -m "♻️ refactor(tests): remove implementation detail assertions from component tests"
```

---

## Task 3: Refactor hook tests

**Files to modify:**
- `src/hooks/__tests__/use-entry-analysis.test.tsx`
- `src/hooks/__tests__/use-chat-conversation.test.tsx`
- `src/hooks/__tests__/use-template-conversation.test.tsx`
- `src/hooks/__tests__/use-entry-operations.test.tsx`
- `src/hooks/__tests__/use-journal-entries.test.tsx`
- `src/hooks/__tests__/use-summary-operations.test.tsx`
- `src/hooks/__tests__/use-entry-linking.test.tsx`
- `src/hooks/__tests__/use-entry-dates.test.tsx`
- `src/hooks/__tests__/use-entry-templates.test.tsx`
- `src/hooks/__tests__/use-journal-prompts.test.tsx`

**Step 1: Read each file and identify duplicated wrappers**

If a file defines a context wrapper inline more than once (e.g., `wrapperWithoutKey` defined as a full JSX tree), extract to `createWrapper(overrides?)`.

**Step 2: For use-entry-analysis.test.tsx specifically**

Replace the inline `wrapperWithoutKey` with `createWrapper({ apiKey: null })`:

```ts
// At top of file, replace the two separate wrapper definitions with:
const createWrapper = (overrides: { apiKey?: string | null } = {}) =>
  ({ children }: { children: React.ReactNode }) => (
    <OpenRouterApiKeyContext.Provider
      value={{ apiKey: overrides.apiKey ?? mockApiKey, setApiKey: vi.fn(), resetApiKey: vi.fn(), isLoading: false }}
    >
      <LanguageContext.Provider value={{ language: mockLanguage, setLanguage: vi.fn(), supportedLanguages: SUPPORTED_LANGUAGES }}>
        <ModelContext.Provider value={{ selectedModel: mockModel, setSelectedModel: vi.fn(), isLoading: false }}>
          {children}
        </ModelContext.Provider>
      </LanguageContext.Provider>
    </OpenRouterApiKeyContext.Provider>
  );

// Then in tests:
// Before: { wrapper }
// Before (no key): { wrapper: wrapperWithoutKey }
// After:  { wrapper: createWrapper() }
// After (no key): { wrapper: createWrapper({ apiKey: null }) }
```

**Step 3: Run tests after each file**

```bash
npx vitest run src/hooks/__tests__/<filename>.test.tsx --reporter=verbose
```

Expected: all tests PASS

**Step 4: Commit**

```bash
git add src/hooks/__tests__/
git commit -m "♻️ refactor(tests): extract duplicated context wrappers in hook tests"
```

---

## Task 4: Light cleanup — services, context, firebase

**Files to modify:**
- `src/ai/services/__tests__/chat-service.test.ts`
- `src/ai/services/__tests__/entry-analysis-service.test.ts`
- `src/ai/services/__tests__/conversation-summary-service.test.ts`
- `src/context/__tests__/LanguageContext.test.tsx`
- `src/context/__tests__/ModelContext.test.tsx`
- `src/context/__tests__/OpenRouterApiKeyContext.test.tsx`
- `src/firebase/__tests__/client-provider.test.tsx`
- `src/firebase/__tests__/provider.test.tsx`
- `src/firebase/__tests__/non-blocking-login.test.ts`

**Step 1: Read each file**

Look only for:
1. Assertions checking the same condition twice in the same test
2. `it()` blocks that have no assertion (just setup + no `expect`)
3. Tests that exist purely to verify a mock was imported correctly (no behavior)

These files are mostly already well-written — if nothing violates the rules, leave the file untouched.

**Step 2: Run all tests to confirm clean state**

```bash
npx vitest run --reporter=verbose
```

Expected: all tests PASS

**Step 3: Commit if any changes were made**

```bash
git add src/ai/services/__tests__/ src/context/__tests__/ src/firebase/__tests__/
git commit -m "♻️ refactor(tests): light cleanup in service and context tests"
```

---

## Final verification

```bash
npx vitest run --reporter=verbose
npm run lint
npm run typecheck
```

All must pass before opening PR.
