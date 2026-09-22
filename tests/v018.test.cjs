const {chromium}=require('playwright');
const assert=require('node:assert/strict'),path=require('node:path');
const {pathToFileURL}=require('node:url');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:375,height:667},hasTouch:true,isMobile:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
 await page.evaluate(()=>{titleScreenOpen=false;gameState.campaign.phase='room';gameState.onboarding.status='done';gameState.cats[0].status='raising';gameState.cats[0].name='はる';gameState.cats[0].types=['human'];gameState.ui.guideExpanded=false;render(gameState);});
 for(const [width,height] of [[375,667],[320,568],[390,844]]){
  await page.setViewportSize({width,height});
  const main=await page.locator('.main-command-row').boundingBox(),sub=await page.locator('.sub-command-row').boundingBox(),stage=await page.locator('.stage').boundingBox();
  assert.equal(await page.locator('.main-command').count(),3);assert.equal(await page.locator('.sub-command').count(),2);
  assert(sub.y+sub.height<main.y);assert(sub.height<main.height*.7);assert(main.x>=0&&main.x+main.width<=width);
  assert((await page.locator('.sub-command-row').innerText()).includes('さわる'));assert(!(await page.locator('.command-dock').innerText()).includes('ふれあい'));
  assert(await page.locator('.sub-command strong').evaluateAll(nodes=>nodes.every(n=>n.scrollWidth<=n.clientWidth)), 'Sub labels truncated');
  const previous=await page.evaluate(()=>JSON.stringify([gameState.ui.equippedHand,gameState.ui.equippedFood,gameState.ui.equippedCleaner,gameState.ui.touchMode]));
  for(const tab of ['play','food','clean','touch']){
   console.log('open',width,tab);
   await page.locator(`.command-dock [data-tab="${tab}"]`).tap();
   const close=page.locator('.sheet-close');await close.waitFor();
   const rect=await close.boundingBox();assert(rect.y>=0&&rect.y+rect.height<=height,'close button off-screen');
   await close.tap();assert.equal(await page.evaluate(()=>gameState.ui.modal),null);
   assert.equal(await page.evaluate(()=>JSON.stringify([gameState.ui.equippedHand,gameState.ui.equippedFood,gameState.ui.equippedCleaner,gameState.ui.touchMode])),previous);
   assert.deepEqual(await page.locator('.stage').boundingBox(),stage,'Room was resized');
  }
 }
 await page.setViewportSize({width:375,height:812});await page.screenshot({path:'tests/screenshots/v018-room.png'});
 await page.locator('.command-dock [data-tab="food"]').tap();await page.waitForTimeout(350);await page.screenshot({path:'tests/screenshots/v018-menu.png'});await page.locator('.sheet-close').tap();
 const call=await page.locator('[data-action="call-cat"]').boundingBox();await page.mouse.move(call.x+20,call.y+20);await page.mouse.down();await page.waitForTimeout(700);await page.mouse.up();await page.waitForTimeout(450);await page.locator('.sheet-close').tap();assert.equal(await page.evaluate(()=>gameState.ui.modal),null);
 // Empty inventories and a scrolled, large inventory must retain the same exit.
 await page.evaluate(()=>{gameState.inventory.mouse=0;dispatch({type:'OPEN_SLOT_MENU',tab:'play'});});await page.locator('.sheet-close').tap();
 await page.evaluate(()=>{dispatch({type:'OPEN_SLOT_MENU',tab:'food'});const list=document.querySelector('.inventory-grid');for(let i=0;i<100;i++)list.append(list.firstElementChild.cloneNode(true));list.scrollTop=list.scrollHeight;});await page.locator('.sheet-close').tap();assert.equal(await page.evaluate(()=>gameState.ui.modal),null);
 assert.deepEqual(errors,[]);console.log('PASS v018: 3 viewport sizes, main/sub hierarchy, all slot exits, nickname exit, empty/100-item list, unchanged equipment/room size');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
