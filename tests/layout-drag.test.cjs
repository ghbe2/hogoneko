const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
 const page=await browser.newPage({viewport:{width:375,height:667},hasTouch:true,isMobile:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
 const setup=async phase=>page.evaluate(phase=>{
   titleScreenOpen=false;gameState.campaign.phase=phase;
   // 通常の受け入れ完了後は呼びかけ済みフラグが残る。その実データで検証する。
   gameState.campaign.intakeCalled=phase==='room';
   gameState.cats[0].types=['chase','ambush'];gameState.cats[0].name='はる';
   gameState.ui.layoutMode=true;gameState.ui.layoutTrayOpen=true;gameState.ui.guideExpanded=false;
   gameState.rooms[0].floor=[];gameState.rooms[0].wall=[];render(gameState);
 },phase);
 const pos=async id=>page.evaluate(id=>getPlaced(getRoom(gameState)).find(p=>p.itemId===id)||null,id);
 const drag=async(selector,x,y)=>{
   const box=await page.locator(selector).boundingBox();assert(box,selector);
   await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();
   await page.mouse.move(x,y,{steps:15});await page.mouse.up();
 };
 for(const phase of ['intake','room']){
   await setup(phase);
   const stage=await page.locator('.stage').boundingBox();const floorY=stage.y+stage.height*.82;
   await page.locator('.layout-palette-item[data-item="box"]').click();assert.equal(await pos('box'),null,'Tap must not place');
   await drag('.layout-palette-item[data-item="box"]',120,floorY);
   assert(await pos('box'));assert.equal(await page.locator('.layout-edge-palette').count(),1);
   const first=await pos('box');
   await drag('[data-layout-item="box"]',210,floorY-15);assert.notDeepEqual(await pos('box'),first);
   const moved=await pos('box');
   await drag('[data-layout-item="box"]',170,stage.y+100);assert.deepEqual(await pos('box'),moved,'Invalid wall drop changed floor item');
   await drag('[data-layout-item="box"]',340,stage.y+140);assert.equal(await pos('box'),null,'Storage failed');
   await page.locator('.layout-palette-item[data-item="shelf"]').scrollIntoViewIfNeeded();
   await drag('.layout-palette-item[data-item="shelf"]',170,floorY);assert.equal(await pos('shelf'),null,'Wall item placed on floor');
   await drag('.layout-palette-item[data-item="shelf"]',170,stage.y+200);assert(await pos('shelf'));
   const beforeCancel=await pos('shelf');const shelf=await page.locator('[data-layout-item="shelf"]').boundingBox();
   await page.mouse.move(shelf.x+10,shelf.y+10);await page.mouse.down();await page.mouse.move(90,stage.y+150,{steps:6});
   await page.locator('#app').dispatchEvent('pointercancel');await page.mouse.up();assert.deepEqual(await pos('shelf'),beforeCancel);
   await page.waitForTimeout(380);await page.locator('[data-action="toggle-layout-tray"]').click();
   const toggle=await page.locator('.layout-tray-toggle').boundingBox();
   await drag('[data-layout-item="shelf"]',toggle.x+toggle.width/2,toggle.y+toggle.height/2);assert.equal(await pos('shelf'),null,'Closed storage failed');
   assert.deepEqual(await page.locator('.stage').boundingBox(),stage,'Room dimensions changed');
   assert.equal(await page.locator('.layout-drag-preview').count(),0);
 }
 // 実際のタッチ入力で縦スクロールと横につかみ出す動作を確認。
 await setup('intake');
 await page.evaluate(()=>{const list=document.querySelector('.layout-edge-scroll');for(let i=0;i<20;i++)list.appendChild(list.firstElementChild.cloneNode(true));});
 const cdp=await page.context().newCDPSession(page);
 const touch=async(type,x,y)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y}]});
 let cell=await page.locator('.layout-palette-item[data-item="box"]').first().boundingBox();
 await touch('touchStart',cell.x+25,cell.y+28);await touch('touchMove',cell.x+25,cell.y-65);await touch('touchEnd');
 assert(await page.locator('.layout-edge-scroll').evaluate(el=>el.scrollTop)>0,'Touch list did not scroll');
 assert.equal(await pos('box'),null);
 await page.locator('.layout-edge-scroll').evaluate(el=>el.scrollTop=0);
 cell=await page.locator('.layout-palette-item[data-item="box"]').first().boundingBox();
 await touch('touchStart',cell.x+25,cell.y+28);await touch('touchMove',cell.x-30,cell.y+28);await touch('touchMove',150,500);
 require('node:fs').mkdirSync(path.join(__dirname,'screenshots'),{recursive:true});
 await page.screenshot({path:path.join(__dirname,'screenshots/layout-drag.png')});
 await touch('touchEnd');
 assert(await pos('box'),'Touch drag did not place');
 await page.reload();await page.locator('[data-action="start-game"]').click();assert(await pos('box'),'Placement not saved');
 assert.equal(errors.length,0,errors.join('\n'));
 console.log('PASS intake/room: place, move, store open/closed, invalid drop, cancel, touch scrolling/dragging, save, stable room size');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
