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
  assert.equal(await page.evaluate(()=>HOME_TOUR.length),9,'current app and care walkthrough is bundled');
  assert.equal(await page.evaluate(()=>typeof roomActionArt),'function','current room UI is bundled');
  await page.locator('[data-action="start-game"]').click();
  await page.waitForFunction(()=>gameState.campaign.phase==='story');
  await page.screenshot({path:'tests/screenshots/published-entry.png'});
  assert.equal(await page.evaluate(()=>gameState.onboarding.flowVersion),1);
  for(const [width,height]of [[320,568],[375,812]]){
   await page.setViewportSize({width,height});
   await page.evaluate(()=>{titleScreenOpen=false;gameState.campaign={...gameState.campaign,phase:'room',requiredVisit:null};gameState.cats[0]={...getCat(gameState),named:true,name:'こむぎ',status:'raising'};gameState.onboarding={...gameState.onboarding,status:'done',appIntro:'prompt',homeTour:null};gameState.ui={...gameState.ui,modal:null,layoutMode:false};render(gameState)});
   await page.click('[data-action="open-notebook"]');
   for(const step of ['profile','vitals','calendar','pay','close','play','clean','food','items']){await page.waitForFunction(step=>gameState.onboarding.homeTour===step,step);await page.click(step==='close'?'.home-phone-close':'[data-home-tour-next]');}
   assert.equal(await page.locator('.room-preparation.folded').count(),1);
   assert(await page.evaluate(()=>app.scrollHeight<=app.clientHeight+1));
   await page.screenshot({path:`tests/screenshots/published-room-${width}.png`});
  }
  assert.deepEqual(errors,[]);console.log('PASS password entry, current bundled UI, first-activity start, app/care walkthrough and room at both sizes');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
