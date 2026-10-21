const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage();
  for(const [width,height] of [[320,568],[375,812]]){
   await page.setViewportSize({width,height});
   await page.goto(pathToFileURL(path.resolve('home-app-three.html')).href);
   const check=()=>page.evaluate(()=>{
    const rect=s=>document.querySelector(s).getBoundingClientRect();
    const sections=[...document.querySelector('.dashboard').children].map(e=>e.getBoundingClientRect());
    const close=rect('#close-app'),profile=rect('.identity h1');
    return {
     full:document.querySelector('.portrait svg').getAttribute('viewBox')==='200 55 320 340',
     gaps:sections.slice(1).every((r,i)=>r.top-sections[i].bottom>=5),
     cancel:getComputedStyle(document.querySelector('.cancel-surgery')).textDecorationLine==='none',
     close:close.width>=40&&close.height>=40&&close.left>profile.left&&close.bottom<=rect('.tags').top,
     pay:rect('.pay').height<=86,
     size:[rect('#device').width,rect('#device').height]
    };
   });
   const first=await check();for(const key of ['full','gaps','cancel','close','pay'])assert(first[key],`${width}: ${key}`);
   await page.waitForTimeout(1500);assert.deepEqual((await check()).size,first.size);
   await page.reload();assert.deepEqual((await check()).size,first.size);
   await page.click('.cancel-surgery');assert(await page.locator('[data-postpone]').isVisible());await page.click('[data-dismiss]');
   await page.click('#close-app');assert(await page.locator('#device').isHidden());
   await page.click('#launch-app');assert(await page.locator('#device').isVisible());
  }
  console.log('PASS full-body, section gaps, cancellation button, close/reopen, compact wallet, stable reload at both sizes');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
