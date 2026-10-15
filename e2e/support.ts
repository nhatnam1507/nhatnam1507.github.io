// Shared helpers for the smoke tests (not a spec itself).
//
// Expectations come from the section contract, not from hard-coded lists:
// src/shell/registry.ts is the single source of truth for page order, kicker
// numbers and nav numbers, so the tests import it. That import only pulls the
// definitions and their Server Component Views (plain TSX, no CSS or browser
// APIs), which Playwright's TypeScript loader handles, including the `@/` alias.
import { expect, test as base, type Page } from '@playwright/test';
import { navSections } from '@/shell/contract';
import { sectionMeta } from '@/shell/registry';

/** Numbered sections in page order; `index` is the kicker / nav / HUD number. */
export const expectedSections = sectionMeta.map((section, index) => ({ ...section, index }));

/** Sections listed in the nav, with the number the nav shows for each. */
export const expectedNavLinks = navSections(expectedSections);

/** Fails every test that logs a console error, hits an uncaught exception or fails a request. */
export const test = base.extend<{ noPageErrors: void }>({
  noPageErrors: [
    async ({ page }, runTest) => {
      const problems: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error') problems.push(`console.error: ${message.text()}`);
      });
      page.on('pageerror', (error) => problems.push(`uncaught: ${error.message}`));
      await runTest();
      expect(problems, 'console errors and uncaught exceptions').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

/**
 * The boot screen is done once #boot is hidden (the shell never removes the node: React owns it)
 * and the body has left its booting state.
 */
export async function waitForBoot(page: Page, timeout = 15_000): Promise<void> {
  await expect(page.locator('#boot'), '#boot is hidden once the boot sequence ends').toBeHidden({ timeout });
  await expect(page.locator('body')).not.toHaveClass(/\bis-booting\b/);
  await page.evaluate(() => document.fonts.ready);
}

/** Open the portfolio and wait until the boot screen is gone. */
export async function openPortfolio(page: Page): Promise<void> {
  await page.goto('/');
  await waitForBoot(page);
}
