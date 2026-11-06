const {chromium,webkit}=require('playwright'),assert=require('node:assert/strict');
const {openGame}=require('./helpers/game-page.cjs');
async function fixture(p,selected='food_dry'){
 await openGame(p,'field');await p.evaluate(selected=>{titleScreenOpen=false;gameState.onboarding={...gameState.onboarding,status:'active',flowVersion:1,guide:'bait',guideEnteredAt:Date.now()-6000};gameState.inventory.food_wet=1;gameState.inventory.food_dry=0;gameState.campaign={...gameState.campaign,fieldFood:selected,trapWaiting:false,trapReady:false};render(gameState)},selected);
 await p.waitForTimeout(4500);
}
// These are handler-level Touch events, not an iPhone hardware simulation.
// Chrome's trusted multi-touch path is covered separately by bait-mobile-recovery.
async function contact(p,type,points,changed=points){
 return p.evaluate(({type,points,changed})=>{
  const rail=app.querySelector('.bait-carousel'),r=rail.getBoundingClientRect();
  const touch=v=>({identifier:v.id,target:rail,clientX:r.left+r.width/2+v.x,clientY:r.top+35,screenX:r.left+r.width/2+v.x,screenY:r.top+35});
  const e=new Event(type,{bubbles:true,cancelable:true});
  Object.defineProperties(e,{touches:{value:points.map(touch)},targetTouches:{value:points.map(touch)},changedTouches:{value:changed.map(touch)}});
  rail.dispatchEvent(e);
  return {guide:gameState.onboarding.guide,food:gameState.campaign.fieldFood,left:rail.scrollLeft,active:rail.dataset.baitActive,interacted:rail.dataset.baitInteracted};
 },{type,points,changed});
}
(async()=>{for(const engine of [chromium,webkit]){const b=await engine.launch(engine===chromium?{channel:'chrome'}:{});try{
for(const [width,height]of (process.env.BAIT_TOUCH_QUICK?[[393,659]]:[[393,659],[393,852]])){const p=await b.newPage({viewport:{width,height},hasTouch:true,isMobile:true}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await fixture(p);
 await p.evaluate(()=>{guideSpeechCache.clear();render(gameState);if(!app.querySelector('.first-guide[data-reading="true"]'))throw new Error('Expected the bait explanation to be typing');});
 await contact(p,'touchstart',[{id:1,x:45}]);
 assert.equal(await p.locator('.bait-carousel').getAttribute('data-bait-active'),'true','the rail receives a finger placed during the bait explanation');await contact(p,'touchmove',[{id:1,x:-65}]);
 assert.equal(await p.evaluate(()=>gameState.campaign.fieldFood),'food_wet','finger movement changes the choice without native scrolling');
 await p.waitForTimeout(700);assert.equal(await p.evaluate(()=>gameState.onboarding.guide),'bait','held contact cannot advance');
 await contact(p,'touchstart',[{id:1,x:-65},{id:2,x:70}],[{id:2,x:70}]);
 await contact(p,'touchend',[{id:1,x:-65}],[{id:2,x:70}]);assert.equal(await p.evaluate(()=>app.querySelector('.bait-carousel').dataset.baitActive),'true');
 await contact(p,'touchend',[],[{id:1,x:-65}]);await p.waitForFunction(()=>gameState.onboarding.guide==='trap');
 // A late snap can put the rail back on the zero-stock default after the guide advances.
 await p.evaluate(()=>{const rail=app.querySelector('.bait-carousel');rail.scrollLeft=0;rail.dispatchEvent(new Event('scroll'));});
 assert(await p.locator('.encounter-trap').isEnabled(),'late scroll after selection must not disable the only allowed gesture');
 await p.screenshot({path:`tests/screenshots/bait-touch-${engine.name()}-${height}.png`});
 console.log('PASS',engine.name(),height,'Touch-only swipe, held contact, second finger, release');
 await p.waitForFunction(()=>!app.querySelector('[data-reading="true"],[data-copy-pending="true"]'));
 await p.evaluate(()=>{
  const source=app.querySelector('.encounter-trap'),r=source.getBoundingClientRect(),scene=app.querySelector('[data-field-drop="scene"]').getBoundingClientRect();
  const emit=(type,x,y)=>{const t={identifier:91,target:source,clientX:x,clientY:y};const e=new Event(type,{bubbles:true,cancelable:true});Object.defineProperties(e,{touches:{value:type==='touchend'?[]:[t]},changedTouches:{value:[t]}});source.dispatchEvent(e);};
  emit('touchstart',r.x+r.width/2,r.y+r.height/2);
  if(!fieldDragDraft)throw Error('Native touch did not pick up trap');
  if(getComputedStyle(source).visibility==='hidden')throw Error('Touch target hidden');
  emit('touchmove',scene.x+scene.width*.5,scene.y+scene.height*.55);
  emit('touchend',scene.x+scene.width*.5,scene.y+scene.height*.55);
  if(!gameState.campaign.trapWaiting)throw Error('Native touch did not place trap');
 });
 console.log('PASS',engine.name(),height,'touch-only bait followed by trap pickup and placement');
 await fixture(p);await contact(p,'touchstart',[{id:1,x:40}]);await contact(p,'touchmove',[{id:1,x:10}]);
 await contact(p,'touchcancel',[],[{id:1,x:10}]);await p.waitForFunction(()=>gameState.onboarding.guide==='trap');
 assert.equal(await p.evaluate(()=>gameState.campaign.fieldFood),'food_wet');console.log('PASS',engine.name(),height,'short swipe + cancellation snaps to exact item');
 await fixture(p);await p.evaluate(()=>Object.defineProperty(app.querySelector('.bait-carousel'),'scrollLeft',{get:()=>0,set:()=>{}}));
 await contact(p,'touchstart',[{id:1,x:40}]);await contact(p,'touchend',[],[{id:1,x:-70}]);await p.waitForFunction(()=>gameState.onboarding.guide==='trap');
 console.log('PASS',engine.name(),height,'commits swipe even when scrolling does not move the rail');
 await fixture(p,'food_wet');await p.evaluate(()=>saveGameState(gameState));await p.reload();await p.waitForFunction(()=>typeof gameState!=='undefined');await p.evaluate(()=>{titleScreenOpen=false;render(gameState)});await p.waitForTimeout(4500);
 await contact(p,'touchstart',[{id:1,x:0}]);await contact(p,'touchend',[],[{id:1,x:0}]);await p.waitForFunction(()=>gameState.onboarding.guide==='trap');console.log('PASS',engine.name(),height,'resume a saved selected food without starting over');
 await fixture(p);await contact(p,'touchstart',[{id:1,x:0}]);await p.evaluate(()=>window.dispatchEvent(new Event('blur')));assert.equal(await p.evaluate(()=>app.querySelector('.bait-carousel').dataset.baitActive),'false');
 await contact(p,'touchstart',[{id:1,x:40}]);await contact(p,'touchmove',[{id:1,x:-70}]);await contact(p,'touchend',[],[{id:1,x:-70}]);await p.waitForFunction(()=>gameState.onboarding.guide==='trap');assert.deepEqual(errors,[]);console.log('PASS',engine.name(),height,'focus-loss cleanup and retry');
 await fixture(p);await contact(p,'touchstart',[{id:1,x:40}]);await contact(p,'touchmove',[{id:1,x:-70}]);await contact(p,'touchstart',[{id:1,x:0}]);await contact(p,'touchend',[],[{id:1,x:0}]);await p.waitForFunction(()=>gameState.onboarding.guide==='trap');assert.deepEqual(errors,[]);console.log('PASS',engine.name(),height,'new contact recovers a missing previous end event');await p.close();
}
}finally{await b.close()}}})().catch(e=>{console.error(e);process.exitCode=1});
