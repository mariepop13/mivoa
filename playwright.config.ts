/**
 * E2E tests require Firebase Emulator + a dev server with emulator env.
 *
 * Quick start (manual):
 *   Terminal 1: firebase emulators:start --only auth,firestore --project demo-mivoa
 *   Terminal 2: npm run test:e2e  (dev server auto-started by Playwright webServer)
 *
 * Fully automated (starts emulators + dev server + runs tests):
 *   npm run test:e2e:full
 *
 * Multi-worktree: E2E_BASE_URL=http://localhost:3101 npm run test:e2e
 *
 * CI: use `firebase emulators:exec` to wrap the test command.
 */
import { defineConfig, devices } from '@playwright/test';
import { parse } from 'dotenv';
import { readFileSync } from 'fs';

function loadTestEnv(): Record<string, string> {
  try {
    return parse(readFileSync('.env.test.local')) as Record<string, string>;
  } catch {
    return {};
  }
}

const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3100';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  webServer: {
    command: `npm run dev -- -p ${new URL(baseURL).port || '3100'}`,
    url: baseURL,
    reuseExistingServer: true,
    env: loadTestEnv(),
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
