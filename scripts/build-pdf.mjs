// Renders cv.html to assets/cv/Nam_Nguyen_Nhat_CV.pdf with headless Chromium.
// Usage: npm run pdf
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('..', import.meta.url));
const out = join(root, 'assets/cv/Nam_Nguyen_Nhat_CV.pdf');
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

const launch = process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {};
const browser = await chromium.launch(launch);
const page = await browser.newPage();
await page.goto(`http://localhost:${port}/cv.html`, { waitUntil: 'networkidle' });
await page.waitForSelector('body.is-ready');
await page.pdf({ path: out, preferCSSPageSize: true, printBackground: true });
await browser.close();
server.close();
console.log(`wrote ${out}`);
