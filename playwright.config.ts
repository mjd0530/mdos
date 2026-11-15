import { defineConfig, devices } from '@playwright/test';

// End-to-end and accessibility tests run against the production build.
// Port 4330 so a running `npm run dev` (5173) or preview (4173) doesn't clash.
// E2E_PORT lets a second checkout (a git worktree) test at the same time without
// reusing the other checkout's server.
const PORT = Number(process.env.E2E_PORT ?? 4330);

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  // Leave CPU for the browser: a busy machine otherwise causes timeouts, not real failures.
  workers: process.env.CI ? undefined : '50%',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
    // Tests start as returning visitors, so About Mike doesn't open over the desktop;
    // first-visit.spec.ts clears this to test the first visit.
    storageState: {
      cookies: [],
      origins: [
        {
          origin: `http://localhost:${PORT}`,
          localStorage: [{ name: 'mikeos:visited', value: '1' }],
        },
      ],
    },
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
    // iPad screen and touch, run in Chromium (WebKit isn't installed for tests).
    {
      name: 'tablet',
      use: { ...devices['iPad Mini'], browserName: 'chromium' },
    },
  ],
  webServer: {
    command: `MDOS_TEST_MUSIC=1 npm run build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
