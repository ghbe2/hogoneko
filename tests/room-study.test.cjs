const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1400,height:1100}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.resolve('art/cat-directions/room-study.html')).href);
 for(const season of ['spring','summer','autumn','winter']){
  for(const time of ['morning','day','evening','night']){
   await page.selectOption('#season',season);await page.selectOption('#daytime',time);
   assert.equal(await page.locator('#closed-curtains').isVisible(),time==='night');
   assert.equal(await page.locator('#open-curtains').isVisible(),time!=='night');
   assert.equal(await page.locator('#room').evaluate(n=>getComputedStyle(n).filter),'none');
   assert.equal(await page.locator('#outside [aria-label="二色の月"]').count(),['evening','night'].includes(time)?1:0);
  }
 }
 await page.selectOption('#season','autumn');await page.selectOption('#daytime','evening');
 await page.locator('.phone').screenshot({path:'tests/screenshots/room-study-evening.png'});
 await page.selectOption('#daytime','night');
 await page.locator('.phone').screenshot({path:'tests/screenshots/room-study-night.png'});
 await page.selectOption('#season','spring');await page.selectOption('#daytime','day');
 await page.screenshot({path:'tests/screenshots/room-study-desktop.png',fullPage:true});
 await page.click('[data-theme="sage"]');
 assert.equal(await page.locator('[data-theme="sage"]').getAttribute('aria-pressed'),'true');
 await page.uncheck('#furniture');
 assert.equal(await page.locator('.furnishing').first().isVisible(),false);
 await page.check('#furniture');
 await page.selectOption('#cat-choice','tabby');
 assert.match(await page.locator('#cat-image').getAttribute('href'),/tabby/);
 await page.click('[data-pan="450"]');
 assert.equal(await page.locator('#room').getAttribute('viewBox'),'450 0 450 760');
 await page.screenshot({path:'tests/screenshots/room-study-right.png',fullPage:true});
 await page.setViewportSize({width:375,height:900});
 await page.click('[data-pan="0"]');
 await page.click('[data-theme="oat"]');
 await page.selectOption('#cat-choice','tortie');
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.locator('.phone').screenshot({path:'tests/screenshots/room-study-mobile.png'});
 const bounds=await page.locator('#viewport').boundingBox();
 await page.mouse.move(bounds.x+bounds.width-20,bounds.y+100);await page.mouse.down();
 await page.mouse.move(bounds.x+20,bounds.y+100,{steps:10});await page.mouse.up();
 assert.ok(Number((await page.locator('#room').getAttribute('viewBox')).split(' ')[0])>100);
 assert.deepEqual(errors,[]);
 await browser.close();console.log('room-study: PASS');
})();
