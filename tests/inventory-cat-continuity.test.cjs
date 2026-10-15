const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{const p=await b.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 for(const [width,height]of [[320,568],[375,812]]){
  await p.setViewportSize({width,height});await p.goto(pathToFileURL(path.resolve('index.html')).href+'?check=1&scenario=room');
  const bad=await p.evaluate(async()=>{const entries=[...Object.entries(bookIcons),...SB.hand.map(e=>[e.art,e.svg]),...SB.placed.map(e=>[e.art,e.svg])];return(await Promise.all(entries.map(([id,svg])=>new Promise(resolve=>{const img=new Image();img.onload=()=>resolve(null);img.onerror=()=>resolve(id);img.src=bookURI(svg)})))).filter(Boolean)});assert.deepEqual(bad,[],'Every toy/furniture SVG decodes');
  await p.evaluate(()=>{gameState.inventory.mouse=1;gameState.ui.modal='inventory';render(gameState)});await p.waitForTimeout(200);
  assert(await p.locator('[data-item="mouse"] img').first().evaluate(e=>e.complete&&e.naturalWidth>0));
  await p.screenshot({path:`tests/screenshots/inventory-image-fixed-${width}.png`,animations:'disabled'});
  await p.evaluate(()=>{gameState.ui.modal=null;getCat(gameState).body.vomit=10;render(gameState);window.originalScenePose=scenePose;scenePose=svg=>svg.closest('.cat-object')?['knead','happy']:window.originalScenePose(svg);});
  await p.waitForTimeout(400);
  await p.evaluate(()=>{window.liveCat=document.querySelector('.cat-object .game-cat-svg');window.liveRig=svgRigs.get(window.liveCat);window.startSince=window.liveRig.since;window.initialVomit=getCat(gameState).body.vomit});
  for(let i=0;i<8;i++){
   await p.waitForTimeout(150);
   const kept=await p.evaluate(()=>{const before=window.liveCat.querySelector('[data-part="headRig"]').getAttribute('transform');dispatch({type:'RUB_CLEAN',cleanerId:'starter_clean',targets:[{problem:'vomit'}]});const svg=document.querySelector('.cat-object .game-cat-svg');return svg===window.liveCat&&svgRigs.get(svg)===window.liveRig&&window.liveRig.since===window.startSince&&svg.querySelector('[data-part="headRig"]').getAttribute('transform')===before;});assert(kept,'Cleaning must preserve the rig, clock and currently displayed pose');
  }
  assert(await p.evaluate(()=>getCat(gameState).body.vomit<window.initialVomit),'Cleaning really processed');
  assert(await p.evaluate(()=>performance.now()-window.liveRig.since>1200),'Animation advances across cleaning');
  await p.evaluate(()=>{scenePose=svg=>svg.closest('.cat-object')?['sleep','neutral']:window.originalScenePose(svg)});await p.waitForTimeout(100);
  assert(await p.evaluate(()=>window.liveRig.pose==='sleep'&&window.liveRig.since>window.startSince),'Real behavior changes still transition');
  await p.evaluate(()=>{scenePose=window.originalScenePose;render(gameState)});
 }
 assert.deepEqual(errors,[]);console.log('PASS all inventory art decodes; repeated real cleaning preserves cat rig/time/pose; genuine pose changes work at both sizes.');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
