const{chromium}=require('playwright'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url'),path=require('node:path');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{const p=await b.newPage();await p.goto(pathToFileURL(path.resolve('index.html')).href+'?check=1&scenario=room');await p.waitForTimeout(500);
 const data=await p.evaluate(()=>{
  const start=new Date(2026,9,7,0).getTime(),end=start+86400000;
  let s=structuredClone(gameState);s.cats[0].status='raising';s.realClock={version:1,processedAt:start,dayTicks:0};const before=s.cats[0].body.lifeTicks||0;
  s=syncRealTime(s,end);const ticks=(s.cats[0].body.lifeTicks||0)-before;const again=syncRealTime(s,end);
  let intake=structuredClone(gameState);intake.campaign.phase='intake';intake.campaign.intakeCalled=false;intake.onboarding.status='active';intake.album=[];intake.flags.firstCatWelcomed=false;
  const called=reduceGameState(intake,{type:'CALL_INTAKE_CAT'}),accepted=reduceGameState(called,{type:'ACCEPT_CAT'});
  return {ticks,noReplay:again.cats[0].body.lifeTicks===s.cats[0].body.lifeTicks,night:careSlotsBetween(new Date(2026,9,7,20).getTime(),new Date(2026,9,8,6).getTime()),called:called.campaign.intakeCalled,accepted:accepted.campaign.phase,flag:accepted.flags.firstCatWelcomed,bowls:[bowlSVG(false,0),bowlSVG(false,50),bowlSVG(false,100),bowlSVG(true,100)]};
 });assert.equal(data.ticks,3);assert(data.noReplay);assert.equal(data.night,0);assert(data.called);assert.equal(data.accepted,'room');assert(data.flag);assert.equal(new Set(data.bowls).size,4);
 for(const [width,height]of[[320,520],[375,764]]){await p.setViewportSize({width,height});await p.evaluate(()=>{gameState.ui.modal=null;render(gameState);});const r=await p.locator('.stage').boundingBox();assert.deepEqual(r,{x:0,y:0,width,height});await p.screenshot({path:`tests/screenshots/room-overlay-${width}.png`});}
 console.log('PASS 3 daily care slots, no overnight/replayed care, guaranteed first welcome, distinct bowl amounts, full viewport room');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
