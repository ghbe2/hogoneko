const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{const p=await b.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
for(const [width,height]of [[320,568],[375,812]]){
 await p.setViewportSize({width,height});await p.goto(pathToFileURL(path.resolve('index.html')).href+'?check=1&scenario=room');
 // Real coin scene, no pose override: its independent CSS clock must survive redraws.
 await p.evaluate(()=>{gameState.dailyDiscovery=null;gameState.ui.modal=null;render(gameState)});await p.waitForTimeout(450);
 for(let i=0;i<16;i++){const result=await p.evaluate(()=>{const coin=document.querySelector('.discovery-pickup span'),t=coin.getAnimations()[0].currentTime,svg=document.querySelector('.cat-object .game-cat-svg'),rig=svgRigs.get(svg),since=rig.since;render(gameState);return{coin:document.querySelector('.discovery-pickup span').getAnimations()[0].currentTime>=t,cat:document.querySelector('.cat-object .game-cat-svg')===svg&&rig.since===since};});assert(result.coin&&result.cat);await p.waitForTimeout(300);}
 await p.screenshot({path:`tests/screenshots/coin-continuity-${width}.png`});
 await p.evaluate(()=>{gameState.dailyDiscovery={lastDay:discoveryDay()};window.nativePose=scenePose;render(gameState)});
 for(const pose of ['sit','walk','dash','jump','wall','punch','eat','sleep','knead','scratch','poop','vomit']){
  await p.evaluate(pose=>{scenePose=svg=>svg.closest('.cat-object')?[pose,'neutral']:window.nativePose(svg)},pose);await p.waitForTimeout(220);
  for(let i=0;i<3;i++){await p.waitForTimeout(100);assert(await p.evaluate(()=>{const svg=document.querySelector('.cat-object .game-cat-svg'),rig=svgRigs.get(svg),since=rig.since,model=rig.lastModel;render(gameState);return svg===document.querySelector('.cat-object .game-cat-svg')&&svgRigs.get(svg)===rig&&rig.since===since&&rig.lastModel===model;}),pose);}
 }
 await p.evaluate(()=>{scenePose=window.nativePose;gameState.ui.modal=null;render(gameState);const cat=document.querySelector('.cat-object'),to=getCatPoint(gameState);animateFelineTravel(cat,{...to,x:to.x-25,surface:'floor'},{...to,surface:'floor'});});
 await p.waitForTimeout(300);
 for(let i=0;i<4;i++){assert(await p.evaluate(()=>{const a=document.querySelector('.cat-object')._travelAnimation,t=a.currentTime,d=a.effect.getTiming().duration;dispatch({type:'CLEAR_REACTION',id:-1});const next=document.querySelector('.cat-object')._travelAnimation;return next&&next.currentTime>=t&&next.effect.getTiming().duration===d;}),'walking clock');await p.waitForTimeout(100);}
 await p.evaluate(()=>{const cat=document.querySelector('.cat-object');cat._travelAnimation?.cancel();const point=getCatPoint(gameState);animateFelineTravel(cat,{...point,surface:'floor'},{...point,surface:'shelf',y:point.y-10});showFeel(cat,'match');});await p.waitForTimeout(60);
 assert(await p.evaluate(()=>{const cat=document.querySelector('.cat-object'),a=cat._travelAnimation,t=a.currentTime,svg=cat.querySelector('svg'),feel=svg.getAnimations()[0],ft=feel.currentTime;render(gameState);const next=document.querySelector('.cat-object');return next.classList.contains('jumping')&&next._travelAnimation.currentTime>=t&&feel.currentTime>=ft;}),'jump and affection gesture');
 await p.evaluate(()=>{document.querySelector('.cat-object')._travelAnimation?.cancel();gameState.ui.holdingCat=true;render(gameState)});await p.waitForTimeout(200);
 assert(await p.evaluate(()=>{const svg=document.querySelector('.held-cat .game-cat-svg'),rig=svgRigs.get(svg);render(gameState);return document.querySelector('.held-cat .game-cat-svg')===svg&&svgRigs.get(svg)===rig;}),'held cat');
 console.log('PASS',width,'coin scene, all 12 poses, held cat, walking progress across dispatch');
}assert.deepEqual(errors,[]);
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
