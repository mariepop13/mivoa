# E2E Tests with Firebase Emulator Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable authenticated Playwright E2E tests for the import/export feature by running Firebase Auth + Firestore locally via emulator, bypassing Google OAuth.

**Architecture:** The app's `LoginScreen` only offers Google OAuth (unautomatable in Playwright). Instead, a `test-auth` page — active only when `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true` — signs in anonymously via the Firebase Emulator and seeds the user's Firestore settings with a fake OpenRouter API key, satisfying both `AuthGuard` and `ApiKeyGuard`. Playwright navigates to this page in `beforeEach` to get a fresh authenticated session for each test.

**Tech Stack:** Firebase Emulator Suite (auth:9099, firestore:8080), @playwright/test, Next.js `NEXT_PUBLIC_*` env vars

---

### Task 1: Configure Firebase Emulator

**Files:**
- Modify: `firebase.json`
- Create: `.env.test.local`

**Step 1: Add emulators block to `firebase.json`**

Replace the current content with:

```json
{
  "firestore": {
    "database": "(default)",
    "location": "nam5",
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "emulators": {
    "auth": {
      "port": 9099
    },
    "firestore": {
      "port": 8080
    },
    "ui": {
      "enabled": true,
      "port": 4000
    },
    "singleProjectMode": true
  }
}
```

**Step 2: Create `.env.test.local`**

```bash
# Firebase — fake values used only with the emulator (never hits production)
NEXT_PUBLIC_FIREBASE_API_KEY=fake-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=demo-mivoa.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-mivoa
NEXT_PUBLIC_FIREBASE_APP_ID=1:000000000000:web:0000000000000000000000
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=000000000000

# Tells the Firebase SDK to connect to local emulators
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true
```

> Note: `demo-` prefix in `projectId` is the Firebase convention for emulator-only projects — it prevents accidental connection to real Firebase.

**Step 3: Verify emulators can start**

```bash
firebase emulators:start --only auth,firestore --project demo-mivoa
```

Expected: emulator UI accessible at `http://localhost:4000`, Auth at `http://localhost:9099`, Firestore at `http://localhost:8080`. Stop with Ctrl+C.

**Step 4: Commit**

```bash
git add firebase.json .env.test.local
git commit -m "🔧 config(emulator): add Firebase emulator config for E2E tests"
```

---

### Task 2: Connect Firebase SDK to emulators

**Files:**
- Modify: `src/firebase/index.ts`

**Step 1: Read the current `initializeFirebase` function**

Open `src/firebase/index.ts`. The function calls `getAuth(firebaseApp)` and `getFirestore(firebaseApp)` then returns the SDKs. We need to add emulator connections after SDK initialization.

**Step 2: Add emulator connection logic**

Add these imports at the top of `src/firebase/index.ts`:

```ts
import { connectAuthEmulator } from 'firebase/auth';
import { connectFirestoreEmulator } from 'firebase/firestore';
```

Add a module-level guard (to prevent calling connect twice on HMR):

```ts
let emulatorsConnected = false;
```

Add a new helper function after the imports:

```ts
function connectToEmulators(auth: Auth, firestore: Firestore): void {
  if (emulatorsConnected) return;
  emulatorsConnected = true;
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  connectFirestoreEmulator(firestore, 'localhost', 8080);
}
```

In `getSdks`, call it conditionally right after creating `auth` and `firestore` and before the analytics block:

```ts
if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
  connectToEmulators(auth, firestore);
}
```

**Step 3: Run existing unit tests — must still pass**

```bash
npm run test:ci
```

Expected: 675 tests pass, 0 errors.

> Note: Unit tests mock `firebase/firestore` entirely, so emulator connection code is never called — no impact on existing tests.

**Step 4: Commit**

```bash
git add src/firebase/index.ts
git commit -m "🔧 config(firebase): connect SDK to emulators when NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true"
```

---

### Task 3: Create the `test-auth` page

**Files:**
- Create: `src/app/test-auth/page.tsx`

This page:
1. Signs in anonymously (emulator anonymous auth, no Google needed)
2. Seeds `users/{uid}/settings/api` with a fake OpenRouter API key (satisfies `ApiKeyGuard`)
3. Redirects to `/` (the journal)

It renders nothing useful in production (`NEXT_PUBLIC_USE_FIREBASE_EMULATOR !== 'true'`).

**Step 1: Write a failing Playwright test to confirm the page doesn't exist yet**

```bash
# Quick check — should return 404 or redirect
curl -s -o /dev/null -w "%{http_code}" http://localhost:3003/test-auth
```

Expected: 404 (page doesn't exist yet).

**Step 2: Create `src/app/test-auth/page.tsx`**

```tsx
'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { signInAnonymously } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth, useFirestore } from '@/firebase';

export default function TestAuthPage(): React.JSX.Element {
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const didRun = useRef(false);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR !== 'true') {
      router.replace('/');
      return;
    }
    if (!auth || !firestore || didRun.current) return;
    didRun.current = true;

    async function setup(): Promise<void> {
      const { user } = await signInAnonymously(auth!);
      const settingsRef = doc(firestore!, `users/${user.uid}/settings/api`);
      await setDoc(settingsRef, { openRouterApiKey: 'test-openrouter-key' });
      router.replace('/');
    }

    setup().catch(console.error);
  }, [auth, firestore, router]);

  return <div data-testid="test-auth-setup">Setting up test session…</div>;
}
```

**Step 3: Verify the page works manually (with emulators running)**

```bash
# Terminal 1:
firebase emulators:start --only auth,firestore --project demo-mivoa

# Terminal 2:
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true npm run dev -- -p 3100
```

Open `http://localhost:3100/test-auth` in your browser. Expected: brief flash of "Setting up test session…" then redirect to `/` (the journal, fully accessible).

**Step 4: Run unit tests — must still pass**

```bash
npm run test:ci
```

Expected: 675 tests pass.

**Step 5: Commit**

```bash
git add src/app/test-auth/page.tsx
git commit -m "✨ feat(test): add test-auth page for Playwright emulator sign-in"
```

---

### Task 4: Install Playwright and configure

**Files:**
- Modify: `package.json`
- Create: `playwright.config.ts`

**Step 1: Install Playwright**

```bash
npm install -D @playwright/test
npx playwright install chromium
```

**Step 2: Add scripts to `package.json`**

Add to the `"scripts"` block:

```json
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui"
```

**Step 3: Create `playwright.config.ts`**

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3100',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Dev server is started manually alongside emulators — see README
});
```

> Note: `workers: 1` prevents parallel tests from interfering with shared emulator state. `testDir: './e2e'` keeps E2E tests separate from Vitest unit tests.

**Step 4: Create the `e2e/` directory with a `.gitkeep`**

```bash
mkdir -p e2e
touch e2e/.gitkeep
```

**Step 5: Verify Playwright is configured correctly**

```bash
npx playwright test --list
```

Expected: "No tests found" (we haven't written any yet). Exit 0.

**Step 6: Commit**

```bash
git add package.json playwright.config.ts e2e/.gitkeep
git commit -m "🔧 config(playwright): install Playwright and configure for E2E tests"
```

---

### Task 5: Write E2E tests for import/export

**Files:**
- Create: `e2e/import-export.spec.ts`

**Prerequisites before running these tests:**
```bash
# Terminal 1 — emulators
firebase emulators:start --only auth,firestore --project demo-mivoa

# Terminal 2 — dev server with emulator env
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true npm run dev -- -p 3100
```

**Step 1: Write the tests**

Create `e2e/import-export.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import path from 'path';

const VALID_FIXTURE = path.resolve(__dirname, '../docs/test-fixtures/test-import-valid.json');

test.beforeEach(async ({ page }) => {
  await page.goto('/test-auth');
  await page.waitForURL('/');
  // Wait for the sidebar to be ready (Data button visible)
  await page.getByRole('button', { name: 'Data' }).waitFor();
});

test('Data button is visible in sidebar header', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Data' })).toBeVisible();
});

test('dropdown shows Export JSON, Export Markdown, Import JSON', async ({ page }) => {
  await page.getByRole('button', { name: 'Data' }).click();
  await expect(page.getByRole('menuitem', { name: 'Export JSON' })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: 'Export Markdown' })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: 'Import JSON' })).toBeVisible();
});

test('Export JSON shows success toast', async ({ page }) => {
  await page.getByRole('button', { name: 'Data' }).click();
  await page.getByRole('menuitem', { name: 'Export JSON' }).click();
  await expect(page.getByText(/export/i)).toBeVisible({ timeout: 5000 });
});

test('Export Markdown shows success toast', async ({ page }) => {
  await page.getByRole('button', { name: 'Data' }).click();
  await page.getByRole('menuitem', { name: 'Export Markdown' }).click();
  await expect(page.getByText(/export/i)).toBeVisible({ timeout: 5000 });
});

test('Import JSON — confirmation dialog shows entry counts', async ({ page }) => {
  await page.getByRole('button', { name: 'Data' }).click();

  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByRole('menuitem', { name: 'Import JSON' }).click(),
  ]);
  await fileChooser.setFiles(VALID_FIXTURE);

  // Dialog must appear with totals from test-import-valid.json (2 entries, 0 existing)
  await expect(page.getByRole('alertdialog')).toBeVisible({ timeout: 5000 });
  await expect(page.getByRole('alertdialog')).toContainText('2');
});

test('Import JSON — confirm imports entries and shows success toast', async ({ page }) => {
  await page.getByRole('button', { name: 'Data' }).click();

  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByRole('menuitem', { name: 'Import JSON' }).click(),
  ]);
  await fileChooser.setFiles(VALID_FIXTURE);

  await page.getByRole('alertdialog').waitFor();
  await page.getByRole('button', { name: 'Import JSON' }).click();

  await expect(page.getByText(/import/i)).toBeVisible({ timeout: 5000 });
});

test('Re-import same file — all entries skipped', async ({ page }) => {
  // First import
  await page.getByRole('button', { name: 'Data' }).click();
  const [fc1] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByRole('menuitem', { name: 'Import JSON' }).click(),
  ]);
  await fc1.setFiles(VALID_FIXTURE);
  await page.getByRole('alertdialog').waitFor();
  await page.getByRole('button', { name: 'Import JSON' }).click();
  await page.getByText(/import/i).waitFor({ timeout: 5000 });

  // Second import — same file
  await page.getByRole('button', { name: 'Data' }).click();
  const [fc2] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByRole('menuitem', { name: 'Import JSON' }).click(),
  ]);
  await fc2.setFiles(VALID_FIXTURE);

  // Dialog should show 0 new entries (all 2 are now existing)
  await expect(page.getByRole('alertdialog')).toBeVisible({ timeout: 5000 });
  const description = page.getByRole('alertdialog').locator('p');
  await expect(description).toContainText('0');
});

test('Import invalid version — shows error toast', async ({ page }) => {
  const INVALID_FIXTURE = path.resolve(
    __dirname,
    '../docs/test-fixtures/test-import-invalid.json'
  );

  await page.getByRole('button', { name: 'Data' }).click();
  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByRole('menuitem', { name: 'Import JSON' }).click(),
  ]);
  await fileChooser.setFiles(INVALID_FIXTURE);

  // No dialog — error toast instead
  await expect(page.getByRole('alertdialog')).not.toBeVisible();
  await expect(page.getByText(/version/i)).toBeVisible({ timeout: 5000 });
});
```

**Step 2: Run the tests (emulators + dev server must be running)**

```bash
npm run test:e2e
```

Expected: all 7 tests pass.

If a test fails, check:
- Emulators running? `curl http://localhost:9099` should respond
- Dev server using emulator env? Check console for "Auth Emulator" warning
- Toast text: adjust regex if i18n key text differs

**Step 3: Commit**

```bash
git add e2e/import-export.spec.ts
git commit -m "✅ test(e2e): add Playwright E2E tests for import/export with Firebase Emulator"
```

---

### Task 6: Add `.gitignore` entries and document the workflow

**Files:**
- Modify: `.gitignore`
- Create: (no new docs file — add instructions as a comment in `playwright.config.ts`)

**Step 1: Add Playwright artifacts to `.gitignore`**

```bash
echo "
# Playwright
/playwright-report/
/test-results/
" >> .gitignore
```

**Step 2: Add a comment block to `playwright.config.ts`** with run instructions

At the top of the file, above `defineConfig`, add:

```ts
/**
 * E2E tests require Firebase Emulator + a dev server with emulator env.
 *
 * Quick start:
 *   Terminal 1: firebase emulators:start --only auth,firestore --project demo-mivoa
 *   Terminal 2: NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true npm run dev -- -p 3100
 *   Terminal 3: npm run test:e2e
 *
 * CI: use `firebase emulators:exec` to wrap the test command.
 */
```

**Step 3: Run full unit test suite to confirm no regressions**

```bash
npm run test:ci
```

Expected: 675 tests pass, 0 errors.

**Step 4: Final commit**

```bash
git add .gitignore playwright.config.ts
git commit -m "📝 docs(e2e): add run instructions and gitignore for Playwright artifacts"
```
