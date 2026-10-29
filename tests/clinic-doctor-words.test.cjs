const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{const b=await chromium.launch({channel:'chrome'});try{for(const width of [320,375]){
 const p=await b.newPage({viewport:{width,height:width===320?568:812}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(pathToFileURL(path.resolve('index.html')).href+'?check=1');
 await p.evaluate(()=>{titleScreenOpen=false;gameState.onboarding={status:'done'};gameState.campaign={...gameState.campaign,phase:'shop',shopId:'clinic'};gameState.ui={...gameState.ui,modal:null};getCat(gameState).status='captured';dispatch({type:'FIRST_EXAM'});});
 await p.locator('.exam-doctor-words').waitFor();await p.waitForTimeout(550);
 const visible=()=>p.locator('.exam-doctor-words p').evaluateAll(ns=>ns.filter(n=>getComputedStyle(n).visibility==='visible').map(n=>n.textContent));
 assert.deepEqual(await visible(),['どれどれ…']);
 await p.screenshot({path:`tests/screenshots/doctor-first-${width}.png`});
 await p.waitForTimeout(1100);
 await p.evaluate(()=>render(gameState));
 await p.waitForTimeout(150);
 assert.deepEqual(await visible(),['ふむふむ']);
 const rects=await p.evaluate(()=>{const r=s=>{const v=document.querySelector(s).getBoundingClientRect();return {top:v.top,bottom:v.bottom,left:v.left,right:v.right}};return {words:r('.exam-doctor-words'),head:r('.first-doctor .reception-staff-head'),app:r('#app'),scroll:document.documentElement.scrollHeight,height:innerHeight};});
 assert(rects.words.bottom<=rects.head.top);assert(rects.words.left>=rects.app.left&&rects.words.right<=rects.app.right);assert(rects.scroll<=rects.height);
 await p.screenshot({path:`tests/screenshots/doctor-second-${width}.png`});
 await p.waitForTimeout(1500);assert.equal(await p.locator('.exam-doctor-words').count(),0);assert.equal(await p.evaluate(()=>gameState.campaign.clinicStep),'summary');assert.deepEqual(errors,[]);await p.close();
 }console.log('PASS doctor phrases, redraw timing, result cleanup and mobile layout');}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});


