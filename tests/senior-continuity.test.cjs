const{chromium}=require('playwright'),assert=require('node:assert/strict'),{pathToFileURL}=require('url'),path=require('path');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{for(const [width,height]of [[320,568],[375,812]]){
 const p=await b.newPage({viewport:{width,height}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(pathToFileURL(path.resolve('index.html')).href+'?check=1&scenario=room');
 await p.evaluate(()=>{titleScreenOpen=false;gameState.campaign.phase='story';gameState.onboarding={...gameState.onboarding,status:'active',storyIndex:0,introStartedAt:Date.now()-10000};render(gameState);window.keptSenior=liveSeniorPortraits()[0];});
 for(const action of ['.introduction-next','.introduction-back','.introduction-next']){
  await p.locator(action).click();
  assert(await p.evaluate(()=>{const current=liveSeniorPortraits()[0];return current.cat===keptSenior.cat&&current.portrait===keptSenior.portrait&&current.rig===keptSenior.rig}),'same portrait and rig across actual Next/Back');
 }
 await p.screenshot({path:`tests/screenshots/senior-continuity-${width}-a.png`});
 const before=await p.locator('.senior-held-cat').innerHTML();await p.waitForTimeout(1400);assert.notEqual(await p.locator('.senior-held-cat').innerHTML(),before,'retained cat still animates');
 await p.screenshot({path:`tests/screenshots/senior-continuity-${width}-b.png`});
 assert(await p.evaluate(()=>{for(let i=0;i<15;i++)render(gameState);return liveSeniorPortraits()[0].cat===keptSenior.cat&&[...svgRigs.keys()].every(n=>n.isConnected)}),'repeated rerender retains cat and releases detached rigs');
 await p.evaluate(()=>{gameState.campaign.phase='intake';gameState.onboarding={...gameState.onboarding,status:'active',flowVersion:1,guide:'moveFurniture'};gameState.ui={...gameState.ui,modal:null,layoutMode:true};render(gameState);window.guideSenior=liveSeniorPortraits()[0];});
 assert(await p.evaluate(()=>{render(gameState);const current=liveSeniorPortraits()[0];return current.cat===guideSenior.cat&&current.rig===guideSenior.rig}),'shared guide survives redraw');
 assert.deepEqual(errors,[]);console.log('PASS',width,'actual Next/Back, shared tutorial, stable nodes and rig, continuing animation, no detached rig leak');await p.close();
}}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
