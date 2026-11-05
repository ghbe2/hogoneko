const {chromium,webkit}=require('playwright'),assert=require('node:assert/strict'),{openGame}=require('./helpers/game-page.cjs');
(async()=>{for(const engine of [chromium,webkit]){const b=await engine.launch(engine===chromium?{channel:'chrome'}:{});try{const p=await b.newPage({viewport:{width:375,height:812},hasTouch:true,isMobile:true});await openGame(p,'field');await p.evaluate(()=>{titleScreenOpen=false;gameState.onboarding={status:'done'};gameState.campaign={...gameState.campaign,fieldFood:'food_wet',trapWaiting:false,trapReady:false};gameState.inventory.food_wet=3;render(gameState)});await p.waitForFunction(()=>!guideNavigationBusy);
 await p.evaluate(()=>{
 const source=app.querySelector('.encounter-trap'),r=source.getBoundingClientRect(),scene=app.querySelector('[data-field-drop=scene]').getBoundingClientRect();
 const emit=(type,id,x,y)=>{const t={identifier:id,target:source,clientX:x,clientY:y},e=new Event(type,{bubbles:true,cancelable:true});Object.defineProperties(e,{touches:{value:type==='touchend'?[]:[t]},changedTouches:{value:[t]}});source.dispatchEvent(e);};
 emit('touchstart',1,r.x+50,r.y+30);
 if(!fieldDragDraft)throw Error('First contact did not start');
 const firstDraft=fieldDragDraft;
 emit('touchstart',1,r.x+50,r.y+30);
 if(fieldDragDraft===firstDraft)throw Error('Reused touch identifier did not recover');
 // Simulate a fresh contact after the OS lost touchend, without blur.
 emit('touchstart',2,r.x+50,r.y+30);
 if(fieldTouchId!==2)throw Error('Fresh contact was ignored after missing touchend');
 if(document.querySelectorAll('.field-drag-ghost').length!==1)throw Error('Duplicate cage ghost');
 emit('touchmove',2,scene.x+scene.width*.5,scene.y+scene.height*.55);
 emit('touchend',2,scene.x+scene.width*.5,scene.y+scene.height*.55);
 if(!gameState.campaign.trapWaiting||fieldTouchId!==null||fieldDragDraft!==null)throw Error('Retry did not complete cleanly');
 });assert.equal(await p.locator('.field-drag-ghost').count(),0);console.log('PASS',engine.name(),'missing touchend -> new contact -> trap placement');}finally{await b.close()}}})().catch(e=>{console.error(e);process.exitCode=1});
