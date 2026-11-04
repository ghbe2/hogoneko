const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const {openGame}=require('./helpers/game-page.cjs');
(async()=>{
 const b=await chromium.launch({channel:'chrome'});
 try{for(const [width,height] of [[320,568],[375,812]]){
  const p=await b.newPage({viewport:{width,height},hasTouch:true,isMobile:true});
  await openGame(p,'intake');
  await p.evaluate(()=>{
   titleScreenOpen=false;
   gameState.album=[{catId:'previous',outcome:'adopted',name:'はな'}];
   gameState.flags.firstCatWelcomed=true;
   gameState.onboarding={status:'done',guide:null,homeTour:'done'};
   gameState.campaign.phase='intake';gameState.campaign.intakeCalled=false;
   Object.assign(getCat(gameState),{status:'intake',named:true,name:'こまめ'});
   Object.assign(gameState.ui,{layoutMode:false,layoutTrayOpen:false,modal:null});
   render(gameState);
  });
  await p.locator('[data-action="toggle-layout"]').first().tap();
  await p.locator('[data-action="toggle-layout-tray"]').first().tap();
  assert(await p.locator('.layout-library').isVisible());
  await p.locator('.furniture-close').tap();await p.locator('.layout-done').tap();
  const call=p.locator('.intake-footer-call');
  await call.tap();assert.equal(await p.locator('.room-call-feedback').innerText(),'こまめ');
  console.log('PASS real layout entry, library, done, call',width);await p.close();
 }}finally{await b.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
