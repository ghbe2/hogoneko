const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const {openGame}=require('./helpers/game-page.cjs');
(async()=>{
 for(const [engine,launcher] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await launcher.launch(engine==='chromium'?{channel:'chrome'}:{});
  try{for(const [width,height] of [[320,568],[375,812]]){
   // Reuse the real first-journey save, rather than bypassing onboarding with a room fixture.
   const storage=JSON.parse(fs.readFileSync(`tests/screenshots/published-care-state-${process.env.CARE_SAVE_WIDTH||width}.json`,'utf8'));
   const entries=storage.localStorageEntries||storage.origins.flatMap(o=>o.localStorage);assert(entries.length,'The journey save must include localStorage (file URLs are omitted by storageState).');
   const page=await browser.newPage({viewport:{width,height},hasTouch:true,isMobile:true});
   await page.addInitScript(entries=>{for(const e of entries)localStorage.setItem(e.name,e.value)},entries);
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await openGame(page);await page.locator('[data-action="start-game"]').tap();
   await page.waitForFunction(()=>!guideNavigationBusy);
   await page.locator('[data-room-fold]').tap();await page.waitForTimeout(350);
   await page.locator('[data-command="food"]').tap();
   if(!process.env.GAME_URL)assert.match(await page.locator('.room-food-menu .sheet-head small').innerText(),/お皿を押す/);
   await page.locator('[data-action="equip-food"][data-food="food_dry"]').tap();
   assert.equal(await page.evaluate(()=>gameState.ui.modal),null);
   const before=await page.evaluate(()=>getCat(gameState).body.foodLevel);
   await page.locator('.item-bowl').tap();
   await page.waitForFunction(before=>getCat(gameState).body.foodLevel>before,before);
   assert.equal(await page.locator('.command-ghost').count(),0);
   await page.locator('[data-command="cat"]').tap();
   await page.locator('[data-action="select-hand"][data-item="starter_toy"]').tap();
   assert.equal(await page.evaluate(()=>gameState.ui.equippedHand),'starter_toy');
   await page.locator('[data-command="clean"]').tap();
   await page.locator('[data-action="equip-cleaner"][data-cleaner="starter_clean"]').tap();
   assert.equal(await page.evaluate(()=>gameState.ui.equippedCleaner),'starter_clean');
   await page.locator('.room-call-icon').tap();
   assert.equal(await page.locator('.room-call-feedback').innerText(),'こむぎ');
   assert.deepEqual(errors,[]);
   await page.screenshot({path:`tests/screenshots/care-entry-touch-${engine}-${width}.png`});
   console.log('PASS',engine,width,'touch food selection/refill, toy/cleaner selection, call');
   await page.close();
  }}finally{await browser.close();}
 }
})().catch(e=>{console.error(e);process.exitCode=1});
