import { defineConfig, devices } from '@playwright/test'

const webPort = Number(process.env.PLAYWRIGHT_WEB_PORT ?? 5173)
const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${webPort}`

/**
 * Browser E2E (stub auth). API must already be running on VITE_API_URL
 * (default http://localhost:3000) with AUTH_MODE=stub and matching JWT_SECRET.
 *
 * Local:
 *   npm run dev:api
 *   npm run test:e2e:web
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npm run dev -- --host localhost --port ${webPort}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      VITE_AUTH_MODE: 'stub',
      VITE_API_URL: process.env.VITE_API_URL ?? 'http://localhost:3000',
      VITE_JWT_SECRET:
        process.env.VITE_JWT_SECRET ??
        process.env.JWT_SECRET ??
        'dev-jwt-secret-change-me',
    },
  },
})
