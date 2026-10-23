const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.resolve('cat-life-sample.html')).href);
  const count=await page.evaluate(()=>{
   paused=true;let count=0;
   for(const age of ['adult','kitten'])for(const body of ['skinny','slim','round']){
    rig.d.age=age;rig.d.body=body;
    for(const name of Object.keys(poseLabels))for(let t=0;t<7.8;t+=.26){
     pose=name;poseTime=t;poseTransition=null;draw(0);
     const n=rig.lifeAnatomy;
     // The rebuilt profile has no old pointed chest tip at y=-60.
     // Check the shoulder core and actual skull overlap, not that obsolete tip.
     const profile=['walk','dash','jump','poop'].includes(name);
     for(const y of (profile?[-40,-20,0]:[-60,-40,-20,0]))if(!n.chestShape.isPointInFill(new DOMPoint(0,y)))throw Error(`${name}/${t}: shoulder volume lost`);
     const matrix=rig.nodes.chest.getCTM().inverse().multiply(rig.nodes.headRig.getCTM());let overlap=0;
     for(let x=-45;x<=45;x+=3)for(let y=-24;y<=24;y+=3){const point=new DOMPoint(x,y);if(n.outline.isPointInFill(point)&&n.chestShape.isPointInFill(point.matrixTransform(matrix)))overlap++;}
     if(overlap<12)throw Error(`${age}/${body}/${name}/${t}: insufficient actual head/chest overlap (${overlap})`);
     if(/NaN|undefined/.test(svg.innerHTML))throw Error('Invalid geometry '+name);
     count++;
    }
   }
   return count;
  });
  for(const [width,height]of [[320,520],[375,764]]){
   await page.setViewportSize({width,height});await page.reload();
   const rect=()=>page.evaluate(()=>{const r=document.querySelector('.stage').getBoundingClientRect();return [r.x,r.y,r.width,r.height];});
   const first=await rect();await page.waitForTimeout(500);assert.deepEqual(await rect(),first);
   assert(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight));
   await page.screenshot({path:`tests/screenshots/life-final-${width}.png`});
   await page.reload();assert.deepEqual(await rect(),first);
  }
  assert.deepEqual(errors,[]);console.log('PASS',count,'frames: all 19 poses × 6 age/body combinations, neck attachment; 2 viewport sizes, initial load/reload stable');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
