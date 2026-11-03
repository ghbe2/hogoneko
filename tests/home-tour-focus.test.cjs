const {chromium}=require('playwright'),assert=require('node:assert/strict'),{pathToFileURL}=require('url'),path=require('path');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
for(const viewport of [{width:320,height:568},{width:375,height:812},{width:485,height:907}]){
 const p=await browser.newPage({viewport});await p.goto((process.env.GAME_URL||pathToFileURL(path.resolve('index.html')).href)+'?check=1&scenario=room');
 if(await p.locator('#password').count()){await p.fill('#password','hogohogo');await p.click('#enter');}
 await p.waitForFunction(()=>typeof gameState!=='undefined');await p.evaluate(()=>document.fonts.ready);
 for(const step of ['profile','vitals','calendar','pay','play','clean','food','items']){
 await p.evaluate(step=>{titleScreenOpen=false;gameState.onboarding={...gameState.onboarding,status:'done',guide:null,homeTour:step};gameState.ui={...gameState.ui,modal:['profile','vitals','calendar','pay'].includes(step)?'notebook':null,alphaNotice:null,alphaMailbox:false};render(gameState)},step);
 await p.waitForTimeout(1500);
 const verify=async()=>{const result=await p.evaluate(()=>{const step=HOME_TOUR.find(s=>s[0]===gameState.onboarding.homeTour),r=app.querySelector(step[1]).getBoundingClientRect(),f=app.querySelector('.home-tour-focus').getBoundingClientRect();return [f.left-r.left,f.top-r.top,f.right-r.right,f.bottom-r.bottom]});result.forEach((n,i)=>assert(Math.abs(n-(i<2?-3:3))<.6,`${step} ${JSON.stringify(result)}`));};
 await verify();await p.setViewportSize({width:viewport.width+24,height:viewport.height+37});await p.waitForTimeout(600);await verify();await p.setViewportSize(viewport);await p.waitForTimeout(600);await verify();
 if(step==='clean')await p.screenshot({path:`tests/screenshots/clean-focus-${viewport.width}.png`});
 }
 console.log('PASS all eight guide targets, resize and restore',viewport.width);await p.close();
}
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});


