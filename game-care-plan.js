'use strict';
// Eligibility is not an appointment. Only a player booking starts fasting.
CONFIG.stage1.campaign.bodyGoal=2000;
function carePlan(cat){
 if(cat.carePlan?.version===2)return cat.carePlan;
 const completed=cat.surgery?.completedDay;
 return {version:2,surgeryDay:cat.surgery?.status==='in_progress'?cat.surgery.startedDay:null,eventDay:cat.surgery?.status==='done'?(completed||cat.body.days+1)+2:null,notices:{}};
}
function careReady(cat){return cat.status==='raising'&&!cat.permanentResident&&cat.body.weight>=2000&&!cat.body.sick&&cat.body.days>=(cat.recoveryUntilDay||0)&&cat.age!=='kitten';}
function earliestSurgeryDay(cat){return cat.initialAge==='kitten'||cat.age==='kitten'?12:5;}
surgeryEligibility=function(state){const cat=getCat(state),plan=carePlan(cat),day=cat.body.days+1,healthy=!cat.body.sick&&cat.body.days>=(cat.recoveryUntilDay||0),weightReady=cat.body.weight>=2000,dayReady=plan.surgeryDay===day,minDay=earliestSurgeryDay(cat);return {goal:2000,day,minDay,healthy,weightReady,dayReady,canBook:careReady(cat)&&day+1>=minDay&&!plan.surgeryDay&&!['done','in_progress'].includes(cat.surgery?.status),ready:careReady(cat)&&dayReady&&day>=minDay};};
// Notices never force travel or lock unrelated care controls.
pendingVisit=()=>null;
reconcileVisit=state=>state.campaign.requiredVisit?{...state,campaign:{...state.campaign,requiredVisit:null}}:state;
function updateCareCat(state,update){const id=getCat(state).id;return {...state,cats:state.cats.map(c=>c.id===id?update(c):c)};}
function cancelCareBooking(state,reason){return updateCareCat(state,c=>({...c,carePlan:{...carePlan(c),surgeryDay:null,eventDay:null,lastCancellation:reason},lifeLog:[...(c.lifeLog||[]),{day:c.body.days+1,kind:'appointment-cancelled',title:'手術の予約を取り消した',note:reason}]}));}
function normalizeCarePlan(state){
 let next=updateCareCat(state,c=>({...c,initialAge:c.initialAge||c.age,carePlan:carePlan(c)})),cat=getCat(next),plan=carePlan(cat);
 if(cat.surgery?.status==='done'&&Number.isFinite(cat.surgery.completedDay)&&plan.eventDay!==cat.surgery.completedDay+2)next=updateCareCat(next,c=>({...c,carePlan:{...plan,surgeryDay:cat.surgery.completedDay,eventDay:cat.surgery.completedDay+2}}));
 else if(plan.surgeryDay&&cat.body.days+1>plan.surgeryDay&&!['done','in_progress'].includes(cat.surgery?.status))next=cancelCareBooking(next,'予約日を過ぎました。ごはんを戻し、改めて申し込めます。');
 return reconcileVisit(next);
}
function applySurgeryFasting(state,at=gameNow()){
 state=normalizeCarePlan(state);const cat=getCat(state),day=cat.body.days+1,plan=carePlan(cat);
 const stored=cat.body.surgeryFoodStored;
 const fasting=cat.status==='raising'&&!cat.permanentResident&&cat.age!=='kitten'&&cat.surgery?.status!=='done'&&!!plan.surgeryDay&&day>=plan.surgeryDay-1&&day<=plan.surgeryDay;
 if(fasting&&stored===undefined)return updateCareCat(state,c=>({...c,body:{...c.body,surgeryFoodStored:c.body.foodLevel||0,foodLevel:0}}));
 if(!fasting&&stored!==undefined)return updateCareCat(state,c=>{const body={...c.body,foodLevel:stored};delete body.surgeryFoodStored;return {...c,body};});
 return state;
}
function careNotice(state){
 const cat=getCat(state),plan=carePlan(cat),day=cat.body.days+1;
 if(cat.status!=='raising'||cat.permanentResident)return null;
 const type=cat.surgery?.status==='done'&&day>=plan.eventDay?'event':cat.surgery?.status!=='done'&&plan.surgeryDay===day?'surgery':!plan.surgeryDay&&careReady(cat)?'ready':null;
 const key=type==='ready'?'ready':type+':'+(type==='event'?plan.eventDay:plan.surgeryDay);
 return type&&!plan.notices?.[key]?{type,key}:null;
}
const carePlanReducer=reduceGameState;
reduceGameState=function(state,action){
 const now=action.type==='SYNC_REAL_TIME'&&Number.isFinite(action.at)?action.at:gameNow();
 state=applySurgeryFasting(syncRealTime(state,now),now);const cat=getCat(state);
 if(action.type==='CARE_NOTICE_ACK'){const notice=careNotice(state);return notice?updateCareCat({...state,ui:{...state.ui,careTravelPrompt:notice.type!=='ready',modal:notice.type==='ready'?'notebook':null}},c=>({...c,carePlan:{...carePlan(c),notices:{...carePlan(c).notices,[notice.key]:true}}})):state;}
 if(action.type==='ASK_SURGERY_BOOKING')return surgeryEligibility(state).canBook?{...state,ui:{...state.ui,careBookingOpen:true}}:state;
 if(action.type==='DISMISS_SURGERY_BOOKING')return {...state,ui:{...state.ui,careBookingOpen:false}};
 if(action.type==='BOOK_SURGERY'){
  const atClinic=state.campaign.phase==='shop'&&state.campaign.shopId==='clinic',inApp=['notebook','schedule'].includes(state.ui.modal);
  if((!atClinic&&!inApp)||!state.ui.careBookingOpen||!surgeryEligibility(state).canBook)return state;
  return applySurgeryFasting(updateCareCat({...state,ui:{...state.ui,careBookingOpen:false}},c=>({...c,carePlan:{...carePlan(c),surgeryDay:c.body.days+2,eventDay:null,lastCancellation:null},lifeLog:[...(c.lifeLog||[]),{day:c.body.days+1,kind:'appointment',title:'翌日の手術を予約した'}]})),now);
 }
 if(action.type==='CANCEL_CARE_SURGERY'&&carePlan(cat).surgeryDay&&!['done','in_progress'].includes(cat.surgery?.status))return applySurgeryFasting(cancelCareBooking(state,'予約を取り消しました。体重・体調を整えて、アプリから再予約できます。'),now);
 if(action.type==='START_CARE'&&action.operation==='food'&&action.foodId!=='water_refill'&&cat.body.surgeryFoodStored!==undefined)return {...state,ui:{...state.ui,message:'手術に備えて、ごはんはお休み中です。'}};
 if(action.type==='FINISH_CARE'&&state.ui.careAnimation?.operation==='food'&&cat.body.surgeryFoodStored!==undefined)return {...state,ui:{...state.ui,careAnimation:null}};
 if(action.type==='START_SURGERY'&&carePlan(cat).surgeryDay===cat.body.days+1&&!surgeryEligibility(state).ready&&cat.surgery?.status!=='done')return {...applySurgeryFasting(cancelCareBooking(state,'体重・体調と保護期間を確認して、改めて申し込みましょう。'),now),ui:{...state.ui,message:'今日は手術を見合わせます。ごはんを戻しました。'}};
 if(action.type==='GO_EVENT'){
  if(cat.permanentResident||cat.surgery?.status!=='done'||cat.body.days+1<carePlan(cat).eventDay||!isGraduationReady(state))return {...state,ui:{...state.ui,modal:'schedule'}};
  return {...state,campaign:{...state.campaign,phase:'graduation',requiredVisit:null},ui:{...state.ui,modal:null,layoutMode:false}};
 }
 let next=carePlanReducer(state,action);
 if(action.type==='CLOSE_MODAL')next={...next,ui:{...next.ui,careBookingOpen:false}};
 if(action.type==='OPEN_OUTING')next={...next,ui:{...next.ui,careTravelPrompt:false}};
 if(getCat(next).id===cat.id&&getCat(next).body.days>cat.body.days)next=updateCareCat(next,c=>({...c,previousDayHeart:cat.heart}));
 return applySurgeryFasting(next,now);
};
const carePlanRender=render;
render=function(state){
 carePlanRender(state);
 if(!state.ui.careBookingOpen||titleScreenOpen)return;
 const cat=getCat(state),layer=document.createElement('section');layer.className='care-booking modal-layer';layer.setAttribute('role','dialog');layer.setAttribute('aria-modal','true');layer.setAttribute('aria-label','手術の予約');
 layer.innerHTML=`<article><h2>明日、手術を受けますか？</h2><p>今の体重は <strong>${Math.round(cat.body.weight).toLocaleString()}g</strong>。</p><p>予約すると、ごはんをしまいます。絶食で体重が減るので、2,000gぎりぎりなら、もう1日育ててからにしましょう。</p><p>手術当日も、2,000g以上・体調良好が条件です。予約はアプリから取り消せます。</p><small>ゲーム内のルールです。現実の絶食は獣医師の指示に従ってください。</small><button data-care-booking="confirm">明日の手術を予約する</button><button data-care-booking="cancel">もう1日育てる</button></article>`;
 for(const child of app.children)child.inert=true;
 app.append(layer);
};
app.addEventListener('click',e=>{if(e.target.closest('[data-care-cancel]'))dispatch({type:'CANCEL_CARE_SURGERY'});if(e.target.closest('[data-care-notice]'))dispatch({type:'CARE_NOTICE_ACK'});if(e.target.closest('[data-action="book-surgery"]'))dispatch({type:'ASK_SURGERY_BOOKING'});const booking=e.target.closest('[data-care-booking]');if(booking)dispatch({type:booking.dataset.careBooking==='confirm'?'BOOK_SURGERY':'DISMISS_SURGERY_BOOKING'});});
const carePlanNormalize=normalizeLoadedState;
normalizeLoadedState=function(state){const next=carePlanNormalize(state);return next?{...next,ui:{...next.ui,careBookingOpen:false}}:next;};
gameState=applySurgeryFasting(gameState);
