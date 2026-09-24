'use strict';
// One authoritative clock for online, offline and debugging. savedAt is not a cursor.
const REAL_TICK_MS=3*60*60*1000;
const REAL_TIME_TUNING={graceTicks:8,heartLossPerNeed:.1,adultWeightLoss:5,kittenWeightLoss:1};
function ensureRealClock(state,now=Date.now()){
 const clock=state.realClock;
 if(clock?.version===1&&Number.isFinite(clock.processedAt)&&Number.isInteger(clock.dayTicks)&&clock.dayTicks>=0&&clock.dayTicks<8)return state;
 return {...state,realClock:{version:1,processedAt:now,dayTicks:0}};
}
function advanceRealTicks(state,ticks){
 let next=state;
 for(let i=0;i<ticks;i++){
  // Reuse meals, drinking, digestion and shedding in chronological order, one tick at a time.
  next=advanceCatLife(next,1);
  let cat=getCat(next),body={...cat.body},ui={...next.ui},dayTicks=next.realClock.dayTicks+1;
  const missingFood=body.satiety<25,missingWater=body.hydration<25,dirty=body.litter>=3||body.vomit>0;
  const neglect={...(body.realNeglectTicks||{})};
  for(const [key,bad] of Object.entries({food:missingFood,water:missingWater,dirty}))neglect[key]=bad?(neglect[key]||0)+1:0;
  body.realNeglectTicks=neglect;
  const unmet=Object.values(neglect).filter(n=>n>REAL_TIME_TUNING.graceTicks).length;
  const loss=unmet*REAL_TIME_TUNING.heartLossPerNeed;
  cat={...cat,heart:Math.max(0,Math.round((cat.heart-loss)*10)/10)};
  if(neglect.food>REAL_TIME_TUNING.graceTicks)body.weight=Math.max(1,body.weight-(cat.age==='kitten'?REAL_TIME_TUNING.kittenWeightLoss:REAL_TIME_TUNING.adultWeightLoss));
  body.neglectDays=Math.floor(Math.max(...Object.values(neglect))/8);
  let week=next.week,durability=next.durability;
  if(dayTicks===8){
   dayTicks=0;body.days+=1;
   body.weightHistory=[...(body.weightHistory||[]),body.weight];
   cat.heartCap=Math.min(CONFIG.week.heartCapMax,cat.heartCap+CONFIG.week.heartCapPerDay);
   const dayOfWeek=(week.dayOfWeek+1)%7;
   week={...week,dayOfWeek,weekIndex:week.weekIndex+(dayOfWeek===CONFIG.game.weekStart?1:0)};
   ui.usedHandItems={};
   if(body.days%2===0){
    const furnishings=getPlaced(getRoom(next)).filter(p=>!getItem(p.itemId)?.essential&&getMaxDurability(p.itemId)&&getDurability(next,p.itemId)>0);
    const item=furnishings[body.days%Math.max(1,furnishings.length)];
    if(item){durability=changeDurability(next,item.itemId,-1);body.broken=worsenDamage(body.broken,item.itemId);}
   }
  }
  next={...next,week,durability,cats:next.cats.map(c=>c.id===cat.id?{...cat,body}:c),realClock:{...next.realClock,dayTicks},ui};
 }
 return next;
}
function syncRealTime(state,now=Date.now()){
 if(!Number.isFinite(now))return state;
 state=ensureRealClock(state,now);
 if(now<state.realClock.processedAt)return state; // Clock rollback never replays time.
 if(getCat(state).status!=='raising')return {...state,realClock:{...state.realClock,processedAt:now,dayTicks:0}};
 const ticks=Math.floor((now-state.realClock.processedAt)/REAL_TICK_MS);
 if(!ticks)return state;
 const next=advanceRealTicks(state,ticks);
 return reconcileVisit({...next,realClock:{...next.realClock,processedAt:state.realClock.processedAt+ticks*REAL_TICK_MS},lastSeenAt:now});
}
const beforeRealTimeReducer=reduceGameState;
reduceGameState=function(state,action){
 const now=action.type==='SYNC_REAL_TIME'&&Number.isFinite(action.at)?action.at:Date.now();
 state=syncRealTime(state,now);
 if(['SYNC_REAL_TIME','LEAVE_ROOM','RETURN_FROM_AWAY','LIFE_TICK'].includes(action.type))return state;
 if(['ADVANCE_THREE_HOURS','NEXT_DAY'].includes(action.type)&&getCat(state).status==='raising'){
  // Debug advances simulation only, without moving the wall-clock cursor into the future.
  const ticks=action.type==='NEXT_DAY'?8:1;
  return reconcileVisit(advanceRealTicks(state,ticks));
 }
 if(action.type==='POSTPONE_EVENT'&&state.campaign.phase==='graduation')return {...state,campaign:{...state.campaign,phase:'room'},ui:{...state.ui,modal:null}};
 const oldStatus=getCat(state).status;
 let next=beforeRealTimeReducer(state,action);
 if((oldStatus!=='raising'&&getCat(next).status==='raising')||(action.type==='NEXT_RESCUE'&&next!==state))next={...next,realClock:{version:1,processedAt:now,dayTicks:0},cats:next.cats.map(c=>({...c,body:{...c.body,realNeglectTicks:{}}}))};
 return next;
};
const beforeRealSchedule=renderSchedule;
renderSchedule=(state,cat)=>beforeRealSchedule(state,cat).replace('data-action="end-day">今日はここまで','data-action="close-modal">部屋へ戻る').replace(/(<button[^>]*data-action="close-modal"[^>]*>部屋へ戻る<\/button>)\s*(<button[^>]*data-action="close-modal"[^>]*>部屋へ戻る<\/button>)/,'$1');
const beforeRealGraduation=renderGraduation;
renderGraduation=(state,cat)=>beforeRealGraduation(state,cat).replace('もう1日いっしょに過ごす','今日は見送って、おうちへ');
const beforeRealGuide=getScreenGuide;
getScreenGuide=function(...args){const guide=beforeRealGuide(...args);return guide?JSON.parse(JSON.stringify(guide).replaceAll('今日はここまで、で翌日へ進みます。','現実の時間に合わせて日数が進みます。')):guide;};
window.addEventListener('pagehide',()=>dispatch({type:'SYNC_REAL_TIME',at:Date.now()}));
// Preserve the original loaded timestamp; older modules autosave while booting.
gameState=ensureRealClock(gameState,loadedSaveTimestamp??Date.now());
gameState=syncRealTime(gameState);saveGameState(gameState);render(gameState);
