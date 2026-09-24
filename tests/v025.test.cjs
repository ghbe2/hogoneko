const {chromium}=require('playwright'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url'),path=require('node:path');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const p=await browser.newPage({viewport:{width:375,height:812}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(pathToFileURL(path.resolve('index.html')).href);
 await p.evaluate(()=>{titleScreenOpen=false;gameState.onboarding.status='done';gameState.campaign.phase='room';gameState.cats[0].status='raising';gameState.ui.modal=null;gameState.ui.reaction=null;render(gameState);window.reactionTimers=0;const timeout=window.setTimeout;window.setTimeout=function(fn,ms,...args){if(ms===3400)reactionTimers++;return timeout(fn,ms,...args);};dispatch({type:'EXECUTE_CONTACT',contact:'call'});dispatch({type:'OPEN_SLOT_MENU',tab:'play'});window.originalSheet=app.querySelector('.menu-sheet');window.oldReaction=gameState.ui.reaction?.id;});
 await p.waitForTimeout(4200);
 assert.equal(await p.evaluate(()=>originalSheet===app.querySelector('.menu-sheet')),true);
 assert.equal(await p.evaluate(()=>reactionTimers),1);assert.equal(await p.evaluate(()=>gameState.ui.reaction),null);assert.equal(await p.locator('.reaction,.play-heart-burst').count(),0);
 assert.equal(await p.evaluate(()=>{dispatch({type:'CLEAR_REACTION',id:oldReaction});return originalSheet===app.querySelector('.menu-sheet');}),true);
 // Background-only state changes do not recreate the sheet.
 assert.equal(await p.evaluate(()=>{gameState.cats[0].body.hair.push({id:'background',x:40,y:70});render(gameState);return originalSheet===app.querySelector('.menu-sheet');}),true);
 // Relevant data still updates, without another entrance animation.
 await p.evaluate(()=>{gameState.inventory.mouse=7;render(gameState);});assert.equal(await p.locator('[data-item="mouse"] .stock').textContent(),'×7');assert.equal(await p.locator('.menu-sheet').evaluate(n=>getComputedStyle(n).animationName),'none');
 await p.evaluate(()=>{dispatch({type:'CLOSE_MODAL'});dispatch({type:'OPEN_SLOT_MENU',tab:'play'});});assert.equal(await p.locator('.menu-sheet').evaluate(n=>getComputedStyle(n).animationName),'sheet-up');
 await p.setViewportSize({width:375,height:520});await p.evaluate(()=>{for(const id of CONFIG.stage1.handItems)gameState.inventory[id]=1;render(gameState);app.querySelector('.inventory-grid').scrollTop=85;});
 const scroll=await p.locator('.inventory-grid').evaluate(n=>n.scrollTop);assert.ok(scroll>0);await p.evaluate(()=>{gameState.coins++;render(gameState);});await p.waitForTimeout(60);assert.equal(await p.locator('.inventory-grid').evaluate(n=>n.scrollTop),scroll);await p.setViewportSize({width:375,height:812});
 // Editing survives both reaction expiry and a genuine data refresh.
 await p.evaluate(()=>{dispatch({type:'CLOSE_MODAL'});dispatch({type:'OPEN_NICKNAME'});});await p.locator('#cat-nickname').fill('こむちゃん');await p.locator('#cat-nickname').evaluate(n=>n.setSelectionRange(2,3));
 await p.evaluate(()=>{gameState.coins+=1;render(gameState);});assert.equal(await p.locator('#cat-nickname').inputValue(),'こむちゃん');assert.deepEqual(await p.locator('#cat-nickname').evaluate(n=>[n===document.activeElement,n.selectionStart,n.selectionEnd]),[true,2,3]);
 await p.evaluate(()=>{dispatch({type:'CLOSE_MODAL'});dispatch({type:'OPEN_NOTEBOOK'});});await p.waitForTimeout(300);await p.evaluate(()=>{gameState.cats[0].body.weight+=10;render(gameState);});assert.equal(await p.locator('.notebook').evaluate(n=>getComputedStyle(n).animationName),'none');
 assert.deepEqual(errors,[]);console.log('PASS v025: timer dedup, expired no-op, sheet identity, live stock, entrance only on open, input focus/caret, notebook');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
