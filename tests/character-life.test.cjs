const {chromium}=require('playwright'),sharp=require('sharp'),assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
for(const [width,height]of [[320,568],[375,812]]){
 const p=await browser.newPage({viewport:{width,height}}),errors=[];p.on('pageerror',e=>{errors.push(e.message);console.log(e.message)});
 await p.goto(pathToFileURL(path.resolve('index.html')).href+'?check=1&scenario=room');
 for(const scene of ['senior','clinic','doctor','plaza','store','visitor']){
  if(scene==='senior'){await p.goto(pathToFileURL(path.resolve('index.html')).href+'?check=1&scenario=intro');await p.click('[data-action="start-game"]');await p.waitForTimeout(3000);}
  else await p.evaluate(scene=>{
   titleScreenOpen=false;gameState.onboarding={status:'done',homeTour:'done',guide:null,appIntro:null};gameState.ui={...gameState.ui,modal:null,layoutMode:false};const c=getCat(gameState);c.status='raising';
   gameState.campaign={...gameState.campaign,phase:'shop',shopId:scene==='store'?'petshop':scene,clinicReception:true,clinicStep:null,adoptionRun:null};
   if(scene==='senior'){gameState.onboarding={status:'story',storyIndex:1};gameState.campaign.phase='room';}
   if(scene==='doctor'){c.status='captured';gameState.campaign.phase='clinic';gameState.campaign.shopId='clinic';gameState.campaign.clinicStep='exam';gameState.campaign.firstExamAt=Date.now()+60000;}
   if(scene==='visitor'){Object.assign(c,{surgery:{status:'done'},heart:90});gameState.campaign.phase='graduation';gameState.campaign.adoptionRun={catId:c.id,status:'playing',outcome:'adopted',grade:'high',startedAt:Date.now()-26000};}
   render(gameState);
   if(scene==='senior'&&!app.querySelector('.senior-head')){app.innerHTML=renderOpeningStory(gameState);}
   if(scene==='doctor'&&!app.querySelector('.first-doctor')){app.innerHTML='<section class="first-exam"><div class="first-doctor">'+firstExamArt()+'</div></section>';}
   if(scene==='visitor'){adoptionView.walkers.forEach((n,i)=>adoptionPosition(n,20+i*42,true,false));}
  },scene);
  const selector=scene==='senior'?'.senior-head':scene==='store'?'.actor-bird-head':scene==='visitor'?'.adoption-head':'.reception-staff-head';
  await p.waitForSelector(selector,{state:'attached'});
  const frames=[],transforms=[];
  for(let i=0;i<4;i++){
   await p.waitForTimeout(1800);
   if(scene==='visitor')await p.evaluate(()=>adoptionView.walkers.forEach((n,i)=>adoptionPosition(n,20+i*42,true,false)));
   transforms.push(await p.locator('.actor-look').first().evaluate(n=>getComputedStyle(n).transform));
   frames.push(await p.screenshot());
  }
  assert(new Set(transforms).size>1,scene+' face does not move');
  assert.equal(await p.evaluate(()=>document.documentElement.scrollHeight>innerHeight+1),false,scene+' scroll');
  await sharp({create:{width:width*4,height,channels:4,background:'#fff'}}).composite(frames.map((input,i)=>({input,left:i*width,top:0}))).png().toFile(`tests/screenshots/character-${scene}-${width}.png`);
  if(scene==='store')assert.equal(await p.locator('.actor-bird-head,.actor-rabbit-ear-back').count(),2);
  const count=await p.locator('.actor-look').count();await p.evaluate(()=>render(gameState));
  assert.equal(await p.locator('.actor-look').count(),count,scene+' redraw keeps one rig per actor');
  console.log('PASS',width,scene,'7.2 seconds, four actual frames, face motion and viewport');
 }
 await p.emulateMedia({reducedMotion:'reduce'});assert.equal(await p.locator('.actor-look').first().evaluate(n=>getComputedStyle(n).animationName),'none');
 assert.deepEqual(errors,[]);await p.close();
}
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
