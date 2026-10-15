const {chromium}=require('playwright'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url'),path=require('node:path');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const p=await browser.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 const url=pathToFileURL(path.resolve('index.html')).href;
 await p.goto(url+'?check=1&scenario=event');
 const result=await p.evaluate(()=>{
  const s={...gameState,onboarding:{status:'active'},flags:{...gameState.flags,firstIntake:false},album:[],campaign:{...gameState.campaign,area:'a4'}};
  const samples=Array.from({length:50},()=>rollEncounter(s,'starter_food'));
  const once=tutorialCheckpoint(s,'captured'),twice=tutorialCheckpoint(once,'captured');
  gameState={...once,campaign:{...once.campaign,encounter:samples[0]}};saveGameState(gameState);
  return {valid:samples.every(e=>e.cat.age==='adult'&&!e.cat.body.sick&&!e.cat.rescueProfile.condition&&e.cat.body.weight===3100),same:once===twice,cat:samples[0].cat,price:FIRST_ACTIVITY.starterSetPrice};
 });
 assert(result.valid);assert(result.same);assert.equal(result.price,10);
 await p.goto(url+'?check=1');
 assert(await p.evaluate(()=>tutorialProgress(gameState).completed.captured));
 assert.deepEqual(await p.evaluate(()=>gameState.campaign.encounter.cat),result.cat);
 assert.deepEqual(errors,[]);console.log('PASS first adult/healthy guarantee, idempotent checkpoints, persisted encounter and price contract');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
