const{chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{
 for(const [width,height]of [[320,568],[375,812]]){
 const p=await b.newPage({viewport:{width,height}}),errors=[];p.on('pageerror',e=>errors.push(e.message));const url=pathToFileURL(path.resolve('index.html')).href;
 for(const scenario of ['intro','field','capture','clinic','naming','intake','room','event','result']){
  await p.goto(url+'?check=1&scenario='+scenario);
  if(scenario==='intro')await p.click('[data-action="start-game"]');
  else await p.evaluate(()=>{titleScreenOpen=false;gameState.onboarding={...gameState.onboarding,status:'done',guide:null,homeTour:'done',appIntro:null};gameState.ui.modal=null;render(gameState);});
  await p.waitForTimeout(900);
  const result=await p.evaluate(()=>({phase:gameState.campaign.phase,cats:[...app.querySelectorAll('.game-cat-svg')].map(svg=>({shared:svg.dataset.catMotion==='shared',id:svg.dataset.catId,dna:svg.dataset.dna,pose:svg.dataset.pose})),overflow:document.documentElement.scrollHeight>innerHeight+1}));
  assert(!result.overflow,scenario+' page scroll');assert(result.cats.every(c=>c.shared),scenario+' old renderer');
  await p.screenshot({path:`tests/screenshots/shared-${width}-${scenario}.png`});console.log(width,scenario,result.phase,result.cats.length);
 }
 await p.goto(url+'?check=1&scenario=room');await p.evaluate(()=>{titleScreenOpen=false;gameState.onboarding={status:'done',homeTour:'done',guide:null,appIntro:null};gameState.ui={...gameState.ui,modal:null,layoutMode:false,scheduleIntro:false};render(gameState);});
 await p.click('[data-action="open-notebook"]');await p.waitForTimeout(600);assert(await p.locator('.app-profile .game-cat-svg').count());assert.equal(await p.locator('.app-profile .game-cat-svg').getAttribute('data-cat-motion'),'shared');await p.screenshot({path:`tests/screenshots/shared-${width}-app.png`});
 await p.evaluate(()=>{const c=getCat(gameState);gameState.album=[{...structuredClone(c),catId:c.id,outcome:'adopted',day:7,weight:c.body.weight}];render(gameState);});await p.click('.app-album i');await p.waitForTimeout(600);const photo=p.locator('.app-photo-view .game-cat-svg');assert.equal(await photo.getAttribute('data-cat-motion'),'shared');const before=await photo.innerHTML();await p.waitForTimeout(700);assert.equal(await photo.innerHTML(),before,'album remains a still photo');await p.click('[data-app-photo-pose]');await p.screenshot({path:`tests/screenshots/shared-${width}-album.png`});
 assert.deepEqual(errors,[]);await p.close();
 }console.log('PASS production shared renderer, 9 scene fixtures, app/photo interactions, static album, two viewport sizes');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
