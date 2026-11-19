const{chromium}=require('playwright'),assert=require('node:assert/strict'),{openGame}=require('./helpers/game-page.cjs');
(async()=>{const b=await chromium.launch({channel:'chrome'});try{for(const [width,height]of [[320,568],[375,812]]){const p=await b.newPage({viewport:{width,height},hasTouch:true,isMobile:true});await openGame(p,'room');
 await p.evaluate(()=>{titleScreenOpen=false;gameState.onboarding={...gameState.onboarding,status:'active',flowVersion:1,homeTour:'done',appIntro:null};gameState.alpha={...gameState.alpha,firstCatId:getCat(gameState).id};gameState.album=[];gameState.ui={...gameState.ui,modal:null,alphaNotice:null,alphaMailbox:false};});
 for(const [phase,guide]of [['town','clinicScroll'],['clinic','healthy'],['intake','homeHello'],['intake','layout']]){
  await p.evaluate(({phase,guide})=>{getCat(gameState).status=phase==='intake'?'intake':'captured';gameState.campaign={...gameState.campaign,phase,clinicStep:'summary',requiredVisit:null};gameState.onboarding.guide=guide;gameState.onboarding.guideEnteredAt=Date.now()-10000;render(gameState)},{phase,guide});
  await p.waitForTimeout(3200);await p.waitForSelector('.first-guide-note');
  const fit=await p.locator('.first-guide-note').evaluate(n=>{const r=n.getBoundingClientRect(),a=app.getBoundingClientRect();return r.top>=a.top&&r.bottom<=a.bottom&&r.left>=a.left&&r.right<=a.right});assert(fit,guide+' dialogue fits');
  if(guide==='layout'){const hit=await p.locator('[data-action="toggle-layout"]').evaluate(n=>{const r=n.getBoundingClientRect();return n.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))});assert(hit,'furniture button is not behind dialogue');}
  if(guide==='clinicScroll'){
   await p.evaluate(()=>{app.querySelector('.town-scroll-hint.is-down').hidden=true});await p.waitForTimeout(80);assert(await p.locator('.guide-gesture').isHidden(),'hidden arrow must not put finger at top-left');
  }
  await p.screenshot({path:`tests/screenshots/external-${guide}-${width}.png`});
  if(guide==='healthy'){await p.locator('[data-first="next"]').tap();await p.waitForTimeout(250);assert.equal(await p.locator('.first-guide-note').count(),0);assert(await p.locator('.first-chart h1').isVisible());await p.screenshot({path:`tests/screenshots/external-chart-readable-${width}.png`});}
 }
 await p.evaluate(()=>{gameState.ui.firstName=true;gameState.campaign.nameDraft='';render(gameState)});assert(await p.locator('[data-first="name"]').isDisabled());await p.locator('.first-name input').fill('こむぎ');assert(await p.locator('[data-first="name"]').isEnabled());assert.equal(await p.locator('.first-name input').getAttribute('maxlength'),'8');
 await p.screenshot({path:`tests/screenshots/external-name-${width}.png`});console.log('PASS',width,'dialogues, hidden arrow, furniture hit target, naming limit and empty state');await p.close();
}}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
