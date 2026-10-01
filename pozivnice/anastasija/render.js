// Renderuje pozivnica.html u PNG i JPG (2160x3840 px).
// Potrebni: Node.js + Playwright (npm i playwright). Pokretanje:  node render.js
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 2 });
  await page.goto('file://' + path.join(__dirname, 'pozivnica.html'), { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 30000 });
  await page.waitForTimeout(400);
  const card = page.locator('#card');
  await card.screenshot({ path: path.join(__dirname, 'pozivnica-anastasija.png') });
  await card.screenshot({ path: path.join(__dirname, 'pozivnica-anastasija.jpg'), type: 'jpeg', quality: 92 });
  await browser.close();
  console.log('Gotovo: pozivnica-anastasija.png / .jpg');
})().catch(e => { console.error(e); process.exit(1); });
