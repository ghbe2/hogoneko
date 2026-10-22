const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{for(const [width,height]of [[320,568],[375,812]]){const p=await b.newPage({viewport:{width,height}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(pathToFileURL(path.resolve('index.html')).href+'?check=1&scenario=intro');await p.click('[data-action="start-game"]');
 const boxes=[];
 for(let i=0;i<3;i++){await p.waitForFunction(()=>{const b=document.querySelector('.introduction-next');return b&&!b.disabled&&!guideNavigationBusy});boxes.push(await p.evaluate(()=>{const box=s=>{const r=app.querySelector(s).getBoundingClientRect();return [r.x,r.y,r.width,r.height];};return {note:box('.shared-guide-note'),portrait:box('.first-senior'),copy:box('.shared-guide-note p'),next:box('.introduction-next')};}));await p.screenshot({path:`tests/screenshots/guide-${width}-intro-${i}.png`});await p.click('.introduction-next');}
 assert.deepEqual(boxes[0],boxes[1]);assert.deepEqual(boxes[1],boxes[2]);assert.equal(boxes[0].next[2],112);assert.equal(boxes[0].next[3],44);
 for(const key of ['healthCommand','surgeryCommand','firstCommand']){
  await p.evaluate(key=>{titleScreenOpen=false;gameState.onboarding={...gameState.onboarding,status:'active',flowVersion:1,guide:key,townStep:'done'};gameState.campaign={...gameState.campaign,phase:'shop',shopId:'clinic',clinicReception:true};getCat(gameState).status='captured';gameState.ui={...gameState.ui,modal:null};render(gameState);},key);
  await p.waitForFunction(()=>!guideNavigationBusy&&app.querySelector('[data-reading="false"]'));
  assert.equal(await p.locator('.shared-guide-note').evaluate(n=>n.getBoundingClientRect().height),210);
  if(key!=='firstCommand'){
   assert(await p.locator('.first-guide-ring').isVisible());const next=await p.locator('.shared-guide-note button').boundingBox();assert.equal(next.width,112);assert.equal(next.height,44);
  }else{
   assert(await p.locator('.guide-gesture[data-kind="tap"]').isVisible());
   const fraction=await p.evaluate(()=>{const r=app.querySelector('[data-first="exam"]').getBoundingClientRect(),h=app.querySelector('.guide-gesture').getBoundingClientRect();return (h.left+21-r.left)/r.width;});assert(Math.abs(fraction-.64)<.02);
   await p.locator('.guide-gesture').evaluate(n=>n.getAnimations({subtree:true}).forEach(a=>{a.pause();a.currentTime=450}));
  }
  await p.screenshot({path:`tests/screenshots/guide-${width}-${key}.png`});
 }
 await p.evaluate(()=>{gameState.flags.starterBought=true;gameState.inventory.food_dry=1;gameState.inventory.food_wet=1;getCat(gameState).status='candidate';gameState.campaign={...gameState.campaign,phase:'field',trapPlaced:false,trapWaiting:false,fieldFood:'food_wet',area:'a1'};gameState.onboarding.guide='bait';render(gameState)});await p.waitForFunction(()=>!guideNavigationBusy&&app.querySelector('[data-reading="false"]'));assert(await p.locator('.guide-gesture[data-kind="swipe"]').isVisible());
 const samples=[];for(const t of [400,1300]){samples.push(await p.locator('.guide-hand').evaluate((n,t)=>{const a=n.getAnimations()[0];a.pause();a.currentTime=t;return getComputedStyle(n).transform;},t));}assert.notEqual(samples[0],samples[1]);await p.screenshot({path:`tests/screenshots/guide-${width}-swipe.png`});
 assert.deepEqual(errors,[]);console.log('PASS',width,'shared intro/page geometry, fixed next control, restored clinic focus, inset hand and animated swipe');await p.close();
 }}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
