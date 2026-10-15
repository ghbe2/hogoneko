const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{
 const p=await b.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 for(const [width,height]of [[320,568],[375,812]]){
  await p.setViewportSize({width,height});await p.goto(pathToFileURL(path.resolve('index.html')).href+'?check=1&scenario=room');await p.evaluate(()=>dispatch({type:'OPEN_SUPPLIES'}));
  await p.click('[data-tab="furniture"]');const frame=await p.locator('#app').boundingBox();
  await p.waitForTimeout(300);const partial=await p.locator('.store-bird-speech').innerText(),full=await p.locator('.store-bird-speech').getAttribute('aria-label');assert(partial.length>0&&partial.length<full.length);
  await p.evaluate(()=>{window.testActor=app.querySelector('.store-background');window.testTime=app.querySelector('.store-rabbit-ear').getAnimations()[0].currentTime;render(gameState)});
  assert(await p.evaluate(()=>window.testActor===app.querySelector('.store-background')));assert((await p.locator('.store-bird-speech').innerText()).length>=partial.length);
  await p.waitForTimeout(1600);assert.equal(await p.locator('.store-bird-speech').innerText(),full);
  assert(await p.evaluate(()=>app.querySelector('.store-rabbit-ear').getAnimations()[0].currentTime>window.testTime));
  await p.screenshot({path:`tests/screenshots/shop-polished-${width}.png`});
  for(const tab of ['furniture','play','food','care','tools']){
   await p.click(`[data-tab="${tab}"]`);
   const issues=await p.locator('.store-product').evaluateAll(items=>items.flatMap(el=>{const art=el.querySelector('.store-art').getBoundingClientRect(),label=el.querySelector('.store-label').getBoundingClientRect(),name=el.querySelector('.store-product-name');const overlap=(a,b)=>Math.min(a.right,b.right)>Math.max(a.left,b.left)&&Math.min(a.bottom,b.bottom)>Math.max(a.top,b.top);return name.scrollHeight>name.clientHeight||!overlap(art,label)||[...el.querySelectorAll('.store-product-name,.store-price')].some(n=>overlap(art,n.getBoundingClientRect()))?[name.textContent]:[]}));assert.deepEqual(issues,[],tab+' names and prices must be visible');
   assert(await p.evaluate(()=>document.documentElement.scrollHeight<=innerHeight));
  }
  await p.click('[data-tab="furniture"]');await p.locator('.store-list').evaluate(n=>n.scrollTop=210);const scroll=await p.locator('.store-list').evaluate(n=>n.scrollTop);await p.evaluate(()=>dispatch({type:'STORE_DETAIL',id:'plant'}));await p.click('[data-store="back"]');assert.equal(await p.locator('.store-list').evaluate(n=>n.scrollTop),scroll);
  await p.evaluate(()=>dispatch({type:'STORE_DETAIL',id:'plant'}));await p.waitForTimeout(400);const first=await p.locator('.store-bird-speech').innerText();await p.evaluate(()=>dispatch({type:'STORE_DETAIL',id:'blanket'}));assert((await p.locator('.store-bird-speech').innerText()).length<first.length);
  await p.click('[data-store="back"]');await p.click('[data-tab="food"]');await p.click('[data-item="food_dry"]');await p.click('[data-store="add"]');assert.equal(await p.locator('.store-register-total').textContent(),'4');await p.click('[data-store="cart"]');await p.click('[data-store="confirm"]');await p.click('[data-store="checkout"]');assert.equal(await p.locator('.store-register-total').textContent(),'4');assert(await p.locator('.store-background').evaluate(n=>n.classList.contains('store-checkout')));
  await p.waitForTimeout(1300);await p.screenshot({path:`tests/screenshots/shop-polished-thanks-${width}.png`});assert.deepEqual(await p.locator('#app').boundingBox(),frame);
  await p.emulateMedia({reducedMotion:'reduce'});await p.evaluate(()=>render(gameState));assert.equal(await p.locator('.store-bird-speech').innerText(),await p.locator('.store-bird-speech').getAttribute('aria-label'));assert.equal(await p.locator('.store-rabbit-ear').evaluate(n=>n.getAnimations().length),0);await p.emulateMedia({reducedMotion:'no-preference'});
 }
 assert.deepEqual(errors,[]);console.log('PASS shop polish: all names, overlap safety, typewriter continuity, persistent animated actors, scroll restoration, register total, checkout and reduced motion.');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
