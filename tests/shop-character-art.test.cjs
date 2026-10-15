const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const page=await browser.newPage();
 for(const [width,height] of [[320,568],[375,812]]){
  await page.setViewportSize({width,height});
  for(let load=0;load<2;load++){
   await page.goto(pathToFileURL(path.resolve('index.html')).href+'?check=1&scenario=room');
   await page.evaluate(()=>dispatch({type:'OPEN_MAP_SHOP',shopId:'petshop'}));
   const frame=await page.locator('#app').boundingBox();
   const measurements=await page.evaluate(()=>{
    const head=document.querySelector('.store-clerk-head').getBBox(),torso=document.querySelector('.store-clerk-torso').getBBox();
    const feet=document.querySelector('.store-bird-perch>path');const before=feet.getBoundingClientRect().toJSON();
    const failures=[];
    for(const time of [0,1800,2800,4500,6500]){
     document.querySelector('.store-background').getAnimations({subtree:true}).forEach(a=>{a.pause();a.currentTime=time});
     const h=document.querySelector('.store-clerk-head').getBoundingClientRect(),bubble=document.querySelector('.store-bird-speech').getBoundingClientRect();
     if(h.top<bubble.bottom)failures.push('Speech overlaps head at '+time);
     if(JSON.stringify(feet.getBoundingClientRect().toJSON())!==JSON.stringify(before))failures.push('Perch moved');
    }
    return {ratio:head.height/torso.height,failures};
   });
   assert(measurements.ratio>.85&&measurements.ratio<1.2,'Reception-like head / torso ratio');assert.deepEqual(measurements.failures,[]);
   await page.evaluate(()=>render(gameState));assert.deepEqual(await page.locator('#app').boundingBox(),frame);
   assert(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight));
   await page.waitForTimeout(1800);
   assert.equal(await page.locator('.store-bird-speech').innerText(),await page.locator('.store-bird-speech').getAttribute('aria-label'));
   assert(await page.locator('.store-bird-speech').evaluate(n=>n.firstElementChild.getBoundingClientRect().bottom<=n.getBoundingClientRect().bottom-3));
   await page.screenshot({path:`tests/screenshots/shop-character-art-${width}.png`});
  }
 }
 console.log('PASS shop proportions, fixed shoulder contact through motion, speech separation, reload and rerender geometry at both sizes.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
