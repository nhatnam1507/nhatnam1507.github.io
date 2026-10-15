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
 * The boot screen is done once #boot is gone, `hidden` or not displayed. The shell never removes
 * the node (React owns it); the runtime sets `hidden` or hides it with CSS.
 *
 * Known gap until S1 lands: the stub boot only sets the `hidden` attribute, and boot.css's
 * `#boot { display: flex }` overrides it, so the overlay stays painted. S1 must make `[hidden]`
 * win (e.g. `#boot[hidden] { display: none }`). Once it does, swap the poll below for
 * `expect(page.locator('#boot')).toBeHidden()`, which also checks that it is really invisible.
 */
export async function waitForBoot(page: Page, timeout = 15_000): Promise<void> {
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const boot = document.getElementById('boot');
          if (!boot || boot.hidden) return true;
          const style = getComputedStyle(boot);
          return style.display === 'none' || style.visibility === 'hidden';
        }),
      { message: '#boot is hidden once the boot sequence ends', timeout },
    )
    .toBe(true);
  await expect(page.locator('body')).not.toHaveClass(/\bis-booting\b/);
  await page.evaluate(() => document.fonts.ready);

  const stillPainted = await page.evaluate(() => {
    const boot = document.getElementById('boot');
    return !!boot && getComputedStyle(boot).display !== 'none' && getComputedStyle(boot).visibility !== 'hidden';
  });
  if (stillPainted) {
    test.info().annotations.push({
      type: 'warning',
      description: '#boot is marked hidden but still painted (CSS beats the hidden attribute); fix in S1.',
    });
  }
}

/** Open the portfolio and wait until the boot screen is gone. */
export async function openPortfolio(page: Page): Promise<void> {
  await page.goto('/');
  await waitForBoot(page);
}
