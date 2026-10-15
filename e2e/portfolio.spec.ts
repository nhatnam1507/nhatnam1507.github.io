// Smoke tests for the portfolio page (/), run at desktop, mobile and with
// reduced motion (see playwright.config.ts). Expectations come from the
// section contract and registry, plus the legacy site's pinning behaviour.
import type { Page } from '@playwright/test';
import { MEDIA, NAV_HEIGHT } from '@/shared/env';
import { pad2 } from '@/shared/dom';
import type { SectionId } from '@/shell/contract';
import { expect, expectedNavLinks, expectedSections, openPortfolio, test, waitForBoot } from './support';

/** The sections the legacy site pins on desktop (with reduced motion only the experience timeline pins). */
const LEGACY_PINNED = ['about', 'experience', 'stack'] as const satisfies readonly SectionId[];
const LEGACY_PINNED_REDUCED = ['experience'] as const satisfies readonly SectionId[];

const isDesktop = (page: Page): Promise<boolean> => page.evaluate((query) => matchMedia(query).matches, MEDIA.desktop);

test('loads and scrolls to the end without console errors', async ({ page }) => {
  // The auto fixture in support.ts fails the test on any console error or uncaught exception.
  await openPortfolio(page);
  const steps = 8;
  for (let step = 1; step <= steps; step++) {
    await page.evaluate(([i, n]) => scrollTo(0, ((document.scrollingElement?.scrollHeight ?? 0) * i) / n), [
      step,
      steps,
    ] as const);
    await page.waitForTimeout(100); // let scroll-driven code run between steps
  }
  await page.evaluate(() => scrollTo(0, 0));
});

test('renders the registry sections in order with their labels', async ({ page }) => {
  await page.goto('/');
  const rendered = await page
    .locator('#app section.section')
    .evaluateAll((sections) =>
      sections.map((section) => ({ id: section.id, label: section.getAttribute('data-label') })),
    );
  expect(rendered).toEqual(expectedSections.map(({ id, label }) => ({ id, label })));
});

test('every section after the hero shows its kicker number', async ({ page }) => {
  await page.goto('/');
  // The hero may have no kicker (the legacy one doesn't); every other section does.
  for (const { id, index } of expectedSections) {
    const kicker = page.locator(`#${id} .kicker > span`).first();
    if (index === 0 && (await kicker.count()) === 0) continue;
    await expect(kicker, `kicker of #${id}`).toHaveText(pad2(index));
  }
});

test('nav links and HUD total follow the registry', async ({ page }) => {
  await page.goto('/');
  const links = await page
    .locator('.nav-links a')
    .evaluateAll((anchors) =>
      anchors.map((a) => ({ href: a.getAttribute('href'), number: a.querySelector('span')?.textContent })),
    );
  expect(links).toEqual(expectedNavLinks.map(({ id, index }) => ({ href: `#${id}`, number: pad2(index) })));
  await expect(page.locator('.hud-total')).toHaveText(pad2(expectedSections.length - 1));
});

test('the boot screen goes away', async ({ page }) => {
  await page.goto('/');
  const reduced = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  // Reduced motion skips the boot sequence; otherwise it plays for about two seconds.
  await waitForBoot(page, reduced ? 3_000 : 15_000);
});

test('pinned sections get a pin-spacer on desktop and none on mobile', async ({ page }) => {
  await openPortfolio(page);
  const pinned = await page.locator('.pin-spacer').evaluateAll((spacers) =>
    spacers.map((spacer) => ({
      children: Array.from(spacer.children).map((child) => child.id),
      parent: spacer.parentElement?.id ?? '',
    })),
  );

  if (!(await isDesktop(page))) {
    expect(pinned, 'phones get enter animations, never pins').toEqual([]);
    return;
  }
  // Each spacer wraps exactly one section, and the pinned set matches the legacy site.
  const ids = pinned.map((spacer) => {
    expect(spacer.children).toHaveLength(1);
    return spacer.children[0];
  });
  const reduced = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  expect(ids, 'pinned sections, in registry order').toEqual([...(reduced ? LEGACY_PINNED_REDUCED : LEGACY_PINNED)]);
  for (const spacer of pinned) expect(spacer.parent).toBe('app');
});

test('nav jumps land on their section', async ({ page }) => {
  test.setTimeout(90_000); // each jump runs a ~1.5s curtain wipe
  await openPortfolio(page);

  const jumpTo = async (id: SectionId) => {
    // A real click where the link is visible; phones collapse the nav links, so dispatch the click there.
    const link = page.locator(`[data-scroll-to][href="#${id}"]`).first();
    if (await link.isVisible()) await link.click();
    else await link.dispatchEvent('click');

    await expect
      .poll(
        () =>
          page.evaluate(
            ([sectionId, navHeight]) => {
              const top = document.getElementById(sectionId)?.getBoundingClientRect().top ?? Infinity;
              const scroller = document.scrollingElement;
              const atEnd = !!scroller && scrollY >= scroller.scrollHeight - innerHeight - 2;
              // The section's top edge sits at the viewport top (or just under the fixed nav), or,
              // for the last section, the page can't scroll any further and it fills the screen.
              return (top >= -4 && top <= navHeight + 4) || (atEnd && top > 0 && top < innerHeight);
            },
            [id, NAV_HEIGHT] as const,
          ),
        { message: `#${id} reached after the nav jump`, timeout: 10_000 },
      )
      .toBe(true);
    // The curtain ignores clicks while it is wiping, so let it finish before the next jump.
    await expect(page.locator('.curtain')).toBeHidden();
  };

  const targets = expectedNavLinks.map((link) => link.id);
  for (const id of targets) await jumpTo(id); // down the page...
  for (const id of [...targets].reverse().slice(1)) await jumpTo(id); // ...and back up
});

test('reduced motion is honoured by the project setup', async ({ page }, testInfo) => {
  await page.goto('/');
  const reduced = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  expect(reduced).toBe(testInfo.project.name === 'reduced-motion');
});
