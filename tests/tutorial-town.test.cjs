const {chromium}=require('playwright'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url'),path=require('node:path');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{const p=await browser.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));const url=pathToFileURL(path.resolve('index.html')).href;
for(const [width,height] of [[320,568],[375,812]]){
 await p.setViewportSize({width,height});await p.goto(url+'?check=1&scenario=event');
 await p.evaluate(()=>{titleScreenOpen=false;gameState.onboarding={status:'active',storyIndex:2};gameState.campaign={...gameState.campaign,phase:'story',captured:false,requiredVisit:null};getCat(gameState).status='candidate';dispatch({type:'NEXT_STORY'})});
 assert.equal(await p.evaluate(()=>gameState.campaign.phase),'town');
 for(const step of ['home','swipe','area','goal','rescue']){
  await p.waitForFunction(s=>gameState.onboarding.townStep===s,step);
  await p.waitForTimeout(60);
  assert(await p.evaluate(()=>{const a=app.getBoundingClientRect(),n=document.querySelector('.tutorial-note').getBoundingClientRect(),r=document.querySelector('.tutorial-ring').getBoundingClientRect();return n.top>=a.top&&n.bottom<=a.bottom&&n.left>=a.left&&n.right<=a.right&&(n.bottom<=r.top||n.top>=r.bottom)}),step+' geometry');
  await p.screenshot({path:`tests/screenshots/tutorial-town-${width}-${step}.png`});
  if(step==='swipe'){await p.locator('.town-map-scroll').hover();await p.mouse.wheel(0,-160);await p.waitForTimeout(1000)}
  else if(step!=='rescue')await p.locator('.tutorial-note button').click();
 }
 await p.evaluate(()=>saveGameState(gameState));await p.goto(url+'?check=1');await p.evaluate(()=>{titleScreenOpen=false;render(gameState)});
 assert.equal(await p.evaluate(()=>gameState.onboarding.townStep),'rescue');
 assert(await p.locator('.tutorial-note').isVisible());
 await p.locator('.town-area.field .town-area-go').click();assert.equal(await p.evaluate(()=>gameState.campaign.phase),'field');assert.equal(await p.locator('.tutorial-focus').count(),0);
}
assert.deepEqual(errors,[]);console.log('PASS town tutorial: real swipe, both sizes, target/panel separation, reload resume');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
