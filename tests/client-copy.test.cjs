const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{const b=await chromium.launch({channel:'chrome'});try{const errors=[];
for(const [width,height]of [[320,568],[375,812]]){
const p=await b.newPage({reducedMotion:'reduce'});p.on('pageerror',e=>errors.push(e.message));
await p.setViewportSize({width,height});await p.goto(pathToFileURL(path.resolve('index.html')).href+'?check=1');await p.evaluate(()=>localStorage.clear());await p.reload();await p.waitForTimeout(700);
assert.equal(await p.locator('.tsuguneko-logo').count(),1);assert(await p.locator('.tsuguneko-logo').evaluate(n=>n.complete&&n.naturalWidth>0));await p.screenshot({path:'tests/screenshots/client-title-'+width+'.png'});
await p.click('[data-action="start-game"]');await p.waitForTimeout(4000);
for(let i=0;i<7;i++){assert.equal(await p.evaluate(()=>gameState.onboarding.storyIndex),i);await p.waitForFunction(()=>!document.querySelector('.introduction-next').disabled);assert(await p.locator('.introduction-speech p').evaluate(n=>n.scrollHeight<=n.clientHeight+1));if(i===4)await p.screenshot({path:'tests/screenshots/client-intro-'+width+'.png'});await p.click('.introduction-next');}
await p.waitForTimeout(200);assert.notEqual(await p.evaluate(()=>gameState.campaign.phase),'story');
await p.evaluate(()=>{TOWN_TUTORIAL.home.copy+='これからどんな子との出会いが待っているのか、楽しみです。';render(gameState);});await p.waitForFunction(()=>document.querySelector('[data-copy-page]')&&!document.querySelector('[data-copy-page]').disabled);const step=await p.evaluate(()=>gameState.onboarding.townStep);await p.click('[data-copy-page]');assert.equal(await p.evaluate(()=>gameState.onboarding.townStep),step);await p.waitForTimeout(1100);
await p.evaluate(()=>{gameState.onboarding.status='done';gameState.onboarding.homeTour='done';gameState.campaign.phase='shop';gameState.campaign.shopId='plaza';gameState.ui.modal=null;render(gameState);});
await p.click('[data-center="senior"]');await p.screenshot({path:'tests/screenshots/client-questions-'+width+'.png'});
assert.equal(await p.locator('[data-center-question]').count(),7);await p.click('[data-center-question="1"]');
while(await p.locator('[data-center-next]').count()){await p.waitForFunction(()=>!document.querySelector('[data-center-next]').disabled);assert(await p.locator('.senior-review p').evaluate(n=>n.scrollHeight<=n.clientHeight+1));await p.click('[data-center-next]');}
await p.click('[data-center-close]');await p.click('[data-center="taste"]');await p.click('[data-center-question="5"]');assert(await p.locator('.senior-review').count());
assert(await p.evaluate(()=>app.scrollHeight<=app.clientHeight+1));
await p.goto(pathToFileURL(path.resolve('index.html')).href+'?check=1&scenario=room');
await p.evaluate(()=>{titleScreenOpen=false;gameState.onboarding={status:'done',homeTour:'done',appIntro:null};gameState.campaign.phase='room';gameState.campaign.requiredVisit=null;gameState.ui={...gameState.ui,centerReview:null,modal:null,layoutMode:false};const c=getCat(gameState);c.status='raising';c.surgery=null;c.carePlan={version:2,surgeryDay:null,eventDay:null,notices:{}};c.body.foodLevel=0;c.body.hunger=1;delete c.body.surgeryFoodStored;render(gameState);});
await p.click('.placed-item.item-bowl');assert(await p.evaluate(()=>gameState.ui.careAnimation?.operation==='food'||getCat(gameState).body.foodLevel>0));
await p.close();
}
assert.deepEqual(errors,[]);console.log('PASS: logo, all intro pages, Q&A list/answer/return, personal hints, smartphone bounds');}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
