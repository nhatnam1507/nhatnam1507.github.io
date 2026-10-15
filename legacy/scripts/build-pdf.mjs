// Renders cv.html to a PDF with headless Chromium.
//
//   npm run pdf                       → assets/cv/Nam_Nguyen_Nhat_CV.pdf
//   npm run pdf -- --out dist/cv.pdf  → custom path (CI preview)
//
// Uses CHROMIUM_PATH when set (CI points it at the runner's Chrome),
// otherwise Playwright's bundled Chromium (`npx playwright install chromium`).
import http from 'node:http';
import { mkdir, readFile } from 'node:fs/promises';
import { dirname, extname, isAbsolute, join, normalize, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('..', import.meta.url));
const outArg = process.argv.indexOf('--out');
const out = outArg > -1 ? (isAbsolute(process.argv[outArg + 1]) ? process.argv[outArg + 1] : join(process.cwd(), process.argv[outArg + 1])) : join(root, 'assets/cv/Nam_Nguyen_Nhat_CV.pdf');
const EXPECTED_MAX_PAGES = 2;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.pdf': 'application/pdf', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };

const server = http.createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '');
  try {
    const body = await readFile(join(root, path || 'index.html'));
    res.writeHead(200, { 'content-type': types[extname(path)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((r) => server.listen(0, r));
const { port } = server.address();

let browser;
try {
  browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
} catch (err) {
  console.error(`✗ Could not start Chromium (${err.message.split('\n')[0]}).\n  Run \`npx playwright install chromium\` or set CHROMIUM_PATH.`);
  server.close();
  process.exit(1);
}

const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(`http://localhost:${port}/cv.html`, { waitUntil: 'networkidle' });
await page.waitForSelector('body.is-ready', { timeout: 15000 }).catch(() => errors.push('cv.html never became ready (fonts or script failed)'));
if (errors.length) {
  console.error(`✗ cv.html failed to render:\n  ${errors.join('\n  ')}`);
  await browser.close();
  server.close();
  process.exit(1);
}

await mkdir(dirname(out), { recursive: true });
const pdf = await page.pdf({ path: out, preferCSSPageSize: true, printBackground: true });
await browser.close();
server.close();

const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page(?!s)/g) || []).length;
console.log(`✓ wrote ${relative(process.cwd(), out) || out} (${pages} page${pages === 1 ? '' : 's'}, ${(pdf.length / 1024).toFixed(0)} KB)`);
if (pages > EXPECTED_MAX_PAGES) {
  const msg = `The CV is now ${pages} pages (designed for ${EXPECTED_MAX_PAGES}). Consider trimming bullets in src/content/profile.js.`;
  console.warn(`! ${msg}`);
  if (process.env.GITHUB_ACTIONS === 'true') console.log(`::warning file=src/content/profile.js,title=CV length::${msg}`);
}
