const {chromium}=require('playwright'),assert=require('node:assert/strict');
const {openGame}=require('./helpers/game-page.cjs');
(async()=>{const b=await chromium.launch({channel:'chrome'});try{
 const p=await b.newPage({timezoneId:'Asia/Tokyo',viewport:{width:375,height:812},hasTouch:true,isMobile:true}),errors=[];p.on('pageerror',e=>errors.push(e.message));p.setDefaultTimeout(5000);
 await openGame(p,'room');
 const result=await p.evaluate(()=>{
  const base=structuredClone(gameState),at=Date.UTC(2026,10,4,0),rows=[];
  for(const food of ['food_dry','food_wet','food_kitten']){
   let s=structuredClone(base);let cat=getCat(s);Object.assign(cat,{age:'kitten',initialAge:'kitten',types:['solo','high'],heart:30});Object.assign(cat.body,{weight:920,days:0,realNeglectTicks:{},sick:false});
   s.realClock={version:1,processedAt:at,careProcessedAt:at,dayTicks:0};let reached=null;
   for(let i=1;i<=8*20;i++){
    cat=getCat(s);Object.assign(cat.body,{bowlFood:food,foodLevel:100,waterLevel:100,litter:0,vomit:0});
    s=syncRealTime(s,at+i*REAL_TICK_MS);if(!reached&&getCat(s).body.weight>=1500)reached=i/8;
   }
   rows.push({food,reached,heart:getCat(s).heart,days:getCat(s).body.days});
  }
  let s=structuredClone(base);getCat(s).body.days=4;s.realClock={version:1,processedAt:at-60000,dayTicks:5};s=syncRealTime(s,at-1);const before=getCat(s).body.days;s=syncRealTime(s,at);const after=getCat(s).body.days;s=syncRealTime(s,at+60000);
  return {rows,before,after,repeat:getCat(s).body.days,start:careDayKey(at-1),end:careDayKey(at)};
 });console.log(JSON.stringify(result));
 assert.equal(result.after,result.before+1);assert.equal(result.repeat,result.after);
 assert(result.rows[0].reached>=12&&result.rows[0].reached<=14);
 assert(result.rows[2].reached>=9&&result.rows[2].reached<=11);
 assert(result.rows.every(r=>r.heart<80&&r.days===20));
 const careOnly=await p.evaluate(()=>{
  let s=structuredClone(gameState);
  const start=gameNow();s.realClock={version:1,processedAt:start,dayTicks:0};s.dailyDiscovery={lastDay:discoveryDay()};
  Object.assign(getCat(s),{age:'adult',initialAge:'adult',status:'raising',types:['human','food'],heart:30,heartCap:100,trustGainRate:1});
  for(let i=0;i<8*14;i++){
   s=syncRealTime(s,start+(i+1)*REAL_TICK_MS);
   for(const [level,id] of [['foodLevel','food_dry'],['waterLevel','water_refill']]){
    if(getCat(s).body[level]>50)continue;
    s=reduceGameState(s,{type:'START_CARE',operation:'food',foodId:id});
    if(s.ui.careAnimation)s=reduceGameState(s,{type:'FINISH_CARE',id:s.ui.careAnimation.id});
   }
   if(i%24===0){s=reduceGameState(s,{type:'TOUCH_NOW',fromGesture:true});if(s.ui.careAnimation)s=reduceGameState(s,{type:'FINISH_CARE',id:s.ui.careAnimation.id});}
   getCat(s).body.litter=0;getCat(s).body.vomit=0;
  }
  return getCat(s).heart;
 });console.log('14 days, refill food/water and occasional pet, start 30:',careOnly);assert(careOnly<81);
 const gates=await p.evaluate(()=>{
  const s=structuredClone(gameState),c=getCat(s);Object.assign(c,{initialAge:'kitten',age:'kitten',status:'raising',carePlan:null,surgery:null,heart:79,heartCap:100,trustGainRate:1});Object.assign(c.body,{days:10,weight:1510,sick:false});c.recoveryUntilDay=0;
  const book=surgeryEligibility(s).canBook;c.body.days=9;const early=surgeryEligibility(s).canBook;c.body.days=10;c.body.weight=1499;const light=surgeryEligibility(s).canBook;
  c.body.weight=1510;c.carePlan={version:2,surgeryDay:12,eventDay:null,notices:{}};const fast=applySurgeryFasting(s);c.body.days=11;const surgery=surgeryEligibility(s).ready;
  const gain=(op,affinity)=>applyAffinityHeart(s,c,{operation:op,affinity,rawHeartDelta:30}).nextHeart;
  return {book,early,light,surgery,fast:getCat(fast).body.surgeryFoodStored!==undefined,pet:gain('pet','superMatch'),neutral:gain('play','neutral'),liked:gain('play','match'),areas:['a2','a3','a4'].map(id=>stageProgress(s,id).total)};
 });assert.deepEqual(gates,{book:true,early:false,light:false,surgery:true,fast:true,pet:80,neutral:80,liked:100,areas:[6,8,null]});
 await p.evaluate(()=>{
  titleScreenOpen=false;gameState.onboarding={status:'done',guide:null,homeTour:'done'};gameState.album=[{catId:'first',name:'はな',outcome:'adopted'}];
  Object.assign(gameState.campaign,{phase:'clinic',clinicStep:'summary',area:'a2',initialVisitPaidCatId:null});
  Object.assign(getCat(gameState),{status:'captured',returnTutorial:true,age:'kitten',initialAge:'kitten'});getCat(gameState).phenotype={...phenotypeFor(getCat(gameState)),age:'kitten'};gameState.coins=50;render(gameState);
 });
 await p.locator('[data-first="pay"]').tap();await p.waitForSelector('[data-kitten-lesson]');
 await p.evaluate(()=>dispatch({type:'GO_HOME'}));assert.equal(await p.evaluate(()=>gameState.campaign.phase),'shop');
 await p.locator('[data-kitten-lesson]').tap();await p.waitForFunction(()=>gameState.campaign.parkKittenLesson===1);
 await p.screenshot({path:'tests/screenshots/park-kitten-lesson.png'});
 await p.reload();await p.evaluate(()=>{titleScreenOpen=false;render(gameState)});
 await p.locator('[data-kitten-lesson]').tap();await p.waitForFunction(()=>gameState.campaign.phase==='intake');
 await p.evaluate(()=>{gameState.campaign.phase='shop';gameState.campaign.shopId='super';gameState.ui.shopTab='food';gameState.ui.modal=null;gameState.coins=50;render(gameState)});
 await p.locator('[data-store="detail"][data-id="food_kitten"],[data-store="detail"][data-item="food_kitten"]').first().tap();
 await p.locator('[data-store="add"]').tap();await p.locator('[data-store="checkout"]').tap();
 assert.equal(await p.evaluate(()=>gameState.inventory.food_kitten),6);
 assert.deepEqual(errors,[]);console.log('PASS day, heart, food, surgery, area goals, mandatory lesson and reload');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});

