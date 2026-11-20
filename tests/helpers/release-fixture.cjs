const {pathToFileURL}=require('url'),path=require('path'),assert=require('node:assert/strict');
exports.openReleaseFixture=async(page,mode)=>{
 const url=new URL(process.env.GAME_URL||pathToFileURL(path.resolve('index.html')).href);
 url.searchParams.set('check','1');url.searchParams.set('debug-play','1');url.searchParams.set('debug-start',mode);
 await page.goto(url.href);
 if(await page.locator('#password').count()){await page.locator('#password').fill(process.env.MOCK_VIEW_PASSWORD||'hogohogo');await page.locator('#enter').click();}
 await page.waitForFunction(()=>typeof gameState!=='undefined'&&typeof HouseholdRuntime!=='undefined');
 if(process.env.EXPECTED_BUILD)assert.equal(await page.locator('meta[name=tsuguneko-build]').first().getAttribute('content'),process.env.EXPECTED_BUILD);
};
