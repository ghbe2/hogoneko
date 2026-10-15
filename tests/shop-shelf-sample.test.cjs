const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const p=await browser.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
  for(const [width,height] of [[320,568],[375,812]]){
   await p.setViewportSize({width,height});
   await p.goto(pathToFileURL(path.resolve('shop-shelf-sample.html')).href);
   const measure=()=>p.evaluate(()=>{
    const game=document.querySelector('.game').getBoundingClientRect(),panel=document.querySelector('.panel').getBoundingClientRect();
    return {game:[game.x,game.y,game.width,game.height],panel:[panel.x,panel.y,panel.width,panel.height]};
   });
   const initial=await measure();await p.waitForTimeout(1300);assert.deepEqual(await measure(),initial);
   await p.screenshot({path:`tests/screenshots/shop-shelf-sample-${width}.png`});
   const testNames=()=>p.evaluate(()=>[...document.querySelectorAll('.name')].map(el=>({name:el.textContent,height:el.clientHeight,scroll:el.scrollHeight,width:el.clientWidth})));
   for(const tab of ['furniture','play','food','care','tools']){
    await p.click(`[data-tab="${tab}"]`);
    const names=await testNames();assert(names.every(n=>n.height===38&&n.scroll<=n.height),JSON.stringify(names));
    const collisions=await p.locator('.product').evaluateAll(items=>items.flatMap(el=>{
     const art=el.querySelector('.art').getBoundingClientRect(),info=el.querySelector('.info').getBoundingClientRect();
     const overlaps=(a,b)=>Math.min(a.right,b.right)>Math.max(a.left,b.left)&&Math.min(a.bottom,b.bottom)>Math.max(a.top,b.top);
     const bad=[...el.querySelectorAll('.name,.price')].some(n=>overlaps(art,n.getBoundingClientRect()));
     return bad||!overlaps(art,info)?[el.textContent]:[];
    }));assert.deepEqual(collisions,[],'art should overlap bubble, not name or price');
    assert(await p.evaluate(()=>document.documentElement.scrollHeight<=innerHeight));
    assert(await p.locator('.footer').evaluate(el=>el.getBoundingClientRect().bottom<=innerHeight-10));
   }
   await p.click('[data-tab="furniture"]');
   await p.click('[data-product="tower"]');
   await p.screenshot({path:`tests/screenshots/shop-shelf-detail-${width}.png`});
   assert(await p.evaluate(()=>document.documentElement.scrollHeight<=innerHeight));
   await p.click('[data-do="add"]');assert(await p.locator('.tabs').isVisible());
   await p.click('[data-tab="food"]');await p.click('[data-product="dry"]');await p.click('[data-do="plus"]');
   assert.equal(await p.locator('output').innerText(),'2');await p.click('[data-do="add"]');
   await p.click('[data-do="cart"]');assert.equal(await p.locator('.cart-row').count(),2);
   await p.click('[data-do="confirm"]');await p.click('[data-do="finish"]');await p.click('[data-do="back"]');
   await p.reload();assert.deepEqual(await measure(),initial);assert.equal(await p.locator('.footer').innerText(),'カートを見る');
  }
  assert.deepEqual(errors,[]);console.log('PASS 320×520 / 375×764: fixed 2-line names, contained viewport, stable initial/reload frame, 5 tabs, details, quantity, cart, sample checkout.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
