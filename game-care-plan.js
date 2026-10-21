'use strict';
// Per-cat appointments: old saves derive defaults without rewriting their history.
function carePlan(cat){const extra=cat.initialAge==='kitten'||cat.age==='kitten'?7:0;return cat.carePlan||{surgeryDay:5+extra,eventDay:7+extra,postponements:0};}
function postponeCare(state,reason){const cat=getCat(state),plan=carePlan(cat);if(cat.surgery?.status==='done')return state;return {...state,cats:state.cats.map(c=>c.id!==cat.id?c:{...c,carePlan:{...plan,surgeryDay:Math.max(plan.surgeryDay,cat.body.days+1)+2,eventDay:Math.max(plan.eventDay,cat.body.days+3)+2,postponements:plan.postponements+1},lifeLog:[...(c.lifeLog||[]),{day:c.body.days+1,kind:'postponed',title:'手術を２日後に変更',note:reason}]}),campaign:{...state.campaign,requiredVisit:null},ui:{...state.ui,message:'手術と譲渡会を２日後に変更しました。'}};}
CONFIG.stage1.campaign.bodyGoal=2000;
surgeryEligibility=function(state){const cat=getCat(state),day=cat.body.days+1,plan=carePlan(cat),healthy=!cat.body.sick&&cat.body.days>=(cat.recoveryUntilDay||0),dayReady=day>=plan.surgeryDay,weightReady=cat.body.weight>=2000;return {goal:2000,day,healthy,dayReady,weightReady,ready:dayReady&&healthy&&weightReady};};
pendingVisit=function(state){const cat=getCat(state);return cat.status==='raising'&&!cat.permanentResident&&cat.surgery?.status==='done'&&cat.body.days+1>=carePlan(cat).eventDay&&cat.eventVisitDay!==cat.body.days+1?'event':null;};
const carePlanReducer=reduceGameState;
reduceGameState=function(state,action){
 state=applySurgeryFasting(state);const cat=getCat(state);
 if(action.type==='START_CARE'&&action.operation==='food'&&action.foodId!=='water_refill'&&cat.body.surgeryFoodStored!==undefined)return {...state,ui:{...state.ui,message:'手術に備えて、ごはんはお休み中です。'}};
 if(action.type==='CANCEL_CARE_SURGERY'&&cat.status==='raising'&&cat.surgery?.status!=='done'&&cat.surgery?.status!=='in_progress')return applySurgeryFasting(postponeCare(state,'アプリから予定を変更'));
 if(action.type==='GO_EVENT'&&cat.body.days+1<carePlan(cat).eventDay)return {...state,ui:{...state.ui,modal:'schedule'}};
 if(['START_SURGERY','GO_SURGERY'].includes(action.type)&&cat.status==='raising'&&cat.surgery?.status!=='done'&&cat.body.days+1>=carePlan(cat).surgeryDay&&!surgeryEligibility(state).ready)return applySurgeryFasting(postponeCare(state,'体重・体調が整うまで待ちます'));
 let next=carePlanReducer(state,action);
 const n=getCat(next);
 if(n&&cat.id===n.id&&n.body.days>cat.body.days){
  next={...next,cats:next.cats.map(c=>c.id!==cat.id?c:{...c,previousDayHeart:cat.heart})};
  if(n.status==='raising'&&n.surgery?.status!=='done'&&n.body.days+1>carePlan(n).surgeryDay)next=postponeCare(next,'予定日を過ぎたため再予約');
 }
 return next;
};
app.addEventListener('click',e=>{if(e.target.closest('[data-care-cancel]'))dispatch({type:'CANCEL_CARE_SURGERY'});});
function applySurgeryFasting(state,at=gameNow()){
 const cat=getCat(state),day=cat.body.days+1,plan=carePlan(cat),night=new Date(at).getHours()>=19;
 const fasting=cat.status==='raising'&&cat.age!=='kitten'&&cat.surgery?.status!=='done'&&(day===plan.surgeryDay-1&&night||day===plan.surgeryDay);
 const stored=cat.body.surgeryFoodStored;
 if(fasting&&stored===undefined)return {...state,cats:state.cats.map(c=>c.id!==cat.id?c:{...c,body:{...c.body,surgeryFoodStored:c.body.foodLevel||0,foodLevel:0}}),ui:{...state.ui,message:day===plan.surgeryDay?'今日は手術なので、ごはんはお休みです。':'明日は手術なので、夜のごはんをしまいます。'}};
 if(!fasting&&stored!==undefined){const body={...cat.body,foodLevel:stored};delete body.surgeryFoodStored;return {...state,cats:state.cats.map(c=>c.id===cat.id?{...c,body}:c)};}
 return state;
}
