// End-to-end smoke tests against the built static export (out/), served the
// way GitHub Pages serves it. Run `npm run build` first, then `npm run e2e`.
import { defineConfig, devices } from '@playwright/test';

const PORT = 3210;
const BASE_URL = `http://localhost:${PORT}`;
const CI = Boolean(process.env.CI);

/** CI uses the runner's Chrome (see .github/actions/setup); locally Playwright's own Chromium is used. */
const executablePath = process.env.CHROMIUM_PATH || undefined;

const desktopViewport = { width: 1440, height: 900 };
const baseUse = { ...devices['Desktop Chrome'], launchOptions: { executablePath } };

export default defineConfig({
  testDir: 'e2e',
  testMatch: '*.spec.ts',
  // Reports live under dist/ (ignored by git, ESLint and Prettier).
  outputDir: 'dist/e2e/test-results',
  fullyParallel: true,
  forbidOnly: CI,
  retries: 0, // a flaky smoke test is a bug to fix, not to retry
  workers: CI ? 2 : undefined,
  reporter: CI ? [['github'], ['list'], ['html', { open: 'never', outputFolder: 'dist/e2e/report' }]] : [['list']],
  use: { baseURL: BASE_URL, trace: 'retain-on-failure' },
  projects: [
    {
      name: 'desktop',
      use: { ...baseUse, viewport: desktopViewport },
    },
    {
      name: 'mobile',
      testMatch: 'portfolio.spec.ts',
      use: { ...baseUse, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 },
    },
    {
      name: 'reduced-motion',
      testMatch: 'portfolio.spec.ts',
      use: { ...baseUse, viewport: desktopViewport, contextOptions: { reducedMotion: 'reduce' } },
    },
  ],
  webServer: {
    // `serve` maps /cv.html to /cv with a redirect (cleanUrls); GitHub Pages serves both.
    command: `npx serve out -l ${PORT} --no-clipboard --no-port-switching`,
    url: BASE_URL,
    reuseExistingServer: !CI,
    timeout: 30_000,
  },
});
