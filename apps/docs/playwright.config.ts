import { defineConfig } from '@playwright/test';

const baseURL = 'http://127.0.0.1:4173';

export default defineConfig({
  testDir: './tests/e2e', outputDir: './test-results', fullyParallel: true,
  forbidOnly: true, retries: 0, reporter: 'list',
  snapshotPathTemplate: '{testDir}/__snapshots__/{testFileBaseName}/{arg}{ext}',
  use: { baseURL, browserName: 'chromium', trace: 'on-first-retry', screenshot: 'only-on-failure' },
  projects: [
    { name: 'mobile-chromium', use: { viewport: { width: 390, height: 844 } } },
    { name: 'tablet-chromium', use: { viewport: { width: 768, height: 1024 } } },
    { name: 'desktop-chromium', use: { viewport: { width: 1440, height: 900 } } },
  ],
  webServer: { command: 'pnpm run preview:e2e', url: baseURL, reuseExistingServer: false, timeout: 120_000, stdout: 'pipe', stderr: 'pipe' },
});
