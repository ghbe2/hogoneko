const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {openGame}=require('./helpers/game-page.cjs');
const {touchGesture}=require('./helpers/touch-gesture.cjs');
(async()=>{
 const browser=await chromium.launch({channel:'chrome'});
 try{for(const [width,height] of [[320,568],[375,812]]){
  const p=await browser.newPage({viewport:{width,height},hasTouch:true,isMobile:true});
  p.setDefaultTimeout(6000);
  const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await openGame(p,'room');
  await p.evaluate(()=>{
   titleScreenOpen=false;gameState.onboarding={status:'done',guide:null,homeTour:'done'};
   gameState.ui={...gameState.ui,modal:null,alphaNotice:null,alphaMailbox:false,layoutMode:false,catFocus:null};
   catLifeCues=[];gameState.dailyDiscovery={};getCat(gameState).types=['solo','hide'];getCat(gameState).heart=30;
   render(gameState);
  });
  const g=await touchGesture(p);
  const point=()=>p.locator('.cat-object').evaluate(n=>{const r=n.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}});
  const start=await point(),coins=await p.evaluate(()=>gameState.coins);
  await g.move(start.x,start.y);await g.down();await g.up();
  await p.waitForFunction(c=>gameState.coins>c,coins);
  assert.equal(await p.evaluate(()=>gameState.ui.careAnimation?.mode==='pet'),false);
  const after=await point();assert(Math.hypot(start.x-after.x,start.y-after.y)<4,'coin position jumped');
  await p.evaluate(()=>{
   const node=app.querySelector('.cat-object'),from=visibleRoomCatPoint(node);
   animateFelineTravel(node,from,{...from,x:from.x<50?80:20});
  });
  await p.waitForTimeout(250);
  const pre=await point();await p.locator('.room-icon-menu [data-action="toggle-layout"]').tap();
  const post=await point();assert(Math.hypot(pre.x-post.x,pre.y-post.y)<15,'layout position jumped '+JSON.stringify({pre,post}));
  await p.locator('.layout-done').tap();
  const r=await point();await g.move(r.x,r.y);await g.down();await g.move(r.x+24,r.y-24,{steps:4});
  await p.waitForFunction(()=>CatRoomHold.active?.phase==='escape');
  await p.evaluate(()=>{
   window.escapeFrames=[];function sample(){const node=app.querySelector('.cat-object'),svg=node?.querySelector('.game-cat-svg');escapeFrames.push(!!svg&&!!svg.querySelector('path')&&svg.getBoundingClientRect().width>0);if(escapeFrames.length<60)requestAnimationFrame(sample)}sample();
   render(gameState);
  });
  await g.up();await p.waitForFunction(()=>escapeFrames.length===60&&!CatRoomHold.active);
  assert(await p.evaluate(()=>escapeFrames.every(Boolean)),'empty cat during escape');
  for(const mode of ['pet','comb','wipe']){
   await p.evaluate(mode=>{
    const cat=getCat(gameState);cat.types=['solo','hide'];cat.heart=30;
    gameState.ui.touchMode=mode;gameState.inventory.groom_comb=2;gameState.inventory.groom_wipe=2;
    catLifeCues=[];gameState.ui.careAnimation=null;render(gameState);
   },mode);
   const petAt=await point();await g.move(petAt.x,petAt.y);await g.down();await g.up();
   await p.waitForFunction(mode=>gameState.ui.careAnimation?.mode===mode,mode);
   await p.waitForFunction(()=>!gameState.ui.careAnimation&&gameState.ui.playRestPoint?.escapeHop);
   await p.waitForTimeout(850);
  }
  await p.evaluate(()=>{getCat(gameState).heart=75;gameState.ui.touchMode='pet';catLifeCues=[];render(gameState)});
  const liftStart=await point();await g.move(liftStart.x,liftStart.y);await g.down();await g.move(liftStart.x+25,liftStart.y-20,{steps:4});
  await p.waitForFunction(()=>CatRoomHold.active?.phase==='land');
  await p.evaluate(()=>{
   render(gameState);window.heldFrames=[];function sample(){const cat=app.querySelector('.cat-object .game-cat-svg');heldFrames.push(!!cat&&cat.getBoundingClientRect().width>0);if(heldFrames.length<80)requestAnimationFrame(sample)}sample();
  });
  await g.up();await p.waitForFunction(()=>heldFrames.length===80&&!CatRoomHold.active);
  assert(await p.evaluate(()=>heldFrames.every(Boolean)),'missing after lift/escape');
  await p.screenshot({path:'tests/screenshots/room-continuity-'+width+'.png'});
  assert.deepEqual(errors,[]);console.log('PASS',width,'coin instead of pet, mid-walk layout, visible escape across redraw');
  await p.close();
 }}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
