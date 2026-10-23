const{chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{
 const p=await b.newPage({viewport:{width:1100,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(pathToFileURL(path.resolve('cat-calico-review.html')).href);
 const frames=p.frames().slice(1);await Promise.all(frames.map(f=>f.waitForFunction(()=>typeof rig!=='undefined'&&rig?.lifeAnatomy)));
 const original=await frames[0].evaluate(()=>rig.nodes.headSkin.innerHTML);
 for(let i=0;i<5;i++){
  await p.waitForTimeout(2000);await p.screenshot({path:`tests/screenshots/calico-common-${i}.png`,fullPage:true});
  for(const f of frames){
   const data=await f.evaluate(()=>{const h=rig.nodes.headRig.getCTM(),shape=rig.lifeAnatomy;return {paint:rig.nodes.headSkin.innerHTML,original:shape.outline.getAttribute('d')===shape.path,det:h.a*h.d-h.b*h.c,time,eyes:rig.nodes.face.querySelectorAll('defs').length};});
   assert.equal(data.paint,original);assert(data.original);assert(data.det>0,'face must never mirror');assert(data.eyes===0||data.eyes===2);
  }
 }
 for(const [width,height]of [[320,520],[375,764]]){await p.setViewportSize({width,height});assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.screenshot({path:`tests/screenshots/calico-common-${width}.png`});}
 assert.deepEqual(errors,[]);console.log('PASS 6 views, 10s live playback: identical original coat paths, original face silhouette, no reflection; 2 mobile widths');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
