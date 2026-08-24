// Renders index.html at 390px, 1440px and 1920px wide, full page, into shots/.
// Usage: node screenshot.mjs [--reduced-motion] [--date=ISO_STRING]
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = __dirname;

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
};

function startServer() {
  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      let filePath = req.url === '/' ? '/index.html' : req.url;
      filePath = decodeURIComponent(filePath.split('?')[0]);
      try {
        const data = await readFile(path.join(root, filePath));
        res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] || 'application/octet-stream' });
        res.end(data);
      } catch {
        res.writeHead(404);
        res.end('Not found');
      }
    });
    server.listen(0, () => resolve(server));
  });
}

const args = process.argv.slice(2);
const reducedMotion = args.includes('--reduced-motion');
const dateArg = args.find((a) => a.startsWith('--date='));
const fakeNow = dateArg ? dateArg.slice('--date='.length) : null;

const server = await startServer();
const port = server.address().port;

const browser = await chromium.launch();
const widths = [390, 1440, 1920];

for (const width of widths) {
  const context = await browser.newContext({
    viewport: { width, height: 800 },
    reducedMotion: reducedMotion ? 'reduce' : 'no-preference',
  });

  if (fakeNow) {
    await context.addInitScript(`{
      const fakeNow = new Date(${JSON.stringify(fakeNow)}).getTime();
      const OrigDate = Date;
      const offset = fakeNow - OrigDate.now();
      class FakeDate extends OrigDate {
        constructor(...args) {
          if (args.length === 0) super(OrigDate.now() + offset);
          else super(...args);
        }
        static now() { return OrigDate.now() + offset; }
      }
      globalThis.Date = FakeDate;
    }`);
  }

  const page = await context.newPage();
  await page.goto(`http://localhost:${port}/index.html`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);

  // Scroll through the full page so IntersectionObserver-driven reveals fire,
  // matching what a real visitor sees rather than the reveal-pending initial state.
  const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y <= scrollHeight; y += 400) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(50);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);
  const suffix = reducedMotion ? '-reduced-motion' : '';
  const dateSuffix = fakeNow ? '-fakedate' : '';
  await page.screenshot({
    path: path.join(root, 'shots', `${width}${suffix}${dateSuffix}.png`),
    fullPage: true,
  });
  await context.close();
}

await browser.close();
server.close();
console.log('Screenshots written to shots/');
