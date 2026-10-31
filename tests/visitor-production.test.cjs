const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{
 for(const [width,height] of [[320,568],[375,812]]){
  const p=await b.newPage({viewport:{width,height}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(pathToFileURL(path.resolve('index.html')).href+'?check=1&scenario=room');
  await p.evaluate(()=>{titleScreenOpen=false;gameState.onboarding={...gameState.onboarding,status:'done',guide:null,appIntro:null,homeTour:'done'};gameState.ui={...gameState.ui,alphaNotice:null,modal:null,layoutMode:false};const c=getCat(gameState);Object.assign(c,{name:'こむぎ',named:true,status:'raising',age:'adult',surgery:{status:'done',completedDay:5},heart:85,returnTutorial:false,carePlan:{version:2,surgeryDay:5,eventDay:7,notices:{'event:7':true}}});Object.assign(c.body,{days:6,weight:2247,sick:false});gameState.campaign={...gameState.campaign,phase:'graduation',adoptionRun:null,requiredVisit:null};gameState.realClock={version:1,processedAt:gameNow(),dayTicks:0};render(gameState);dispatch({type:'BEGIN_ADOPTION'});});
  for(const familyIndex of [0,1,2,3,4,5]){
   await p.evaluate(i=>{gameState.campaign.adoptionRun.familyIndex=i;render(gameState);},familyIndex);
   assert.equal(await p.locator('.adoption-walkway svg[data-visitor-hip]').count(),8);
   for(const seconds of [6,31,33,35,39]){
    await p.evaluate(s=>{gameState.campaign.adoptionRun.startedAt=Date.now()-s*1000;paintAdoption(adoptionView,performance.now());},seconds);
    await p.waitForTimeout(180);
    assert(await p.evaluate(()=>[...document.querySelectorAll('.adoption-person .visitor-rear-arm-layer')].every(n=>n.nextElementSibling.classList.contains('visitor-shaped-legs'))));
    if(seconds===35)assert.equal(await p.locator('.adoption-carrying .adoption-main .visitor-arm-far').evaluate(n=>getComputedStyle(n).visibility),'hidden');
    if(familyIndex===0||familyIndex===4)await p.screenshot({path:`tests/screenshots/visitor-production-${width}-${familyIndex}-${seconds}.png`});
   }
  }
  assert.deepEqual(errors,[]);assert(await p.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1));
  console.log('PASS',width,'all six families, companions, walk, handover, carrying, departure');await p.close();
 }
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
