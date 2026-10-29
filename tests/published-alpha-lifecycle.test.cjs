const {chromium}=require('playwright'),assert=require('node:assert/strict');
// The initial fixture represents a healthy fourth-day cat. All subsequent navigation,
// booking, date advances, surgery, event, reward and album actions use visible controls.
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{for(const width of [320,375]){
 const p=await b.newPage({viewport:{width,height:width===320?568:812}}),errors=[];p.setDefaultTimeout(15000);p.on('pageerror',e=>errors.push(e.message));
 try{
 await p.goto((process.env.GAME_URL||'https://ghbe2.github.io/hogoneko/')+'?check=1&scenario=room');await p.fill('#password',process.env.MOCK_VIEW_PASSWORD);await p.click('#enter');await p.waitForFunction(()=>typeof alphaGoal==='function');
 await p.evaluate(()=>{titleScreenOpen=false;const c=getCat(gameState);Object.assign(c,{status:'raising',named:true,name:'こむぎ',age:'adult',initialAge:'adult',heart:90,recoveryUntilDay:0,surgery:null,carePlan:{version:2,surgeryDay:null,eventDay:null,notices:{}}});Object.assign(c.body,{days:3,weight:3100,sick:false,foodLevel:2,waterLevel:100,realNeglectTicks:{}});gameState.alpha={firstCatId:c.id,seen:{food:true,taste:true,reward:true}};gameState.onboarding={status:'done',homeTour:'done',appIntro:null};gameState.ui={...gameState.ui,alphaNotice:null,modal:null,layoutMode:false};gameState.campaign={...gameState.campaign,phase:'room',requiredVisit:null};gameState.realClock={version:1,processedAt:gameNow(),dayTicks:0};gameState.coins=30;dispatch({type:'ALPHA_BOOT'});});
 const click=async s=>{await p.waitForFunction(()=>!guideNavigationBusy&&!app.querySelector('[data-reading="true"]'));await p.click(s);await p.waitForFunction(()=>!guideNavigationBusy);};
 const notices=async()=>{for(let i=0;i<15&&await p.locator('[data-alpha-notice-next]').count();i++)await click('[data-alpha-notice-next]');};
 const snap=async name=>{await p.screenshot({path:`tests/screenshots/published-life-${width}-${name}.png`});console.log(width,name,await p.evaluate(()=>({phase:gameState.campaign.phase,day:getCat(gameState).body.days+1,coins:gameState.coins,weight:getCat(gameState).body.weight})));assert(await p.evaluate(()=>app.scrollHeight<=app.clientHeight+1));};
 await snap('visit-ready');await notices();assert(await p.locator('.home-phone').isVisible());
 await click('[data-action="book-surgery"]');await snap('booking');await click('[data-care-booking="confirm"]');
 assert.equal(await p.evaluate(()=>carePlan(getCat(gameState)).surgeryDay),5);assert.equal(await p.evaluate(()=>getCat(gameState).body.foodLevel),0);
 await click('.home-phone-close');await click('[data-hours="24"]');await snap('visit-surgery');await notices();
 await click('.town-destination.clinic');await click('[data-action="go-surgery"]');await snap('consult');const before=await p.evaluate(()=>gameState.coins);
 await click('[data-action="start-surgery"]');await p.waitForTimeout(4100);await snap('snip');await p.waitForFunction(()=>getCat(gameState).surgery?.status==='done');
 assert.equal(await p.evaluate(()=>gameState.coins),before-10);assert.equal(await p.evaluate(()=>getCat(gameState).body.surgeryFoodStored),undefined);await snap('receipt');await click('[data-action="leave-surgery-clinic"]');
 await click('[data-hours="24"]');await snap('eve');await notices();await click('[data-hours="24"]');await snap('visit-event');await notices();
 await click('.town-destination.event');await click('[data-action="go-event"]');await snap('event');
 if(await p.locator('#adoption-next').isVisible())await click('#adoption-next');
 await p.waitForTimeout(12000);await snap('visitors');await p.waitForFunction(()=>gameState.campaign.adoptionRun?.status==='done',null,{timeout:55000});await snap('result');
 await click('[data-adoption-action="HOME_FROM_ADOPTION"]');
 if(await p.locator('.tnr-field').count()){await click('[data-release="TNR_OPEN"]');await p.waitForFunction(()=>gameState.campaign.tnrRelease.done);await snap('release');await click('[data-adoption-action="HOME_FROM_ADOPTION"]');}
 else {await snap('letter');await click('[data-family="claim"]');await p.waitForTimeout(2300);await click('[data-family="ad"]');await p.waitForFunction(()=>pendingFamilyLetter(gameState).bonusClaimed);await snap('gift');await click('[data-family="close"]');await click('[data-alpha-album]');await click('.home-phone [data-action="open-album"]');await snap('album');await click('[data-app-album-close]');await click('.home-phone-close');}
 await snap('home');assert.deepEqual(errors,[]);console.log('PASS HTTPS lifecycle',width);await p.close();
 }catch(e){console.log('FAIL UI',await p.locator('body').innerText());await p.screenshot({path:'tests/screenshots/published-life-failure.png'});throw e;}
}}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
