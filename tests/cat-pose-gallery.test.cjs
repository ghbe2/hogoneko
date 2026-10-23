const{chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{const p=await b.newPage({viewport:{width:1450,height:1280}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(pathToFileURL(path.resolve('cat-pose-gallery.html')).href);await Promise.all(p.frames().slice(1).map(f=>f.waitForFunction(()=>document.querySelector('#cat')?.dataset.time)));
const frames=p.frames().slice(1),start=await Promise.all(frames.map(f=>f.locator('#cat').getAttribute('data-time')));
assert.equal(frames.length,22);for(const f of frames)assert(await f.evaluate(()=>document.querySelector('.stage').getBoundingClientRect().height===innerHeight));
for(let i=0;i<3;i++){await p.waitForTimeout(3500);await p.screenshot({path:`tests/screenshots/pose-gallery-${i}.png`,fullPage:true});}
const end=await Promise.all(frames.map(f=>f.locator('#cat').getAttribute('data-time')));end.forEach((v,i)=>assert(+v-+start[i]>2));
await p.click('#toggle');await p.waitForTimeout(300);const before=await frames[0].locator('#cat').getAttribute('data-time');await p.waitForTimeout(500);assert.equal(await frames[0].locator('#cat').getAttribute('data-time'),before);
await p.locator('article[data-pose="eat"] button').click();assert(await p.locator('#detail').isVisible());await p.screenshot({path:'tests/screenshots/pose-gallery-detail.png'});await p.click('#close');await p.click('#restart');await p.waitForTimeout(500);assert.equal(await p.locator('#toggle').getAttribute('aria-pressed'),'false');
for(const [width,height]of[[320,520],[375,764]]){await p.setViewportSize({width,height});assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.screenshot({path:`tests/screenshots/pose-gallery-${width}.png`});}
assert.deepEqual(errors,[]);console.log('PASS 22 live views for 10.5 seconds, pause/restart, enlargement, mobile widths',start,end);
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
