// Renders the CV page of the static export (out/) to a PDF with headless Chromium.
//
//   npm run build && npm run pdf                       → public/assets/cv/Nam_Nguyen_Nhat_CV.pdf
//   npm run build && npm run pdf -- --out dist/cv.pdf  → custom path (CI preview, deploy)
//
// Uses CHROMIUM_PATH when set (CI points it at the runner's Chrome),
// otherwise Playwright's bundled Chromium (`npx playwright install chromium`).
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { existsSync } from 'node:fs';
import { mkdir, readFile, stat } from 'node:fs/promises';
import { dirname, extname, isAbsolute, join, normalize, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, type Browser } from 'playwright';
import { CV_PDF_PATH } from '../src/shared/site';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SITE_DIR = join(ROOT, 'out');
const DEFAULT_OUT = join(ROOT, 'public', CV_PDF_PATH);
const CV_URL_PATH = '/cv.html';
const EXPECTED_MAX_PAGES = 2;

const TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.pdf': 'application/pdf',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain',
};

function parseOut(argv: string[]): string {
  const i = argv.indexOf('--out');
  if (i === -1) return DEFAULT_OUT;
  const value = argv[i + 1];
  if (!value) throw new Error('--out needs a path');
  return isAbsolute(value) ? value : join(process.cwd(), value);
}

/** `/cv` → out/cv.html, `/` → out/index.html, everything else (/_next/**, /assets/**) is served as is. */
async function resolveFile(pathname: string): Promise<string> {
  const rel = normalize(decodeURIComponent(pathname)).replace(/^([/\\])+/, '');
  const exact = join(SITE_DIR, rel || 'index.html');
  if ((await stat(exact).catch(() => null))?.isFile()) return exact;
  return `${exact}.html`;
}

function startServer(): Promise<{ server: http.Server; port: number }> {
  const server = http.createServer(async (req, res) => {
    try {
      const file = await resolveFile(new URL(req.url ?? '/', 'http://x').pathname);
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404).end();
    }
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, () => resolve({ server, port: (server.address() as AddressInfo).port }));
  });
}

function launchBrowser(): Promise<Browser> {
  return chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
}

const countPages = (pdf: Buffer): number => (pdf.toString('latin1').match(/\/Type\s*\/Page(?!s)/g) ?? []).length;

async function main(): Promise<number> {
  if (!existsSync(join(SITE_DIR, 'cv.html'))) {
    console.error('✗ out/cv.html not found. Run `npm run build` first.');
    return 1;
  }
  const out = parseOut(process.argv.slice(2));
  const { server, port } = await startServer();
  let browser: Browser | undefined;
  try {
    try {
      browser = await launchBrowser();
    } catch (err) {
      const reason = (err instanceof Error ? err.message : String(err)).split('\n')[0];
      console.error(
        `✗ Could not start Chromium (${reason}).\n  Run \`npx playwright install chromium\` or set CHROMIUM_PATH.`,
      );
      return 1;
    }

    const page = await browser.newPage();
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`http://localhost:${port}${CV_URL_PATH}`, { waitUntil: 'networkidle' });
    await page
      .waitForSelector('body.is-ready', { timeout: 15000 })
      .catch(() => errors.push('cv.html never became ready (fonts or script failed)'));
    if (errors.length) {
      console.error(`✗ cv.html failed to render:\n  ${errors.join('\n  ')}`);
      return 1;
    }

    await mkdir(dirname(out), { recursive: true });
    const pdf = await page.pdf({ path: out, preferCSSPageSize: true, printBackground: true });

    const pages = countPages(pdf);
    console.log(
      `✓ wrote ${relative(process.cwd(), out) || out} (${pages} page${pages === 1 ? '' : 's'}, ${(pdf.length / 1024).toFixed(0)} KB)`,
    );
    if (pages > EXPECTED_MAX_PAGES) {
      const msg = `The CV is now ${pages} pages (designed for ${EXPECTED_MAX_PAGES}). Consider trimming bullets in src/content/profile.ts.`;
      console.warn(`! ${msg}`);
      if (process.env.GITHUB_ACTIONS === 'true')
        console.log(`::warning file=src/content/profile.ts,title=CV length::${msg}`);
    }
    return 0;
  } finally {
    await browser?.close();
    server.close();
  }
}

process.exitCode = await main().catch((err: unknown) => {
  console.error(`✗ ${err instanceof Error ? err.message : String(err)}`);
  return 1;
});
