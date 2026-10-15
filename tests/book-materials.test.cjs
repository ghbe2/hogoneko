const {chromium}=require('playwright'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url'),path=require('node:path');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{
const p=await b.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
const open=f=>p.goto(pathToFileURL(path.resolve(f)).href);
await open('index.html');
assert.ok(await p.evaluate(()=>StorybookArt.hand.every(x=>x.svg.includes('data-book-material'))&&StorybookArt.placed.every(x=>x.svg.includes('data-book-material'))));
assert.ok(await p.evaluate(()=>Object.values(StorybookArt.scenes).every(x=>x.includes('data-book-material'))));
for(const [width,height]of [[320,520],[375,764]]){
 await p.setViewportSize({width,height});await open('index.html');await p.waitForTimeout(300);
 await p.screenshot({path:`tests/screenshots/book-title-${width}.png`});
 await p.evaluate(()=>{titleScreenOpen=false;gameState.onboarding.status='done';gameState.campaign.phase='room';gameState.campaign.requiredVisit=null;gameState.cats[0].status='raising';gameState.ui.modal=null;render(gameState);});
 await p.waitForTimeout(300);
 assert.ok(await p.locator('[data-fur-overlay]').count()>0);
 const dims=await p.evaluate(()=>[document.documentElement.scrollWidth,document.documentElement.scrollHeight]);assert.deepEqual(dims,[width,height]);
 const before=await p.locator('[data-room-world]').getAttribute('style');await p.evaluate(()=>render(gameState));assert.equal(await p.locator('[data-room-world]').getAttribute('style'),before);
 await p.screenshot({path:`tests/screenshots/book-room-${width}.png`});
}
await open('art/cat-directions/scene-study.html');await p.click('[data-id="opening"]');await p.locator('#detail').screenshot({path:'tests/screenshots/book-opening.png'});
await open('art/cat-directions/toy-study.html');assert.ok(await p.locator('[data-book-material]').count()>0);await p.screenshot({path:'tests/screenshots/book-toys.png'});
await open('art/cat-directions/room-study.html');for(const season of ['spring','summer','autumn','winter']){await p.selectOption('#season',season);assert.ok(await p.locator('#outside [data-book-material]').count()>0);}
await open('art/cat-directions/cat-lab.html');assert.ok(await p.locator('[data-fur-overlay]').count()>0);
assert.deepEqual(errors,[]);console.log('PASS: scenes, toys, room seasons, cat rig, mobile sizes, stable redraw');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
