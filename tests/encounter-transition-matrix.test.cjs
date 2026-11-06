const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {openGame}=require('./helpers/game-page.cjs');
const {touchGesture}=require('./helpers/touch-gesture.cjs');

const inputs=['single swipe','short swipe 22px','reverse then swipe','tap dry then swipe','hold midway'];
const transitions=['immediate','late snap','focus loss','rerender','reload saved progress'];
const placements=['centre','tap then left edge','cancel then right edge','rerender while dragging'];
const cases=inputs.flatMap(input=>transitions.flatMap(transition=>placements.map(placement=>({input,transition,placement}))));
const output='tests/screenshots/encounter-matrix';
fs.mkdirSync(output,{recursive:true});

async function runCase(p,c) {
 await openGame(p,'field');
 await p.evaluate(()=>{
  history.replaceState({},'',location.pathname+'?check=1');
  titleScreenOpen=false;
  gameState.onboarding={...gameState.onboarding,status:'active',flowVersion:1,guide:'bait',guideEnteredAt:Date.now()-6000};
  gameState.inventory.food_dry=0;gameState.inventory.food_wet=1;
  gameState.campaign.fieldFood='food_dry';
  render(gameState);
 });
 await p.waitForFunction(()=>!guideNavigationBusy&&document.querySelector('.first-guide'));
 const g=await touchGesture(p), rail=await p.locator('.bait-carousel').boundingBox();
 const x=rail.x+rail.width*.60,y=rail.y+35;
 async function swipe(dx,hold=false){
  await g.move(x,y);await g.down();await g.move(x-dx/2,y);
  if(hold){await p.waitForTimeout(600);assert.equal(await p.evaluate(()=>gameState.onboarding.guide),'bait');}
  await g.move(x-dx,y);await g.up();
 }
 if(c.input==='reverse then swipe')await swipe(-42);
 if(c.input==='tap dry then swipe')await p.touchscreen.tap(rail.x+rail.width/2,y);
 await swipe(c.input==='short swipe 22px'?22:108,c.input==='hold midway');
 await p.waitForFunction(()=>gameState.onboarding.guide==='trap',null,{timeout:2200});
 if(c.transition==='late snap')await p.evaluate(()=>{const r=document.querySelector('.bait-carousel');r.scrollLeft=0;r.dispatchEvent(new Event('scroll'));});
 if(c.transition==='focus loss')await p.evaluate(()=>window.dispatchEvent(new Event('blur')));
 if(c.transition==='rerender')await p.evaluate(()=>render(gameState));
 if(c.transition==='reload saved progress'){
  await p.reload();await p.waitForFunction(()=>typeof gameState!=='undefined');
  const start=p.locator('[data-action=start-game]');
  if(await start.isVisible())await start.tap();
  await p.waitForFunction(()=>!guideNavigationBusy&&document.querySelector('.first-guide')&&document.querySelector('.encounter-trap'));
 }
 const trap=p.locator('.encounter-trap');
 assert(await trap.isEnabled(),'committed bait must enable the trap');
 const box=await trap.boundingBox(),cx=box.x+box.width/2,cy=box.y+box.height/2;
 if(c.placement==='tap then left edge'){await p.touchscreen.tap(cx,cy);assert.equal(await p.evaluate(()=>gameState.campaign.trapWaiting),false);}
 if(c.placement==='cancel then right edge'){
  await g.move(cx,cy);await g.down();await g.move(cx,cy-18);await g.cancel();
  assert.equal(await p.locator('.field-drag-ghost').count(),0);
 }
 await g.move(cx,cy);await g.down();
 assert.equal(await p.locator('.field-drag-ghost').count(),1,'actual screen coordinates must pick up cage');
 const scene=await p.locator('[data-field-drop=scene]').boundingBox();
 const targetX=scene.x+(c.placement.includes('left')?58:c.placement.includes('right')?scene.width-58:scene.width/2);
 await g.move(targetX,scene.y+scene.height*.55,{steps:3});
 if(c.placement==='rerender while dragging')await p.evaluate(()=>render(gameState));
 await g.up();
 assert(await p.evaluate(()=>gameState.campaign.trapWaiting),'release must place trap');
 assert.equal(await p.evaluate(()=>gameState.inventory.food_wet),0,'consume once');
 assert.equal(await p.locator('.field-drag-ghost').count(),0);
 const position=await p.evaluate(()=>gameState.campaign.trapPosition);
 assert(Number.isFinite(position.x)&&Number.isFinite(position.y)&&position.x>=0&&position.x<=100&&position.y>=0&&position.y<=100,'finite position in scene');
 const ready=p.locator('[data-action=open-trap]');
 await ready.waitFor({timeout:9000});
 await p.waitForFunction(()=>document.querySelector('.first-guide')&&!document.querySelector('[data-reading="true"],[data-copy-pending="true"]')&&gameState.onboarding.guide==='trapReady',null,{timeout:9000});
 await ready.tap();
 await p.waitForFunction(()=>gameState.campaign.phase==='trapInspect',null,{timeout:3500});
}
(async()=>{
 const browser=await chromium.launch({channel:'chrome'}),results=[];
 const selected=cases.map((c,i)=>({...c,id:i+1})).filter(c=>!process.env.MATRIX_IDS||process.env.MATRIX_IDS.split(',').includes(String(c.id)));
 let next=0;
 async function worker(){
  while(next<selected.length){
   const c=selected[next++],small=(c.id+Math.floor((c.id-1)/4))%2===0;
   const p=await browser.newPage({viewport:small?{width:320,height:568}:{width:375,height:812},hasTouch:true,isMobile:true});
   const errors=[];p.on('pageerror',e=>errors.push(e.message));
   try{await runCase(p,c);assert.deepEqual(errors,[]);results.push({...c,passed:true});}
   catch(e){const state=await p.evaluate(()=>({guide:gameState.onboarding.guide,food:gameState.campaign.fieldFood,waiting:gameState.campaign.trapWaiting,draft:!!fieldDragDraft})).catch(()=>null);results.push({...c,passed:false,error:e.message,state});console.log('FAIL',c.id,e.message,state);await p.screenshot({path:output+'/fail-'+c.id+'.png'});}
   finally{await p.close();}
  }
 }
 try{await Promise.all(Array.from({length:Math.min(4,selected.length)},worker));}
 finally{await browser.close();}
 results.sort((a,b)=>a.id-b.id);
 fs.writeFileSync(output+'/'+(process.env.MATRIX_IDS?'subset':'full')+'.json',JSON.stringify(results,null,2));
 console.log('PASS',results.filter(x=>x.passed).length,'/',results.length);
 if(results.some(x=>!x.passed))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
