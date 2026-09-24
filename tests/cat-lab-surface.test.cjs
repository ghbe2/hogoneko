const {chromium}=require('playwright');const assert=require('node:assert/strict');const path=require('node:path');const {pathToFileURL}=require('node:url');const fs=require('node:fs');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:1200,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.resolve(__dirname,'../art/cat-directions/cat-lab.html')).href);
 if(await page.locator('#pause').getAttribute('aria-pressed')==='false')await page.locator('#pause').click();
 const checks=await page.evaluate(()=>{
  const coat=catLab.coats.tux,map=CatSurface.get(coat,123),a=CatSurface.project(map,0),b=CatSurface.project(map,90),c=CatSurface.project(map,180);
  const knead=catLab.poseModel('knead',.25),knead2=catLab.poseModel('knead',.25+Math.PI/3.7),wall=catLab.poseModel('wall',.25);
  return{diff:a!==b&&b!==c,stable:a===CatSurface.project(CatSurface.get(coat,123),0),noRearBib:!c.includes('data-mark'),kneadUpright:knead.br===0&&knead.yaw===0,kneadAlternates:knead.legs[1][3]!==knead2.legs[1][3]&&knead.legs[3][3]!==knead2.legs[3][3],wallBack:wall.yaw===180};
 });for(const [k,v]of Object.entries(checks))assert(v,k);
 const shots=[];
 for(const preset of ['H','G']){
  await page.locator(`[data-preset="${preset}"]`).click();await page.selectOption('#age','adult');
  const dna=await page.evaluate(()=>catLab.getDNA());let seated;
  for(const p of ['sit','walk','jump','sleep','dash','wall','knead']){
   await page.locator(`[data-pose="${p}"]`).click();assert.deepEqual(await page.evaluate(()=>catLab.getDNA()),dna);
   if(p==='sit')seated=await page.locator('#hero [data-part="chest"] > g').innerHTML();
   if(p==='wall')assert.equal(await page.locator('#hero [data-part="face"]').evaluate(n=>getComputedStyle(n).opacity),'0');
   if(p==='knead')assert.equal(await page.locator('#hero [data-part="chest"] > g').innerHTML(),seated);
   assert.equal(await page.locator('#hero').evaluate(n=>/NaN|undefined/.test(n.innerHTML)),false);
   shots.push({p:preset+' '+p,svg:await page.locator('#hero').evaluate(n=>n.outerHTML)});
  }
 }
 await page.locator('[data-pose="sit"]').click();await page.locator('#pause').click();await page.locator('[data-pose="wall"]').click();await page.waitForTimeout(550);assert.equal(await page.locator('#hero [data-part="body"]').getAttribute('data-view-angle'),'180');
 await page.locator('[data-pose="walk"]').click();await page.waitForTimeout(550);assert.equal(await page.locator('#hero [data-part="face"]').evaluate(n=>getComputedStyle(n).opacity),'1');
 await page.setViewportSize({width:375,height:812});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 const download=page.waitForEvent('download');await page.locator('#export').click();const dl=await download;const txt=fs.readFileSync(await dl.path(),'utf8');assert(txt.includes('data-mark'));assert(txt.includes('<svg'));
 await page.setViewportSize({width:1400,height:1000});
 await page.setContent('<style>body{margin:0;background:#ecefe4;display:grid;grid-template-columns:repeat(7,1fr);font:14px sans-serif}article{padding:8px;text-align:center;border:1px solid #ddd}svg{width:100%;height:310px}</style>'+shots.map(({p,svg},i)=>`<article>${p}${svg.replace('id="hero"',`id="shot${i}"`).replace(/hero-(\d+)/g,`shot${i}-hero-$1`)}</article>`).join(''));
 await page.screenshot({path:path.join(__dirname,'screenshots/cat-lab-surface-contact.png'),fullPage:true});
 assert.equal(errors.length,0,errors.join('\n'));console.log('PASS surface',checks);
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
