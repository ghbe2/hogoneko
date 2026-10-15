const {chromium}=require('playwright'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url'),path=require('node:path');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
const p=await browser.newPage({viewport:{width:900,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(pathToFileURL(path.resolve('art/cat-directions/scene-study.html')).href);
assert.equal(await p.locator('[data-id="opening"] [data-plant-material="leaf"]').count(),2);assert.equal(await p.locator('[data-id="opening"] [data-plant-material="grass"]').count(),1);assert.equal(await p.locator('[data-id="clinic"] [data-plant-material]').count(),0);
await p.click('[data-id="opening"]');await p.locator('#detail').screenshot({path:'tests/screenshots/plants-opening.png'});await p.click('#close');
for(const season of ['spring','summer','autumn','winter']){await p.selectOption('#field-season',season);assert.equal(await p.locator('[data-id="field"] [data-plant-material="leaf"]').count(),2);assert.equal(await p.locator('[data-id="park"] [data-plant-material="grass"]').count(),1);}
await p.goto(pathToFileURL(path.resolve('index.html')).href);
for(const [width,height] of [[320,520],[375,764]]){await p.setViewportSize({width,height});await p.waitForTimeout(300);assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight));assert.ok(await p.locator('.title-screen').evaluate(n=>decodeURIComponent(n.style.backgroundImage).includes('data-plant-material')));await p.screenshot({path:`tests/screenshots/plants-title-${width}.png`});}
assert.deepEqual(errors,[]);console.log('PASS plants: opening, fields, 4 seasons, clinic untouched, mobile title');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
