const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{for(const [width,height]of [[320,568],[375,812]]){
  const p=await browser.newPage({viewport:{width,height}}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));p.setDefaultTimeout(10000);
  await p.goto(pathToFileURL(path.resolve('index.html')).href+'?check=1&scenario=room');
  await p.evaluate(()=>{
   titleScreenOpen=false;gameState.onboarding={status:'done',flowVersion:1,guide:null,homeTour:'done',appIntro:null};
   gameState.ui={...gameState.ui,modal:null,layoutMode:false,scheduleIntro:false};
   const c=getCat(gameState);Object.assign(c,{status:'captured',age:'adult',rescueProfile:{condition:'illness',heart:30},surgery:null,recoveryUntilDay:0});
   Object.assign(c.body,{days:0,weight:1873,sick:true});
   gameState.campaign={...gameState.campaign,phase:'clinic',clinicStep:'summary',firstExamAt:null,initialVisitPaidCatId:null};
   gameState.coins=10;gameState.realClock={version:1,processedAt:gameNow(),dayTicks:0};render(gameState);
  });
  const invoice=await p.evaluate(()=>initialExamInvoice(getCat(gameState)));
  assert.deepEqual(invoice.rows.map(r=>r.cost),[3,3,4,20]);assert.equal(invoice.total,30);
  assert.match(await p.locator('[data-first="pay"]').textContent(),/-20/);
  assert(await p.locator('[data-first="pay"]').isEnabled());
  const fits=()=>p.evaluate(()=>{const a=app.getBoundingClientRect();const nodes=[...app.querySelectorAll('.first-chart,.first-profile,.first-receipt,[data-first="pay"],.home-phone,.app-pay,.surgery-sheet,.surgery-actions,.store-footer')];return {noScroll:app.scrollHeight<=app.clientHeight+1,bounds:nodes.every(n=>{const r=n.getBoundingClientRect();return r.left>=a.left-1&&r.right<=a.right+1&&r.top>=a.top-1&&r.bottom<=a.bottom+1}),text:nodes.every(n=>n.scrollHeight<=n.clientHeight+1)};});
  await p.screenshot({path:`tests/screenshots/medical-debt-${width}-invoice.png`});
  assert(Object.values(await fits()).every(Boolean),JSON.stringify(await fits()));
  await p.click('[data-first="pay"]');await p.waitForFunction(()=>!guideNavigationBusy);
  assert.equal(await p.evaluate(()=>gameState.coins),-20);
  assert.equal(await p.evaluate(()=>gameState.economy.ledger.at(-1).amount),30);
  await p.evaluate(()=>dispatch({type:'PAY_FIRST_EXAM'}));assert.equal(await p.evaluate(()=>gameState.coins),-20);
  const scenarios=await p.evaluate(()=>{
   const fixture=()=>{const s=structuredClone(gameState),c=getCat(s);s.coins=10;s.campaign={...s.campaign,phase:'clinic',clinicStep:'summary',initialVisitPaidCatId:null};c.status='captured';return s;};
   const results={};for(const condition of [null,'thin','injury','illness']){const s=fixture();getCat(s).rescueProfile={condition,heart:30};const n=reduceGameState(s,{type:'PAY_FIRST_EXAM'});results[condition||'healthy']=n.coins;}
   return results;
  });assert.deepEqual(scenarios,{healthy:0,thin:-4,injury:-12,illness:-20});
  // A negative balance persists, and care is not gated by money.
  await p.evaluate(()=>{const c=getCat(gameState);c.status='raising';c.name='こむぎ';c.body.sick=false;c.body.weight=1873;c.recoveryUntilDay=0;gameState.flags.starterBought=true;gameState.campaign.phase='room';gameState.ui.modal='notebook';gameState=ensureStarterSupplies(gameState);saveGameState(gameState);history.replaceState({},'',location.pathname+'?check=1');render(gameState);});
  await p.waitForFunction(()=>!guideNavigationBusy);await p.screenshot({path:`tests/screenshots/medical-debt-${width}-app.png`});
  assert.match(await p.locator('.app-pay').textContent(),/未払い.*-20/s);assert(Object.values(await fits()).every(Boolean),JSON.stringify(await fits()));
  await p.reload();await p.evaluate(()=>{titleScreenOpen=false;gameState.ui.modal='notebook';render(gameState)});assert.equal(await p.evaluate(()=>gameState.coins),-20);
  await p.click('[data-app-reward]');await p.waitForFunction(()=>!gameState.ui.appRewardStarted);assert.equal(await p.evaluate(()=>gameState.coins),5);
  await p.evaluate(()=>{gameState.coins=-16;}); // Independently exercise continued treatment while in debt.
  // Re-enter the clinic through actual buttons while in debt, and treat once.
  await p.click('.home-phone-close');await p.click('.room-travel-icon');await p.waitForFunction(()=>!guideNavigationBusy);
  await p.click('[data-action="open-map-shop"][data-shop="clinic"]');await p.waitForFunction(()=>!guideNavigationBusy);
  await p.evaluate(()=>{getCat(gameState).body.sick=true;render(gameState)});await p.click('[data-clinic="examine"]');
  await p.click('[data-action="treat-cat"]');assert.equal(await p.evaluate(()=>getCat(gameState).body.sick),false);assert.equal(await p.evaluate(()=>gameState.coins),-28);
  await p.evaluate(()=>dispatch({type:'TREAT_CAT'}));assert.equal(await p.evaluate(()=>gameState.coins),-28);
  // The surgery button must remain a surgery action, never become a wallet gate.
  await p.evaluate(()=>{const c=getCat(gameState);Object.assign(c,{surgery:null,recoveryUntilDay:0,carePlan:{version:2,surgeryDay:5,eventDay:null,notices:{}}});Object.assign(c.body,{days:4,weight:2103,sick:false});gameState.campaign={...gameState.campaign,phase:'shop',shopId:'clinic',clinicReception:false,medicalStage:'consult'};render(gameState);});
  assert(await p.locator('[data-action="start-surgery"]').isEnabled());
  await p.waitForFunction(()=>!guideNavigationBusy);await p.click('[data-action="start-surgery"]');await p.waitForFunction(()=>!guideNavigationBusy);assert.equal(await p.evaluate(()=>gameState.coins),-40);
  await p.evaluate(()=>dispatch({type:'START_SURGERY'}));assert.equal(await p.evaluate(()=>gameState.coins),-40);
  await p.waitForFunction(()=>getCat(gameState).surgery?.status==='done');assert(Object.values(await fits()).every(Boolean),JSON.stringify(await fits()));
  await p.screenshot({path:`tests/screenshots/medical-debt-${width}-surgery.png`});
  // Buying is denied, but existing infinite care items remain usable.
  const checks=await p.evaluate(()=>{
   let s=structuredClone(gameState);s.campaign={...s.campaign,phase:'room'};s.ui={...s.ui,modal:null};const c=getCat(s);c.surgery=null;c.carePlan={version:2,surgeryDay:null,eventDay:null,notices:{}};delete c.body.surgeryFoodStored;c.body.foodLevel=0;s.coins=-40;
   let care=reduceGameState(s,{type:'START_CARE',operation:'food',foodId:'food_dry'});const started=!!care.ui.careAnimation;if(started)care=reduceGameState(care,{type:'FINISH_CARE',id:care.ui.careAnimation.id});
   const careAllowed=started&&getCat(care).body.foodLevel>0&&care.coins===-40;
   s.campaign={...s.campaign,phase:'shop',shopId:'petshop'};s.ui={...s.ui,storeCartOpen:true,shopCart:{food_wet:1},storeThanks:false};const before=JSON.stringify(s.inventory);let denied=reduceGameState(s,{type:'CHECKOUT_SHOP'});
   const purchaseBlocked=denied.coins===-40&&JSON.stringify(denied.inventory)===before&&!denied.ui.storeThanks;
   s.coins=5;const paid=reduceGameState(s,{type:'CHECKOUT_SHOP'});const purchaseRestored=paid.coins===0&&paid.ui.storeThanks;
   s.coins=-1;s.campaign={...s.campaign,phase:'town'};c.status='candidate';const blocked=reduceGameState(s,{type:'CHOOSE_AREA',area:'a1'});s.coins=10;const allowed=reduceGameState(s,{type:'CHOOSE_AREA',area:'a1'});
   return {careAllowed,purchaseBlocked,purchaseRestored,rescueBlocked:blocked.campaign.phase==='town'&&blocked.ui.modal==='wallet',rescueAllowed:allowed.campaign.phase==='field'};
  });assert(Object.values(checks).every(Boolean),JSON.stringify(checks));
  await p.evaluate(()=>{gameState.campaign={...gameState.campaign,phase:'shop',shopId:'petshop'};gameState.ui={...gameState.ui,modal:null,storeCartOpen:true,shopCart:{food_wet:1},storeThanks:false};render(gameState)});
  assert(await p.locator('[data-store="checkout"]').isDisabled());assert(Object.values(await fits()).every(Boolean),JSON.stringify(await fits()));
  await p.screenshot({path:`tests/screenshots/medical-debt-${width}-shop.png`});
  const graduation=await p.evaluate(()=>{const s=structuredClone(gameState),c=getCat(s);s.coins=-40;s.ui={...s.ui,modal:null,storeThanks:false};s.flags.returnedCat=true;Object.assign(c,{status:'raising',heart:80,age:'adult',surgery:{status:'done',completedDay:5},carePlan:{version:2,surgeryDay:5,eventDay:7,notices:{}}});Object.assign(c.body,{days:6,weight:2200,sick:false});s.campaign={...s.campaign,phase:'graduation',adoptionRun:null};const n=reduceGameState(s,{type:'BEGIN_ADOPTION'});return {status:n.campaign.adoptionRun?.status,coins:n.coins};});
  assert.deepEqual(graduation,{status:'playing',coins:-40});
  assert.deepEqual(errors,[]);console.log('PASS',width,'initial invoice, overdraft treatment/surgery, persistence, reward repayment, buying restrictions and free care');await p.close();
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
