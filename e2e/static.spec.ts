// Smoke tests for the other public URLs: the printable CV page and the PDF.
// Viewport-independent, so they only run in the desktop project.
import { CV_PDF_PATH } from '@/shared/site';
import { expect, test } from './support';

test('/cv.html loads without the portfolio chrome and reaches body.is-ready', async ({ page }) => {
  const response = await page.goto('/cv.html');
  expect(response?.status()).toBe(200);
  await expect(page.locator('#cv')).toBeAttached();
  // The print layout must not load the portfolio's chrome or WebGL canvas (PLAN.md D7).
  await expect(page.locator('#webgl, .nav, #boot')).toHaveCount(0);

  // scripts/build-pdf.ts waits for this signal (fonts loaded) before printing.
  await expect(page.locator('#cv > *').first()).toBeVisible();
  await expect(page.locator('body')).toHaveClass(/\bis-ready\b/, { timeout: 15_000 });
});

test('the PDF link on the portfolio points at a PDF that is served', async ({ page, request }) => {
  await page.goto('/');
  const hrefs = await page.locator('a.js-export').evaluateAll((anchors) => anchors.map((a) => a.getAttribute('href')));
  expect(hrefs.length).toBeGreaterThan(0);
  for (const href of hrefs) expect(href).toBe(CV_PDF_PATH);

  const response = await request.get(CV_PDF_PATH);
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/pdf');
  expect((await response.body()).subarray(0, 5).toString()).toBe('%PDF-');
});
