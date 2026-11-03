import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 15000,
  expect: { timeout: 5000 },
  globalTimeout: 6 * 60 * 1000,
  maxFailures: 8,
  retries: 0,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],
  use: { baseURL: 'http://localhost:8099/' },
  webServer: { command: 'python -m http.server 8099 --directory _site', url: 'http://localhost:8099/index.html', reuseExistingServer: false, timeout: 20000 },
  projects: [{ name: 'chromium', use: { browserName: 'chromium', launchOptions: { args: ['--autoplay-policy=no-user-gesture-required', '--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] } } }],
});
