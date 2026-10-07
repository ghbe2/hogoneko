const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    for (const [width, height] of [[320, 520], [375, 764], [430, 932]]) {
      for (const javaScriptEnabled of [false, true]) {
        const page = await browser.newPage({ viewport: { width, height }, javaScriptEnabled });
        await page.goto(pathToFileURL(path.resolve('index.html')).href);
        for (let reload = 0; reload < 2; reload++) {
          assert.deepEqual(await page.locator('#app').boundingBox(), { x: 0, y: 0, width, height });
          assert.equal(await page.locator('#app').evaluate(el => getComputedStyle(el).borderRadius), '0px');
          await page.screenshot({ path: `tests/screenshots/initial-frame-${width}-${javaScriptEnabled}-${reload}.png` });
          if (!reload) await page.reload();
        }
        await page.close();
      }
    }
    console.log('PASS initial HTML and loaded/reloaded app have identical full-viewport frames at three sizes');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
