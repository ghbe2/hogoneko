const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
(async()=>{
 const password=process.env.MOCK_VIEW_PASSWORD;if(!password)throw Error('Set MOCK_VIEW_PASSWORD');
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:375,height:812}}),errors=[];
  page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.PREVIEW_URL||pathToFileURL(path.resolve('docs/index.html')).href);
  await page.locator('#password').fill(password);await page.locator('#enter').click();
  await page.waitForFunction(()=>typeof FIRST_GUIDES!=='undefined');
  assert.equal(await page.evaluate(()=>productById('starter_set').price),10);
  await page.locator('[data-action="start-game"]').click();
  await page.waitForFunction(()=>gameState.campaign.phase==='story');
  await page.screenshot({path:'tests/screenshots/published-entry.png'});
  assert.equal(await page.evaluate(()=>gameState.onboarding.flowVersion),1);
  assert.deepEqual(errors,[]);console.log('PASS password entry, latest first-activity flow, starter set 10 coins, story start');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
