// Generates og.png (1200×630) in monochrome: #0A0A0A bg, #F2F2F2 text.
import { chromium } from 'playwright';

const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
  @font-face {
    font-family: 'Playfair Display';
    font-style: normal;
    font-weight: 700;
    src: url('fonts/playfair-700.woff2') format('woff2');
  }
  @font-face {
    font-family: 'Playfair Display';
    font-style: normal;
    font-weight: 400;
    src: url('fonts/playfair-400.woff2') format('woff2');
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1200px;
    height: 630px;
    background: #0A0A0A;
    color: #F2F2F2;
    font-family: 'Playfair Display', Georgia, serif;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 72px 80px;
    position: relative;
    overflow: hidden;
  }
  .rail-left {
    position: absolute; top: 0; bottom: 0; left: 40px;
    width: 0.5px; background: rgba(242,242,242,0.35);
  }
  .rail-right {
    position: absolute; top: 0; bottom: 0; right: 40px;
    width: 0.5px; background: rgba(242,242,242,0.35);
  }
  .xii {
    position: absolute;
    top: -2%;
    right: 3%;
    font-size: 320px;
    font-weight: 700;
    line-height: 1;
    letter-spacing: -0.02em;
    color: transparent;
    -webkit-text-stroke: 1.5px #F2F2F2;
    opacity: 0.3;
    user-select: none;
  }
  .label {
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 16px;
    letter-spacing: 0.25em;
    color: rgba(242,242,242,0.57);
    margin-bottom: 20px;
  }
  .frame {
    border: 1px solid #F2F2F2;
    padding: 36px 48px;
    display: inline-block;
    width: fit-content;
  }
  h1 {
    font-size: 68px;
    font-weight: 500;
    line-height: 1.1;
    color: #F2F2F2;
    white-space: nowrap;
  }
  .date {
    margin-top: 40px;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 20px;
    color: rgba(242,242,242,0.57);
    letter-spacing: 0.08em;
  }
</style>
</head>
<body>
  <div class="rail-left"></div>
  <div class="rail-right"></div>
  <div class="xii" aria-hidden="true">XII</div>
  <p class="label">12e lustrum</p>
  <div class="frame">
    <h1>N.S.Z.V. De Loefbijter</h1>
  </div>
  <p class="date">8 september 2026 &nbsp;·&nbsp; lustrum.loefbijter.nl</p>
</body>
</html>`;

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const server = await new Promise((resolve) => {
  const s = createServer(async (req, res) => {
    if (req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
      return;
    }
    const filePath = decodeURIComponent(req.url.split('?')[0]);
    try {
      const data = await readFile(join(__dirname, filePath));
      const mime = { '.woff2': 'font/woff2' };
      res.writeHead(200, { 'Content-Type': mime[extname(filePath)] || 'application/octet-stream' });
      res.end(data);
    } catch {
      res.writeHead(404); res.end('Not found');
    }
  });
  s.listen(0, () => resolve(s));
});

const port = server.address().port;
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1200, height: 630 });
await page.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(300);
await page.screenshot({ path: join(__dirname, 'og.png') });
await browser.close();
server.close();
console.log('og.png written.');
