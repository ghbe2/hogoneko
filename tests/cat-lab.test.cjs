const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const fs=require('node:fs');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:1250,height:1050}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.resolve(__dirname,'../art/cat-directions/cat-lab.html')).href);
 await page.locator('#pause').click();
 const before=await page.evaluate(()=>catLab.getDNA());
 for(const p of ['walk','jump','sleep','sit']){await page.locator(`[data-pose="${p}"]`).click();assert.deepEqual(await page.evaluate(()=>catLab.getDNA()),before);}
 await page.selectOption('#tail','none');assert.equal(await page.locator('#hero [data-part="tail"]').evaluate(n=>getComputedStyle(n).display),'none');
 await page.selectOption('#head','sharp');await page.selectOption('#eyes','round');await page.selectOption('#bodyCoat','tortie');await page.selectOption('#tailCoat','calico');await page.selectOption('#tail','long');
 const mixed=await page.evaluate(()=>catLab.getDNA());await page.locator('#coat-shuffle').click();const after=await page.evaluate(()=>catLab.getDNA());
 for(const k of ['head','eyes','body','tail','age','ears','mood','eyeColor'])assert.equal(after[k],mixed[k]);
 const saved=await page.evaluate(()=>catLab.getDNA());await page.reload();assert.deepEqual(await page.evaluate(()=>catLab.getDNA()),saved);
 await page.locator('#pause').click();await page.locator('[data-preset="G"]').click();await page.selectOption('#age','adult');
 fs.mkdirSync(path.join(__dirname,'screenshots'),{recursive:true});await page.screenshot({path:path.join(__dirname,'screenshots/cat-lab-desktop.png'),fullPage:true});
 for(const age of ['adult','kitten'])for(const head of ['sharp','oval','ruff'])for(const p of ['sit','walk','jump','sleep']){
  await page.selectOption('#age',age);await page.selectOption('#head',head);await page.locator(`[data-pose="${p}"]`).click();
  assert.equal(await page.locator('#hero').evaluate(n=>/NaN|undefined/.test(n.innerHTML)),false);
 }
 await page.setViewportSize({width:375,height:812});await page.locator('[data-preset="H"]').click();await page.locator('[data-pose="sit"]').click();
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.screenshot({path:path.join(__dirname,'screenshots/cat-lab-mobile.png'),fullPage:true});
 const ids=await page.locator('svg [id]').evaluateAll(ns=>ns.map(n=>n.id));assert.equal(ids.length,new Set(ids).size);
 await page.locator('[data-pose="walk"]').click();await page.locator('#pause').click();
 const legBefore=await page.locator('#hero [data-part="legNearFrontLower"]').getAttribute('transform');
 const coatBefore=await page.locator('#hero [data-part="chest"] > g').innerHTML();
 await page.waitForTimeout(200);
 assert.notEqual(await page.locator('#hero [data-part="legNearFrontLower"]').getAttribute('transform'),legBefore);
 assert.equal(await page.locator('#hero [data-part="chest"] > g').innerHTML(),coatBefore);
 const dl=page.waitForEvent('download');await page.locator('#export').click();assert((await dl).suggestedFilename().endsWith('.svg'));
 assert.equal(errors.length,0,errors.join('\n'));console.log('PASS: 24 age/head/pose combinations, fixed phenotype, coat-only shuffle, persistence, tail omission, SVG export, unique clip IDs, mobile width; no page errors');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
