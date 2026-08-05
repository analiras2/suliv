import { defineConfig } from '@playwright/test';

const ADMIN_BASE_URL = process.env.ADMIN_BASE_URL ?? 'http://localhost:3100';

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: ADMIN_BASE_URL,
  },
  // Assumes the admin API (Task 1) is already running with a migrated,
  // reachable Postgres database — Playwright only boots the admin app itself.
  webServer: {
    command: 'npm run build && npm run start',
    url: ADMIN_BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
