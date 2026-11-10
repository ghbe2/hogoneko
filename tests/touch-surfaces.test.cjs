const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const {openGame}=require('./helpers/game-page.cjs'),{touchGesture}=require('./helpers/touch-gesture.cjs');
async function room(p){await openGame(p,'room');await p.evaluate(()=>{
 titleScreenOpen=false;gameState.onboarding={status:'done',guide:null,homeTour:'done',appIntro:null};
 gameState.alpha={...gameState.alpha,albumExplained:true,firstCatId:'previous',mail:[]};
 gameState.campaign={...gameState.campaign,phase:'room',requiredVisit:null};
 gameState.ui={...gameState.ui,modal:null,alphaNotice:null,alphaMailbox:false,layoutMode:false,layoutTrayOpen:false,appPhoto:null};
 for(const id of [...CONFIG.stage1.placedItems,...CONFIG.stage1.handItems,...CONFIG.stage1.foods.map(x=>x.id),...CONFIG.stage1.cleaners.map(x=>x.id)])gameState.inventory[id]=20;
 render(gameState);
});await p.waitForFunction(()=>!guideNavigationBusy);}
async function scroll(p,g,selector){
 const el=p.locator(selector),r=await el.boundingBox(),before=await el.evaluate(e=>e.scrollTop);
 assert(await el.evaluate(e=>e.scrollHeight>e.clientHeight+10),selector+' must contain a long list');
 await g.move(r.x+r.width*.55,r.y+r.height*.8);await g.down();await g.move(r.x+r.width*.55,r.y+r.height*.2,{steps:12});await g.up();await p.waitForTimeout(300);
 assert(await el.evaluate(e=>e.scrollTop)>before+10,selector+' touch scroll');
}
async function fixed(p,selector,prior){const r=await p.locator(selector).boundingBox();assert(r,'fixed control exists');const size=p.viewportSize();assert(r.y>=48&&r.y+r.height<=size.height+1&&r.x>=0&&r.x+r.width<=size.width+1,'control on screen');if(prior)for(const k of ['x','y','width','height'])assert(Math.abs(prior[k]-r[k])<1,'scroll must not move '+selector);return r;}
const cases={
 async inventory(p,g){for(const tab of ['play','clean','food']){
  if(tab==='food'){await p.locator('[data-room-fold]').tap();await p.waitForTimeout(400);}
  await p.locator(`[data-action="open-slot-menu"][data-tab="${tab}"]`).tap();
  // Long-list stress fixture: repeat real cards, without adding fake product logic.
  await p.locator('.inventory-grid').evaluate(e=>{const originals=[...e.children];while(e.children.length<120)for(const n of originals)e.append(n.cloneNode(true));});
  const close=await fixed(p,'.room-supplies-menu [data-action="close-modal"]');
  const equipped=await p.evaluate(()=>[gameState.ui.equippedHand,gameState.ui.equippedCleaner,gameState.ui.equippedFood]);
  await scroll(p,g,'.inventory-grid');assert.deepEqual(await p.evaluate(()=>[gameState.ui.equippedHand,gameState.ui.equippedCleaner,gameState.ui.equippedFood]),equipped,'scroll does not select/drag an item');
  assert.equal(await p.locator('.command-ghost').count(),0);await fixed(p,'.room-supplies-menu [data-action="close-modal"]',close);
  if(tab==='play'){
   const point=await p.locator('.inventory-grid').evaluate(grid=>{const r=grid.getBoundingClientRect();const cell=[...grid.children].find(e=>{const c=e.getBoundingClientRect();return Math.min(c.bottom,r.bottom)-Math.max(c.top,r.top)>30&&c.left<r.left+r.width/2});const c=cell.getBoundingClientRect();return {x:c.x+c.width/2,y:(Math.max(c.top,r.top)+Math.min(c.bottom,r.bottom))/2};});
   await g.move(point.x,point.y);await g.down();await g.move(point.x+55,point.y,{steps:8});assert.equal(await p.locator('.command-ghost').count(),1,'horizontal movement still carries a tool');await g.cancel();assert.equal(await p.locator('.command-ghost').count(),0,'cancel removes carried tool');assert(await p.locator('.room-supplies-menu').isVisible(),'cancel restores inventory');
  }
  await p.screenshot({path:`tests/screenshots/touch-surfaces-${p.viewportSize().width}-${tab}.png`});
  await p.locator('.room-supplies-menu [data-action="close-modal"]').tap();assert.equal(await p.evaluate(()=>gameState.ui.modal),null);
 }},
 async shop(p,g){await p.evaluate(()=>{gameState.campaign={...gameState.campaign,phase:'shop',shopId:'petshop'};gameState.ui={...gameState.ui,shopTab:'furniture',storeDetail:null,storeCartOpen:false};render(gameState)});await p.waitForFunction(()=>!guideNavigationBusy);
  const before=await p.evaluate(()=>JSON.stringify(storeCart(gameState)));await scroll(p,g,'.store-list');assert.equal(await p.evaluate(()=>gameState.ui.storeDetail),null,'scroll does not open product');assert.equal(await p.evaluate(()=>JSON.stringify(storeCart(gameState))),before);
  await p.screenshot({path:`tests/screenshots/touch-surfaces-${p.viewportSize().width}-shop.png`});
  await p.locator('.room-travel-icon').tap();await p.waitForFunction(()=>gameState.campaign.phase==='town'&&!guideNavigationBusy);
 },
 async furniture(p,g){await p.locator('[data-action="toggle-layout"]').tap();await p.locator('[data-action="toggle-layout-tray"]').tap();const close=await fixed(p,'.furniture-close');const before=await p.evaluate(()=>JSON.stringify(getPlaced(getRoom(gameState))));await scroll(p,g,'.furniture-grid');assert.equal(await p.evaluate(()=>JSON.stringify(getPlaced(getRoom(gameState)))),before,'scroll does not place furniture');await fixed(p,'.furniture-close',close);await p.locator('.furniture-close').tap();
  const item=p.locator('[data-layout-item="box"]'),r=await item.boundingBox();assert(r,'fixture has box');
  await g.move(r.x+r.width/2,r.y+r.height/2);await g.down();await g.move(r.x+r.width/2+15,r.y+r.height/2-20,{steps:6});
  assert.equal(await p.locator('.layout-store-target').getAttribute('data-state'),'drag');await g.cancel();await p.waitForTimeout(300);assert.equal(await p.evaluate(()=>JSON.stringify(getPlaced(getRoom(gameState)))),before,'cancel preserves furniture');assert.equal(await p.locator('.layout-drag-preview').count(),0);
  const rr=await item.boundingBox();await g.move(rr.x+rr.width/2,rr.y+rr.height/2);await g.down();await g.move(rr.x+rr.width/2+12,rr.y+rr.height/2-20,{steps:5});const target=await p.locator('.layout-store-target').boundingBox();await g.move(target.x+target.width/2,target.y+target.height/2,{steps:10});assert.equal(await p.locator('.layout-store-target').getAttribute('data-state'),'over');await p.screenshot({path:`tests/screenshots/touch-surfaces-${p.viewportSize().width}-store.png`});await g.up();assert.equal(await item.count(),0);await p.locator('[data-action="undo-furniture"]').tap();assert.equal(await item.count(),1);await p.locator('.layout-done').tap();assert.equal(await p.evaluate(()=>gameState.ui.layoutMode),false);
 },
 async album(p,g){await p.evaluate(()=>{const c=getCat(gameState);gameState.album=Array.from({length:30},(_,i)=>({...c,catId:'test'+i,name:'ねこ'+i,outcome:'adopted',phenotype:phenotypeFor(c)}));gameState.ui.modal='notebook';dispatch({type:'OPEN_ALBUM'})});
  const close=await fixed(p,'[data-app-album-close]');await scroll(p,g,'.album-photo-list');await fixed(p,'[data-app-album-close]',close);assert.equal(await p.locator('.app-photo-view').count(),0,'list swipe must not open photo');
  const id=await p.locator('.album-photo-list').evaluate(list=>{const r=list.getBoundingClientRect();return [...list.querySelectorAll('[data-app-photo]')].find(e=>{const b=e.getBoundingClientRect();return b.top>=r.top&&b.bottom<=r.bottom})?.dataset.appPhoto;});assert(id);await p.locator(`[data-app-photo="${id}"]`).tap();
  const back=await fixed(p,'[data-app-photo-close]');const swipe=async reverse=>{const r=await p.locator('.app-photo-view figure').boundingBox();await g.move(r.x+r.width*(reverse?.25:.75),r.y+r.height*.35);await g.down();await g.move(r.x+r.width*(reverse?.75:.25),r.y+r.height*.35,{steps:10});await g.up();};
  for(let i=1;i<=5;i++){await swipe(false);assert.equal(await p.evaluate(()=>gameState.ui.appPhotoFrame),i);await fixed(p,'[data-app-photo-close]',back);}
  await swipe(true);assert.equal(await p.evaluate(()=>gameState.ui.appPhotoFrame),4);
  {const r=await p.locator('.app-photo-view figure').boundingBox();await g.move(r.x+r.width*.75,r.y+r.height*.3);await g.down();await g.addFinger(r.x+r.width*.5,r.y+r.height*.65);await g.removeFinger();await g.move(r.x+r.width*.25,r.y+r.height*.3,{steps:10});await g.up();assert.equal(await p.evaluate(()=>gameState.ui.appPhotoFrame),5,'a second finger must not replace the active photo swipe');await swipe(true);}
  const r=await p.locator('.app-photo-view figure').boundingBox();await g.move(r.x+r.width*.7,r.y+r.height*.3);await g.down();await g.move(r.x+r.width*.3,r.y+r.height*.3,{steps:5});await g.cancel();assert.equal(await p.evaluate(()=>gameState.ui.appPhotoFrame),4,'cancel cannot switch photo');await swipe(false);assert.equal(await p.evaluate(()=>gameState.ui.appPhotoFrame),5,'retry after cancel');
  await p.screenshot({path:`tests/screenshots/touch-surfaces-${p.viewportSize().width}-photo.png`});await p.locator('[data-app-photo-close]').tap();assert.equal(await p.evaluate(()=>gameState.ui.modal),'album');await p.locator('[data-app-album-close]').tap();assert.equal(await p.evaluate(()=>gameState.ui.modal),'notebook');
 }
};
(async()=>{const b=await chromium.launch({channel:'chrome'}),results=[];try{for(const [width,height] of [[320,568],[375,812]])for(const [name,test] of Object.entries(cases).filter(([name])=>!process.env.TOUCH_CASE||name===process.env.TOUCH_CASE)){
 const p=await b.newPage({viewport:{width,height},hasTouch:true,isMobile:true}),errors=[];p.setDefaultTimeout(10000);p.on('pageerror',e=>errors.push(e.message));
 try{await room(p);const g=await touchGesture(p);await test(p,g);assert.deepEqual(errors,[]);assert(await p.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1),'no whole-page scroll');results.push({width,name,passed:true});console.log('PASS',width,name);}
 catch(e){results.push({width,name,passed:false,error:e.message});console.log('FAIL',width,name,e.message);await p.screenshot({path:`tests/screenshots/touch-surfaces-${width}-${name}-failure.png`}).catch(()=>{});}
 finally{await p.close();}
 }fs.writeFileSync(`tests/screenshots/touch-surfaces-${process.env.TOUCH_CASE||'all'}-report.json`,JSON.stringify(results,null,2));assert(results.every(r=>r.passed),'touch surface failures');}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
