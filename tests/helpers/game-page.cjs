const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');

function gameUrl(scenario) {
 const url = new URL(process.env.GAME_URL || pathToFileURL(path.resolve('index.html')).href);
 url.searchParams.set('check', '1');
 if (scenario) url.searchParams.set('scenario', scenario);
 return url.href;
}

async function openGame(page, scenario) {
 await page.goto(gameUrl(scenario));
 if (await page.locator('#password').count()) {
  if (!process.env.MOCK_VIEW_PASSWORD) throw new Error('公開用ページの確認には MOCK_VIEW_PASSWORD が必要です');
  await page.fill('#password', process.env.MOCK_VIEW_PASSWORD);
  // A remembered password can finish loading while the field is being filled.
  await page.locator('#enter').click({timeout:1500}).catch(async error => {
   if (!await page.evaluate(() => typeof gameState !== 'undefined')) throw error;
  });
 }
 await page.waitForFunction(() => typeof gameState !== 'undefined' && typeof render === 'function');
 if (!page.__gameEvidence) {
  page.__gameEvidence = true;
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const screenshot = page.screenshot.bind(page);
  page.screenshot = async options => {
   const result = await screenshot(options);
   if (options?.path) {
    const state = await page.evaluate(() => ({
     viewport:[innerWidth, innerHeight], phase:gameState.campaign.phase,
     guide:gameState.onboarding.guide, tour:gameState.onboarding.homeTour,
     navigationBusy:typeof guideNavigationBusy !== 'undefined' && guideNavigationBusy,
     documentScroll:document.documentElement.scrollHeight > innerHeight + 1,
     toolImages:document.querySelectorAll('.command-ghost').length,
     controls:[...app.querySelectorAll('button')].filter(e => e.checkVisibility()).map(e => ({
      text:e.textContent.trim(), data:{...e.dataset}, disabled:e.disabled,
      rect:e.getBoundingClientRect().toJSON()
     }))
    })).catch(error => ({error:error.message}));
    fs.writeFileSync(options.path + '.json', JSON.stringify({url:page.url(),errors,state}, null, 2));
   }
   return result;
  };
 }
}
module.exports = {gameUrl,openGame};
