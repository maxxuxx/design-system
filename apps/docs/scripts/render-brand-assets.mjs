import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from '@playwright/test';

const docsRoot = fileURLToPath(new URL('../', import.meta.url));
const repoRoot = path.resolve(docsRoot, '..', '..');
const tokenRoot = path.join(repoRoot, 'packages', 'tokens');
const publicRoot = path.join(docsRoot, 'public');

const html = `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="/fonts.css" />
    <style>
      * { box-sizing: border-box; }
      html, body { margin: 0; background: #FFFFFF; font-family: 'Pretendard Variable', Pretendard, sans-serif; }
      #touch {
        display: grid;
        width: 180px;
        height: 180px;
        place-items: center;
        color: #FFFFFF;
        font-size: 72px;
        font-weight: 700;
        background: #245BE0;
      }
      #og {
        position: relative;
        display: flex;
        width: 1200px;
        height: 630px;
        flex-direction: column;
        justify-content: space-between;
        overflow: hidden;
        padding: 72px 80px;
        color: #171D24;
        background: #F8F9FB;
      }
      #og::after {
        position: absolute;
        width: 560px;
        height: 560px;
        right: -140px;
        bottom: -280px;
        content: '';
        background: #245BE0;
        border-radius: 50%;
      }
      .brand { display: flex; align-items: center; gap: 24px; color: #245BE0; font-size: 42px; font-weight: 700; }
      .mark { display: grid; width: 72px; height: 72px; place-items: center; color: #FFFFFF; background: #245BE0; border-radius: 18px; }
      .copy { position: relative; z-index: 1; max-width: 980px; }
      h1 { margin: 0; font-size: 62px; line-height: 1.18; letter-spacing: -0.035em; }
      p { max-width: 790px; margin: 26px 0 0; color: #485463; font-size: 28px; line-height: 1.5; letter-spacing: -0.015em; }
      .meta { position: relative; z-index: 1; color: #245BE0; font-size: 24px; font-weight: 600; }
    </style>
  </head>
  <body>
    <div id="touch" aria-label="HDS">H</div>
    <div id="og">
      <div class="brand"><span class="mark">H</span><span>Haru Design System</span></div>
      <div class="copy">
        <h1>Haru의 제품 경험을<br />일관되게 만드는 디자인 시스템</h1>
        <p>토큰, 접근 가능한 React 컴포넌트, Figma 라이브러리와 AI용 메타데이터를 하나의 계약으로 연결합니다.</p>
      </div>
      <div class="meta">HDS v0.1.0 · hds.haru-dev.com</div>
    </div>
  </body>
</html>`;

const server = createServer(async (request, response) => {
  try {
    if (request.url === '/fonts.css') {
      response.writeHead(200, { 'content-type': 'text/css; charset=utf-8' });
      response.end(await readFile(path.join(tokenRoot, 'fonts.css')));
      return;
    }
    if (request.url?.startsWith('/fonts/pretendard/woff2/')) {
      const file = path.basename(request.url);
      response.writeHead(200, { 'content-type': 'font/woff2' });
      response.end(await readFile(path.join(tokenRoot, 'fonts', 'pretendard', 'woff2', file)));
      return;
    }
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    response.end(html);
  } catch (error) {
    response.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
    response.end(String(error));
  }
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const address = server.address();
if (address === null || typeof address === 'string') throw new Error('Brand asset server did not bind.');

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1 });
  await page.goto(`http://127.0.0.1:${address.port}/`);
  await page.evaluate(() => document.fonts.ready);
  await page.locator('#touch').screenshot({ path: path.join(publicRoot, 'apple-touch-icon.png') });
  await page.locator('#og').screenshot({ path: path.join(publicRoot, 'brand', 'hds-og.png') });
} finally {
  await browser.close();
  server.close();
}
