const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1400,height:1000}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto(pathToFileURL(path.resolve('art/cat-directions/interior-toy-study.html')).href);
 assert.equal(await page.locator('.toy').count(),14);
 assert.equal(await page.locator('.placement').count(),14);
 assert.equal(await page.locator('#catalog').evaluate(n=>n.innerHTML.includes('undefined')),false);
 for(const type of ['human','cat','friend','prey','touch','solo','chase','ambush','high','hide','sun','food','scent','scratch']){
  await page.click(`[data-type="${type}"]`);assert.equal(await page.locator('.toy').count(),1);
 }
 await page.click('[data-type="all"]');
 await page.screenshot({path:'tests/screenshots/interior-toy-study-desktop.png',fullPage:true});
 await page.check('#small-preview');assert.equal(await page.locator('.slot').first().isVisible(),true);
 await page.setViewportSize({width:375,height:850});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.screenshot({path:'tests/screenshots/interior-toy-study-mobile.png',fullPage:true});
 assert.deepEqual(errors,[]);await browser.close();console.log('interior-toy-study: PASS');
})();
