/**
 * E2E tests require Firebase Emulator + a dev server with emulator env.
 *
 * Quick start:
 *   Terminal 1: firebase emulators:start --only auth,firestore --project demo-mivoa
 *   Terminal 2: NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true npm run dev -- -p 3100
 *   Terminal 3: npm run test:e2e  (or E2E_BASE_URL=http://localhost:3101 npm run test:e2e)
 *
 * CI: use `firebase emulators:exec` to wrap the test command.
 */
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3100',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
