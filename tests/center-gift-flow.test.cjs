const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {openGame}=require('./helpers/game-page.cjs');
(async()=>{
 const b=await chromium.launch({channel:'chrome'});
 try{for(const [width,height,round] of [[320,568,2],[375,812,3]]){
  const p=await b.newPage({viewport:{width,height},hasTouch:true,isMobile:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await openGame(p,'room');await p.evaluate(round=>{
   titleScreenOpen=false;gameState.album=Array.from({length:round-1},(_,i)=>({catId:'old-'+i,outcome:'adopted',name:'はな'}));
   gameState.alpha={...gameState.alpha,firstCatId:'old-0',taste:null};
   gameState.onboarding={flowVersion:1,status:'active',guide:'callFirst',appIntro:'prompt',homeTour:'play'};
   gameState.campaign.phase='shop';gameState.campaign.shopId='plaza';getCat(gameState).status='raising';
   gameState.ui={...gameState.ui,modal:null,alphaNotice:null,alphaMailbox:false};
   saveGameState(gameState);
  },round);
  await p.reload();await p.evaluate(()=>{titleScreenOpen=false;render(gameState)});
  assert.equal(await p.evaluate(()=>gameState.onboarding.guide),null);
  assert.equal(await p.evaluate(()=>gameState.onboarding.homeTour),'done');
  await p.locator('[data-center="taste"]').tap();
  assert.equal(await p.locator('[data-alpha-taste-close]').count(),0);
  await p.waitForSelector('.alpha-taste.choosing');
  assert.equal(await p.locator('.alpha-taste h2').innerText(),'これが好きかも？');
  const button=p.locator('[data-alpha-gift]').first(),id=await button.getAttribute('data-alpha-gift');
  const before=await p.evaluate(id=>gameState.inventory[id]||0,id);
  await button.tap();assert(await p.locator('.packing-toy').isVisible());assert(await p.locator('.alpha-taste').isVisible());
  await p.waitForTimeout(500);await p.evaluate(()=>render(gameState));
  assert(await p.locator('.packing-toy').isVisible());
  await p.waitForSelector('.alpha-taste',{state:'detached'});assert(await p.locator('[data-center="taste"]').isVisible());
  assert.equal(await p.evaluate(id=>gameState.inventory[id],id),before+1);
  assert.deepEqual(errors,[]);console.log('PASS round',round,'saved guide cleanup, observe, choose, pack, reception');await p.close();
 }}finally{await b.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
