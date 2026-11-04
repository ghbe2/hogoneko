const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {openGame}=require('./helpers/game-page.cjs');
(async()=>{const b=await chromium.launch({channel:'chrome'});try{for(const [width,height] of [[320,568],[375,812]]){
 const p=await b.newPage({viewport:{width,height},isMobile:true,hasTouch:true}),errors=[];p.on('pageerror',e=>errors.push(e.message));p.setDefaultTimeout(6500);
 await openGame(p,'room');
 await p.evaluate(()=>{titleScreenOpen=false;gameState.onboarding={status:'done',guide:null,homeTour:'done'};const c=getCat(gameState);Object.assign(c,{name:'こむぎ',named:true,status:'raising',age:'adult',surgery:{status:'done',completedDay:5},heart:95,returnTutorial:false,carePlan:{version:2,surgeryDay:5,eventDay:7,notices:{'event:7':true}}});Object.assign(c.body,{days:6,weight:2247,sick:false});gameState.campaign={...gameState.campaign,phase:'town',shopId:null,adoptionRun:null,requiredVisit:null};Object.assign(gameState.ui,{modal:null,alphaNotice:null,alphaMailbox:false});gameState.alpha={firstCatId:'prior',seen:{}};gameState.coins=0;render(gameState)});
 await p.locator('.town-destination.event').tap();await p.waitForFunction(()=>gameState.campaign.shopId==='plaza'&&!guideNavigationBusy);
 await p.locator('[data-action="go-event"]').tap();await p.waitForFunction(()=>gameState.campaign.adoptionRun?.status==='playing'&&!guideNavigationBusy);
 assert(!await p.locator('.adoption-panel').isVisible());
 const at=async(sec,i)=>p.evaluate(([sec,i])=>{const run=gameState.campaign.adoptionRun;run.startedAt=Date.now()-sec*1000;if(run.familyIndex!==i){run.familyIndex=i;render(gameState)}paintAdoption(adoptionView,performance.now())},[sec,i]);
 for(const i of [0,1,3]){
  await at(6,i);const steps=await p.evaluate(()=>{
   const n=adoptionView.walkers[adoptionView.familyIndex];
   const legs=()=>[...n.querySelectorAll('.visitor-shaped-legs')].map(g=>g.innerHTML);
   adoptionPosition(n,80,false,true,22,1);const before=legs();adoptionPosition(n,100,false,true,42,1);
   return legs().map((m,j)=>m!==before[j]);
  });assert(steps.length&&steps.every(Boolean),'each person steps '+i+' '+steps);
  await at(32.45,i);await p.waitForTimeout(400);await p.evaluate(()=>render(gameState));await p.waitForTimeout(250);
  const family=p.locator('.adoption-person.adoption-carrying');assert(await family.isVisible());assert(await family.locator('.adoption-main .adoption-head').isVisible());await p.screenshot({path:'tests/screenshots/hall-handoff-'+width+'-'+i+'.png'});
  await at(35,i);assert.equal(await family.locator('.adoption-held-cat').evaluate(n=>getComputedStyle(n).opacity),'1');
 }
 await at(41.8,1);await p.waitForFunction(()=>gameState.campaign.adoptionRun.status==='done');await p.waitForTimeout(850);assert(await p.locator('.adoption-person.adoption-carrying').isVisible());
 assert.match(await p.locator('#adoption-next').innerText(),/こむぎに別れを告げる/);await p.screenshot({path:'tests/screenshots/hall-farewell-'+width+'.png'});
 await p.locator('#adoption-next').tap();await p.waitForFunction(()=>gameState.campaign.phase==='room'&&!guideNavigationBusy);
 await p.locator('[data-alpha-mail="open"]').tap();await p.locator('[data-alpha-family-read]').first().tap();await p.locator('[data-family="claim"]').tap();
 assert(await p.locator('.family-letter').isVisible());await p.waitForTimeout(450);await p.evaluate(()=>dispatch({type:'FAMILY_CLOSE'}));assert.equal(await p.locator('.alpha-mailbox').count(),0);
 await p.waitForSelector('.alpha-mailbox');assert.equal(await p.evaluate(()=>gameState.coins),10);
 await p.locator('[data-alpha-family-read]').first().tap();await p.locator('[data-family="ad"]').tap();await p.waitForSelector('.alpha-gift-reveal');
 await p.waitForSelector('.alpha-mailbox');assert.equal(await p.evaluate(()=>gameState.coins),20);
 await p.evaluate(()=>{const run=gameState.campaign.adoptionRun;const cat=getCat(gameState);cat.name='そら';cat.status='tnr';cat.rescueArea='a1';gameState.campaign={...gameState.campaign,phase:'result',adoptionRun:{...run,status:'done',outcome:'tnr',catId:cat.id},tnrRelease:null};gameState.ui={...gameState.ui,alphaMailbox:false,familyLetterOpen:false,alphaAlbumPrompt:false};render(gameState)});
 await p.locator('[data-adoption-action="HOME_FROM_ADOPTION"]').tap();await p.waitForSelector('.tnr-field');assert(await p.locator('[data-release="TNR_OPEN"]').isVisible());
 assert.deepEqual(errors,[]);console.log('PASS',width,'families, handover, centred goodbye, original and bonus gifts');await p.close();
 }}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
