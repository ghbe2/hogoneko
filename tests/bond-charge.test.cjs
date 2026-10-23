const{chromium}=require('playwright'),sharp=require('sharp'),assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{for(const [width,height]of [[320,568],[375,812]]){
 const p=await b.newPage({viewport:{width,height}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(pathToFileURL(path.resolve('index.html')).href+'?check=1&scenario=room');
 await p.evaluate(()=>{titleScreenOpen=false;gameState.onboarding={status:'done',homeTour:'done',guide:null,appIntro:null};gameState.ui={...gameState.ui,modal:null,layoutMode:false};getCat(gameState).heart=20;render(gameState);});
 const frames=[],sizes=[];
 for(const charge of [1,5,9]){await p.evaluate(n=>beginBond(getCat(gameState),20,20+n,true),charge);await p.waitForTimeout(250);assert.equal(await p.locator('.bond-cluster').getAttribute('data-charge'),String(charge));assert.equal(await p.locator('.bond-cluster').getAttribute('data-total'),'20');sizes.push((await p.locator('.bond-heart').boundingBox()).width);frames.push(await p.screenshot());}
 assert(sizes[0]>=21&&sizes[0]<sizes[1]&&sizes[1]<sizes[2]&&sizes[2]<34,'readable 1, growing through 9, smaller than previous heart');
 await p.evaluate(()=>beginBond(getCat(gameState),20,30,true));await p.waitForTimeout(100);assert.equal(await p.locator('.bond-cluster').getAttribute('data-charge'),'10');assert.equal(await p.locator('.bond-cluster').getAttribute('data-total'),'20');frames.push(await p.screenshot());
 await p.waitForTimeout(260);assert.equal(await p.locator('.bond-particle').count(),6);frames.push(await p.screenshot());
 await p.waitForTimeout(650);assert.equal(await p.locator('.bond-cluster').getAttribute('data-total'),'30');assert.equal(await p.locator('.bond-cluster').getAttribute('data-charge'),'0');frames.push(await p.screenshot());
 assert.equal(await p.evaluate(()=>getCat(gameState).heart),20,'presentation cannot award real points');
 await sharp({create:{width:width*6,height,channels:4,background:'#fff'}}).composite(frames.map((input,i)=>({input,left:i*width,top:0}))).png().toFile(`tests/screenshots/bond-charge-${width}.png`);
 await p.evaluate(()=>{beginBond(getCat(gameState),20,99);render(gameState);});await p.waitForTimeout(1000);await p.evaluate(()=>beginBond(getCat(gameState),20,100));await p.waitForTimeout(1050);assert.equal(await p.locator('.bond-cluster').getAttribute('data-total'),'100');assert.equal(await p.locator('.bond-heart').evaluate(n=>getComputedStyle(n).visibility),'hidden');
 await p.emulateMedia({reducedMotion:'reduce'});await p.evaluate(()=>{heartShow.until=0;beginBond(getCat(gameState),20,30);});await p.waitForTimeout(80);assert.equal(await p.locator('.bond-cluster').getAttribute('data-total'),'30');assert.equal(await p.locator('.bond-particle').count(),0);
 await p.emulateMedia({reducedMotion:'no-preference'});
 const icon=await p.locator('.main-command-row [data-tab="play"]').boundingBox();await p.mouse.move(icon.x+icon.width/2,icon.y+icon.height/2);await p.mouse.down();await p.mouse.move(width/2,height*.6,{steps:12});await p.waitForTimeout(1400);assert(await p.locator('.bond-cluster').count());await p.mouse.up();
 assert.equal(await p.evaluate(()=>document.documentElement.scrollHeight>innerHeight+1),false);assert.deepEqual(errors,[]);console.log('PASS',width,'1/5/9 size, 10 burst → 100-scale absorption, cap, redraw, reduced motion, real toy drag');await p.close();
}}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
