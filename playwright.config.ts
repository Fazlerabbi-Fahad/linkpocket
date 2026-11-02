import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';

const WEB_PORT = 3100;
const API_PORT = 4100;
export const WEB_ORIGIN = `http://localhost:${WEB_PORT}`;
/** The api project, next to this one in lp/ (CI checks it out to the same place). */
const API_DIR = process.env.LINKPOCKET_API_DIR ?? fileURLToPath(new URL('../api', import.meta.url));
export const OUTBOX_DIR = fileURLToPath(new URL('./e2e/.outbox', import.meta.url));

/**
 * AC-1, AC-5, AC-6 end to end: the real API (in-memory MongoDB, emails written to a folder)
 * behind the real Next.js app, in Chromium. The API comes from the api project next to this
 * one: `../api` by default, or LINKPOCKET_API_DIR (its dependencies must be installed).
 */
export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  timeout: 60_000,
  use: {
    baseURL: WEB_ORIGIN,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'pnpm e2e:server',
      cwd: API_DIR,
      url: `http://localhost:${API_PORT}/healthz`,
      env: {
        E2E_API_PORT: String(API_PORT),
        E2E_WEB_ORIGIN: WEB_ORIGIN,
        E2E_OUTBOX_DIR: OUTBOX_DIR,
      },
      reuseExistingServer: false,
      timeout: 180_000,
    },
    {
      command: `pnpm exec next dev --port ${WEB_PORT}`,
      url: WEB_ORIGIN,
      env: { API_INTERNAL_URL: `http://localhost:${API_PORT}` },
      reuseExistingServer: false,
      timeout: 180_000,
    },
  ],
});
