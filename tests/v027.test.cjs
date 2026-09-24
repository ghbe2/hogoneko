const {chromium}=require('playwright'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url'),path=require('node:path');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const p=await browser.newPage({viewport:{width:375,height:812}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(pathToFileURL(path.resolve('index.html')).href);
 const result=await p.evaluate(()=>{
  const now=Date.now(),hour=3600000;
  window.fixture=()=>{const s=JSON.parse(JSON.stringify(gameState));s.onboarding.status='done';s.campaign={...s.campaign,phase:'room',requiredVisit:null};s.ui.modal=null;s.cats[0]={...s.cats[0],status:'raising',heart:60,heartCap:60,surgeryVisitDay:null,eventVisitDay:null,body:{...s.cats[0].body,days:0,weight:3100,weightHistory:[3100],satiety:70,hydration:70,foodLevel:100,waterLevel:100,litter:0,vomit:0,hair:[],digestion:[],lifeTicks:0,realNeglectTicks:{}}};s.realClock={version:1,processedAt:now,dayTicks:0};return s;};
  const originalFixture=fixture;window.fixture=()=>{const s=originalFixture();s.cats[0].types=[];return s;};
  const start=fixture(),full=syncRealTime(start,now+72*hour),same=syncRealTime(full,now+72*hour),back=syncRealTime(full,now);
  let sequential=start;for(let i=1;i<=24;i++)sequential=syncRealTime(sequential,now+i*3*hour);
  const hungry=fixture();hungry.cats[0].body.foodLevel=0;hungry.cats[0].body.waterLevel=0;
  const empty=syncRealTime(hungry,now+72*hour),partial=syncRealTime(start,now+2*hour),one=syncRealTime(partial,now+3*hour);
  const overdue=syncRealTime(start,now+8*24*hour),long=syncRealTime(start,now+30*24*hour);
  const c=getCat(full),e=getCat(empty),q=getCat(sequential);
  return {days:c.body.days,ticks:c.body.lifeTicks,weight:c.body.weight,heart:c.heart,cap:c.heartCap,food:c.body.foodLevel,water:c.body.waterLevel,history:c.body.weightHistory.length,same:JSON.stringify(full)===JSON.stringify(same),back:JSON.stringify(full)===JSON.stringify(back),seq:[q.body.days,q.body.weight,q.heart,q.body.lifeTicks],fedBetter:c.body.realNeglectTicks.food<e.body.realNeglectTicks.food&&c.body.weight>e.body.weight,partial:partial.realClock.processedAt===now,one:one.cats[0].body.lifeTicks,overdue:overdue.campaign.requiredVisit.kind,longDays:long.cats[0].body.days};
 });
 assert.equal(result.days,3);assert.equal(result.ticks,24);assert.equal(result.cap,90);assert.equal(result.food,0);assert.equal(result.water,0);assert.equal(result.history,4);assert(result.weight<3100);assert(result.heart<60);assert(result.same);assert(result.back);assert(result.fedBetter);assert(result.partial);assert.equal(result.one,1);assert.equal(result.overdue,'clinic');assert.equal(result.longDays,30);assert.deepEqual(result.seq,[result.days,result.weight,result.heart,result.ticks]);
 // Persisted cursor survives boot-time autosaves, catches up once, and survives another reload.
 await p.evaluate(()=>{gameState=fixture();gameState.realClock.processedAt=Date.now()-72*3600000;saveGameState(gameState);});
 await p.reload();const first=await p.evaluate(()=>({day:getCat(gameState).body.days,heart:getCat(gameState).heart,cursor:gameState.realClock.processedAt}));assert.equal(first.day,3);
 await p.reload();assert.deepEqual(await p.evaluate(()=>({day:getCat(gameState).body.days,heart:getCat(gameState).heart,cursor:gameState.realClock.processedAt})),first);
 await p.locator('[data-action="start-game"]').click();
 const debug=await p.evaluate(()=>{const before=getCat(gameState).body.lifeTicks,cursor=gameState.realClock.processedAt;dispatch({type:'ADVANCE_THREE_HOURS'});dispatch({type:'LIFE_TICK'});dispatch({type:'RETURN_FROM_AWAY',ticks:56,at:Date.now()});return {ticks:getCat(gameState).body.lifeTicks-before,cursor:gameState.realClock.processedAt===cursor};});assert.deepEqual(debug,{ticks:1,cursor:true});
 await p.evaluate(()=>dispatch({type:'OPEN_SCHEDULE'}));assert.equal(await p.locator('[data-action="end-day"]').count(),0);
 // Old saves retain their original timestamp even though earlier modules autosave on boot.
 await p.addInitScript(()=>{const key='hogoneko_mock_save',raw=JSON.parse(localStorage.getItem(key));delete raw.state.realClock;raw.state.cats[0].body.days=0;raw.state.cats[0].body.lifeTicks=0;raw.state.campaign.requiredVisit=null;raw.state.campaign.phase='room';raw.savedAt=Date.now()-72*3600000;localStorage.setItem(key,JSON.stringify(raw));});
 await p.reload();assert.equal(await p.evaluate(()=>getCat(gameState).body.days),3);assert.equal(await p.evaluate(()=>getCat(gameState).body.lifeTicks),24);
 // Candidate cats do not accrue days or penalties while awaiting the first rescue.
 const candidate=await p.evaluate(()=>{const s=JSON.parse(JSON.stringify(gameState));s.cats[0].status='candidate';const heart=s.cats[0].heart,days=s.cats[0].body.days;const n=syncRealTime(s,s.realClock.processedAt+72*3600000);return n.cats[0].heart===heart&&n.cats[0].body.days===days;});assert(candidate);
 assert.deepEqual(errors,[]);console.log('PASS v027: real 72h, provisions, penalties, chronological equivalence, remainder, rollback, 30 days, reload exactly once, debug, old-save migration and candidate immunity');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
