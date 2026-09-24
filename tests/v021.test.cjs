const {chromium}=require('playwright'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url'),path=require('node:path');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const p=await browser.newPage({viewport:{width:375,height:812}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(pathToFileURL(path.resolve('index.html')).href);
 await p.evaluate(()=>{titleScreenOpen=false;gameState.onboarding.status='done';gameState.campaign.phase='room';gameState.cats[0].status='raising';gameState.cats[0].name='テスト';gameState.ui.equippedHand='starter_toy';gameState.ui.equippedFood='starter_food';gameState.ui.equippedCleaner='starter_clean';gameState.cats[0].body.hair=Array.from({length:15},(_,i)=>({id:'sample'+i,x:12+i*4,y:70+i%4*4}));render(gameState);});
 assert.equal(await p.locator('.lift-tip').count(),3);assert.equal(await p.locator('.main-command strong').count(),0);assert.equal(await p.locator('.shed-hair svg').count(),15);
 const result=await p.evaluate(()=>{
  let s=structuredClone(gameState);for(let i=0;i<5;i++)s=reduceGameState(s,{type:'FINISH_PLAY',itemId:'starter_toy'});
  if(s.inventory.starter_toy!==1||getDurability(s,'starter_toy')!==1)throw Error('toy depleted');
  for(const [operation,foodId,key] of [['food','starter_food','foodLevel'],['water','water_refill','waterLevel'],['food','food_dry','foodLevel']]){
   s.cats[0].body[key]=0;s.ui.careAnimation={id:100,operation,foodId};const old=s.inventory[foodId];s=reduceGameState(s,{type:'FINISH_CARE',id:100});
   if(s.cats[0].body[key]!== (foodId==='food_dry'?50:25))throw Error('portion '+foodId);
   if(s.inventory[foodId]!== (foodId==='food_dry'?old-.5:1))throw Error('stock '+foodId);
  }
  s.ui.careAnimation={id:101,operation:'hair',cleanerId:'starter_clean',hairId:s.cats[0].body.hair[0].id};const count=s.cats[0].body.hair.length;s=reduceGameState(s,{type:'FINISH_CARE',id:101});if(s.cats[0].body.hair.length!==count-1||s.inventory.starter_clean!==1)throw Error('clean');
  saveGameState(s);return true;
 });assert.ok(result);
 const call=p.locator('[data-action="call-cat"]');await call.hover();await p.mouse.down();await p.waitForTimeout(200);assert.equal(await call.evaluate(n=>n.classList.contains('hold-charging')),true);await p.mouse.move(1,1);await p.mouse.up();assert.equal(await p.locator('.hold-charging').count(),0);
 await p.screenshot({path:'tests/screenshots/v021-room.png'});
 for(const width of [320,375,430]){await p.setViewportSize({width,height:812});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 await p.reload();assert.equal(await p.evaluate(()=>gameState.inventory.starter_clean),1);assert.deepEqual(errors,[]);console.log('PASS v021: compact SVG controls, charge, varied hair, unlimited starters, paid stock, save');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
