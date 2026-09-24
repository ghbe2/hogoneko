const {chromium}=require('playwright');const assert=require('node:assert/strict');const path=require('node:path');const {pathToFileURL}=require('node:url');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:1100,height:850}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(pathToFileURL(path.resolve(__dirname,'../art/cat-directions/cat-lab.html')).href);
 if(await page.locator('#pause').getAttribute('aria-pressed')==='false')await page.locator('#pause').click();
 assert.equal(await page.locator('#eyes option').count(),4);
 for(const p of ['sit','walk','jump','sleep','punch','dash','wall','scratch','knead','eat','poop','vomit']){await page.locator(`[data-pose="${p}"]`).click();assert.equal(await page.locator('#hero [data-part="props"]').innerHTML(),'');}
 await page.locator('[data-pose="sit"]').click();await page.selectOption('#eyes','asym');
 for(const mood of ['neutral','happy','angry']){await page.selectOption('#mood',mood);assert.equal(await page.locator('#hero').evaluate(n=>/NaN|undefined/.test(n.innerHTML)),false);}
 const result=await page.evaluate(()=>{
  const scales=[],angles=[];for(const t of [0,.1,.2,.3,.4,.5]){applyPose(rig,poseModel('dash',t),t,'dash');const tf=rig.nodes.legNearFrontUpper.getAttribute('transform');scales.push(tf.match(/scale\(([^)]+)\)/)[1]);angles.push(tf.match(/rotate\(([^)]+)\)/)[1]);}return{scales,angles};
 });assert.equal(new Set(result.scales).size,1);assert(new Set(result.angles).size>4);
 for(const head of ['sharp','oval','ruff'])for(const ears of ['small','tall','tilted'])for(const mood of ['neutral','angry']){
  await page.selectOption('#head',head);await page.selectOption('#ears',ears);await page.selectOption('#mood',mood);await page.locator('[data-pose="sit"]').click();
  const overlap=await page.evaluate(()=>{
   const svg=document.querySelector('#hero'),head=rig.nodes.head.querySelector('.part-outline').cloneNode();head.setAttribute('fill','white');head.removeAttribute('style');head.setAttribute('opacity','0');svg.append(head);const out=[];
   for(const side of ['L','R']){const ear=svg.querySelector(`[data-clip-ear="${side}"]`).cloneNode();ear.removeAttribute('transform');ear.setAttribute('fill','white');ear.setAttribute('opacity','0');svg.append(ear);const matrix=rig.nodes['ear'+side].transform.baseVal.consolidate().matrix;let hits=0;
    for(let x=-62;x<=62;x+=2)for(let y=-38;y<=32;y+=2){const p=new DOMPoint(x,y);if(head.isPointInFill(p)&&ear.isPointInFill(p.matrixTransform(matrix.inverse())))hits++;}out.push(hits);ear.remove();}
   head.remove();return out;
  });assert(overlap.every(n=>n>10),JSON.stringify({head,ears,mood,overlap}));
 }
 await page.setViewportSize({width:375,height:812});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.equal(errors.length,0);console.log('PASS v6: 4 eyes, props absent, fixed dash limb lengths and changing angles, ear/head overlap for 18 configurations, mobile width');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
