import { defineConfig, devices } from '@playwright/test';

// End-to-end and accessibility tests run against the production build.
// Port 4330 so a running `npm run dev` (5173) or preview (4173) doesn't clash.
const PORT = 4330;

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
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
