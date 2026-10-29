const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{
 const p=await b.newPage({viewport:{width:1120,height:900}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('https://ghbe2.github.io/hogoneko/ui-color-review.html?verify=81560b0');
 if(await p.locator('#password').count()){await p.fill('#password',process.env.MOCK_VIEW_PASSWORD);await p.click('#enter');}
 await p.locator('.scenes button').first().waitFor();
 for(const scene of ['room','guide','map','clinic']){
 await p.click(`[data-scene="${scene}"]`);
 await p.waitForFunction(scene=>[...document.querySelectorAll('iframe')].every(f=>f.contentDocument?.documentElement?.dataset.paletteReview && f.contentDocument.documentElement.dataset.paletteScene===scene),scene,{timeout:90000});
 await p.waitForTimeout(3500);
 const detail=await Promise.all(p.frames().slice(1).map(f=>f.evaluate(()=>({phase:gameState.campaign.phase,guide:gameState.onboarding.guide,town:gameState.onboarding.townStep,hand:!!document.querySelector('.guide-gesture'),arrow:!!document.querySelector('.town-scroll-hint:not([hidden])'),buttons:[...document.querySelectorAll('.clinic-commands button,.home-tour button')].map(b=>({text:b.innerText,color:getComputedStyle(b).backgroundColor})),bounds:[app.clientWidth,app.clientHeight,app.scrollWidth,app.scrollHeight],cat:getCat(gameState).phenotype}))));
 console.log(scene,JSON.stringify(detail));
 assert(detail.every(x=>x.bounds[0]===x.bounds[2]&&x.bounds[1]>=x.bounds[3]-1));
 await p.screenshot({path:`tests/screenshots/palette-${scene}-desktop.png`,fullPage:true});
 }
 for(const width of [320,375]){await p.setViewportSize({width,height:width===320?568:812});await p.click('[data-scene="clinic"]');for(let i=0;i<3;i++){await p.locator('.colors button').nth(i).click();await p.waitForTimeout(1200);await p.screenshot({path:`tests/screenshots/palette-${width}-${i}.png`,fullPage:true});assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}}
 console.log('ERRORS',errors);assert.equal(errors.length,0);
 }finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});

