const{chromium}=require('playwright'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url'),path=require('node:path');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{const p=await b.newPage({viewport:{width:375,height:764}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(pathToFileURL(path.resolve('index.html')).href+'?check=1&scenario=room');
const report=await p.evaluate(async()=>{
 let s=structuredClone(gameState),actions=0;const reports=[];
 function act(action){s=reduceGameState(s,action);actions++;}
 function care(action){act({type:'START_CARE',...action});if(s.ui.careAnimation)act({type:'FINISH_CARE',id:s.ui.careAnimation.id});}
 function buy(id){const p=productById(id);if(s.coins<p.price)ad();act({type:'BUY_SHOP_ITEM',itemId:id});}
 function ad(){act({type:'OPEN_WALLET'});const token='test-'+actions;act({type:'START_REWARD_AD',token});s={...s,ui:{...s.ui,adStartedAt:Date.now()-3100}};act({type:'COMPLETE_REWARD_AD',token});act({type:'CLOSE_WALLET'});}
 async function visit(){if(!s.campaign.requiredVisit)return;act({type:'OPEN_OUTING'});act({type:'OPEN_REQUIRED_VISIT'});if(s.campaign.phase==='shop'){if(surgeryEligibility(s).ready){if(s.coins<12)ad();act({type:'START_SURGERY'});await new Promise(r=>setTimeout(r,2300));act({type:'FINISH_SURGERY'});}act({type:'LEAVE_SURGERY_CLINIC'});}}
 for(let round=0;round<2;round++){
  const beginCoins=s.coins,beginAds=s.economy?.adClaims||0,startActions=actions,days=[];
  for(const id of ['bowl','water','litter'])if(!getPlaced(getRoom(s)).some(p=>p.itemId===id))act({type:'TOGGLE_PLACED_ITEM',itemId:id});
  if(s.ui.layoutMode)act({type:'SAVE_LAYOUT'});
  const toys=SHOP_CATALOG.filter(p=>p.category==='play'&&shopUnlocked(s,p.id)&&getAffinity(getCat(s),getItem(p.id)).score>=0).sort((a,b)=>a.price-b.price).slice(0,3);
  for(const toy of toys)if(!owned(s,toy.id))buy(toy.id);
  for(let tick=0;tick<48;tick++){
   await visit();if(s.campaign.phase!=='room')throw Error('not room '+s.campaign.phase);
   if(tick%4===0){
    for(let n=0;n<4&&getCat(s).body.foodLevel<100;n++)care({operation:'food',foodId:'starter_food'});
    for(let n=0;n<4&&getCat(s).body.waterLevel<100;n++)care({operation:'water'});
    for(const problem of ['litter','vomit'])for(let n=0;n<15&&getCat(s).body[problem]>0;n++)care({operation:'clean',problem,cleanerId:'starter_clean'});
    for(let n=0;n<30&&getCat(s).body.hair.length;n++)care({operation:'clean',problem:'hair',hairId:getCat(s).body.hair[0].id,cleanerId:'starter_clean'});
   }
   if(tick%8===0){
    for(const id of ['starter_toy',...toys.map(t=>t.id)]){if(!owned(s,id)&&id!=='starter_toy')buy(id);act({type:'FINISH_PLAY',itemId:id});}
    act({type:'EXECUTE_CONTACT',contact:'call'});act({type:'TOUCH_NOW'});if(s.ui.careAnimation)act({type:'FINISH_CARE',id:s.ui.careAnimation.id});
   }
   act({type:'ADVANCE_THREE_HOURS'});
   if(tick%8===7){days.push({day:getCat(s).body.days+1,heart:getCat(s).heart,weight:getCat(s).body.weight,food:getCat(s).body.satiety,water:getCat(s).body.hydration,dirty:getCat(s).body.litter});
    // Round-trip through the same serializer/migration used for save recovery.
    s=normalizeLoadedState(JSON.parse(JSON.stringify(s)));
   }
  }
  await visit();if(s.campaign.phase==='room'){act({type:'OPEN_OUTING'});act({type:'OPEN_REQUIRED_VISIT'});}
  if(s.coins<6)ad();act({type:'SEND_EVENT'});
  reports.push({round:round+1,days,phase:s.campaign.phase,outcome:s.campaign.outcome,surgery:getCat(s).surgery,coins:s.coins,ads:(s.economy?.adClaims||0)-beginAds,spent:beginCoins+50*((s.economy?.adClaims||0)-beginAds)-s.coins,actions:actions-startActions});
  if(s.campaign.phase!=='result')throw Error(JSON.stringify(reports));
  const inv=JSON.stringify(s.inventory);act({type:'NEXT_RESCUE'});if(JSON.stringify(s.inventory)!==inv)throw Error('inventory lost');
  if(round===0){
   act({type:'GO_RESCUE'});
   // Trap waiting is covered by the UI flow test; supply its ready state here.
   s={...s,campaign:{...s.campaign,trapPlaced:true,trapReady:true,trapWaiting:true,bait:['starter_food']}};
   act({type:'OPEN_TRAP'});act({type:'GO_CLINIC'});act({type:'START_NAMING'});if(s.coins<12)ad();act({type:'START_INTAKE',name:'つづき'});
   const furniture=SHOP_CATALOG.filter(p=>p.category==='furniture'&&shopUnlocked(s,p.id)&&getAffinity(getCat(s),getItem(p.id)).score>0).sort((a,b)=>a.price-b.price);
   for(const f of furniture){if(getRoomComfortBreakdown(s).canExit)break;if(!owned(s,f.id))buy(f.id);if(!getPlaced(getRoom(s)).some(p=>p.itemId===f.id))act({type:'TOGGLE_PLACED_ITEM',itemId:f.id});}
   act({type:'CALL_INTAKE_CAT'});act({type:'ACCEPT_CAT'});if(s.campaign.phase!=='room')throw Error('intake blocked '+JSON.stringify(getRoomComfortBreakdown(s)));act({type:'CLOSE_SCHEDULE_INTRO'});
  }
 }
 return {reports,album:s.album.length};
});console.log(JSON.stringify(report,null,2));assert.equal(report.album,2);assert(report.reports.every(r=>r.surgery?.status==='done'));assert.deepEqual(errors,[]);console.log('PASS two care cycles, chronological ticks, surgery, graduation, supplies and save round-trip');}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
