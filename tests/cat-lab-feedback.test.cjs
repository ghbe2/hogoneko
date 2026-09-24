const {chromium}=require('playwright');const assert=require('node:assert/strict');const path=require('node:path');const {pathToFileURL}=require('node:url');const fs=require('node:fs');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:1200,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.resolve(__dirname,'../art/cat-directions/cat-lab.html')).href);
 if(await page.locator('#pause').getAttribute('aria-pressed')==='false')await page.locator('#pause').click();
 const stats=await page.evaluate(()=>{
  const families={},counts={},N=15000;let same=0,rareT=0,rareC=0;
  for(let i=0;i<N;i++){const d=catLab.sampleDNA(i),m=catLab.coats[d.bodyCoat];families[m.family]=(families[m.family]||0)+1;counts[d.bodyCoat]=(counts[d.bodyCoat]||0)+1;same+=d.bodyCoat===d.headCoat;rareT+=m.family==='tortie'&&m.rare;rareC+=m.family==='calico'&&m.rare;}
  return{families,counts,same:same/N,rareT:rareT/families.tortie,rareC:rareC/families.calico,total:Object.keys(catLab.coats).length};
 });
 assert.equal(stats.total,36);assert(Object.keys(stats.counts).length===36);assert(stats.same>.89&&stats.same<.93);assert(stats.rareT>.035&&stats.rareT<.065);assert(stats.rareC>.035&&stats.rareC<.065);
 for(const f of ['tabby','tortie','calico'])assert(stats.families[f]>3000);
 await page.selectOption('#bodyCoat','white');assert.equal(await page.locator('#headCoat').inputValue(),'white');
 await page.locator('#coat-link').uncheck();await page.selectOption('#headCoat','tabby_gray_2');assert.equal(await page.locator('#bodyCoat').inputValue(),'white');
 await page.selectOption('#body','skinny');await page.selectOption('#earCut','left');
 assert.equal(await page.locator('#hero [data-part="chest"]').count(),1);assert.equal(await page.locator('#hero [data-part="rump"]').count(),1);
 for(const part of ['FarBack','FarFront','NearBack','NearFront'])for(const half of ['Upper','Lower'])assert.equal(await page.locator(`#hero [data-part="leg${part}${half}"]`).count(),1);
 for(const tail of ['hook','curl','bob']){await page.selectOption('#tail',tail);assert.equal(await page.locator('#hero [data-part="tail"]').evaluate(n=>getComputedStyle(n).display),'inline');}
 for(const mood of ['happy','angry']){await page.selectOption('#mood',mood);assert.equal(await page.locator('#hero').evaluate(n=>/NaN|undefined/.test(n.innerHTML)),false);}
 await page.locator('[data-preset="G"]').click();await page.selectOption('#age','adult');await page.selectOption('#mood','neutral');
 const shots=[];
 for(const p of ['sit','punch','dash','wall','scratch','knead','eat','poop','vomit']){
  await page.locator(`[data-pose="${p}"]`).click();
  assert.equal(await page.locator('#hero').evaluate(n=>/NaN|undefined/.test(n.innerHTML)),false);
  shots.push({p,svg:await page.locator('#hero').evaluate(n=>n.outerHTML)});
 }
 await page.locator('[data-pose="sit"]').click();await page.selectOption('#mood','happy');shots.push({p:'happy',svg:await page.locator('#hero').evaluate(n=>n.outerHTML)});
 await page.selectOption('#mood','angry');shots.push({p:'angry',svg:await page.locator('#hero').evaluate(n=>n.outerHTML)});
 await page.setViewportSize({width:375,height:812});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 fs.mkdirSync(path.join(__dirname,'screenshots'),{recursive:true});await page.screenshot({path:path.join(__dirname,'screenshots/cat-lab-feedback-mobile.png'),fullPage:true});
 await page.setViewportSize({width:1200,height:1500});
 await page.setContent('<style>body{margin:0;background:#ecefe4;display:grid;grid-template-columns:repeat(4,1fr);font:14px sans-serif}article{padding:10px;text-align:center;border:1px solid #ddd}svg{width:100%;height:300px}</style>'+shots.map(({p,svg},i)=>`<article>${p}${svg.replace('id="hero"',`id="shot${i}"`).replace(/hero-(\d+)/g,`shot${i}-hero-$1`)}</article>`).join(''));
 await page.screenshot({path:path.join(__dirname,'screenshots/cat-lab-feedback-contact.png'),fullPage:true});
 assert.equal(errors.length,0,errors.join('\n'));console.log('PASS feedback',JSON.stringify(stats));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
