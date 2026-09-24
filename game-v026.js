'use strict';
// Required visits are saved per cat, independent of the currently open screen.
function pendingVisit(state){
 const cat=getCat(state),day=cat.body.days+1;
 if(cat.status!=='raising')return null;
 if(day>=5&&!cat.surgeryVisitDay)return 'clinic';
 if(day>=CONFIG.stage1.adoptionEventDay&&cat.eventVisitDay!==day)return 'event';
 return null;
}
function reconcileVisit(state){
 const kind=pendingVisit(state),current=state.campaign.requiredVisit;
 if(!kind)return current?{...state,campaign:{...state.campaign,requiredVisit:null}}:state;
 if(current?.kind===kind)return state;
 return {...state,campaign:{...state.campaign,phase:'room',requiredVisit:{kind,step:'outing'}},ui:{...state.ui,modal:null,layoutMode:false,careAnimation:null,holdingCat:false,playMode:null}};
}
const beforeVisitReducer=reduceGameState;
reduceGameState=function(state,action){
 state=reconcileVisit(state);
 const visit=state.campaign.requiredVisit;
 if(visit){
  const ui={...state.ui,modal:null,layoutMode:false};
  if(action.type==='OPEN_OUTING'&&visit.step==='outing')return {...state,campaign:{...state.campaign,phase:'town',requiredVisit:{...visit,step:'destination'}},ui};
  if(action.type==='OPEN_REQUIRED_VISIT'&&visit.step==='destination'){
   if(visit.kind==='event')return {...state,cats:state.cats.map(c=>c.id===getCat(state).id?{...c,eventVisitDay:c.body.days+1}:c),campaign:{...state.campaign,phase:'graduation',requiredVisit:null},ui};
   return {...state,campaign:{...state.campaign,phase:'shop',shopId:'clinic',requiredVisit:{...visit,step:'clinic'}},ui};
  }
  if(action.type==='CONFIRM_CLINIC_VISIT'&&visit.step==='clinic')return reconcileVisit({...state,cats:state.cats.map(c=>c.id===getCat(state).id?{...c,surgeryVisitDay:c.body.days+1}:c),campaign:{...state.campaign,phase:'room',requiredVisit:null},ui});
  // No background time/neglect or other navigation while the required trip is shown.
  if(action.type!=='START_GAME')return state;
 }
 let next=beforeVisitReducer(state,action);
 if(action.type==='NEXT_RESCUE')next={...next,cats:next.cats.map(c=>({...c,surgeryVisitDay:null,eventVisitDay:null})),campaign:{...next.campaign,requiredVisit:null}};
 return reconcileVisit(next);
};
const beforeVisitShop=renderMapShop;
renderMapShop=function(state){
 if(state.campaign.requiredVisit?.step!=='clinic')return beforeVisitShop(state);
 const cat=getCat(state),goal=cat.age==='kitten'?CONFIG.cat.weightGoal.kitten:CONFIG.stage1.campaign.bodyGoal;
 const note=cat.body.sick?'体調を整えてから、手術の準備を進めましょう。':cat.body.weight<goal?'まだ体重が足りないようです。おうちで育てながら、準備を進めましょう。':'手術予定の確認ができました。おうちで引き続き様子を見ましょう。';
 return renderCampaignShell(state,'動物病院',`<section class="shop-sheet"><h1>手術予定の確認</h1><p>${cat.body.weight.toLocaleString('ja-JP')}g ／ 目安 ${goal.toLocaleString('ja-JP')}g以上</p><p>${note}</p><small>モックでは手術・卒業ケアの処理と費用は卒業時にまとめています。</small></section>`,`<button class="campaign-button" data-action="confirm-clinic-visit">確認を終えて、おうちへ</button>`);
};
const beforeVisitTown=renderTown;
renderTown=function(state){
 const html=beforeVisitTown(state);
 if(state.campaign.requiredVisit?.kind!=='event')return html;
 const template=document.createElement('template');template.innerHTML=html;
 const button=document.createElement('button');button.className='book-map-hotspot event';button.dataset.action='open-required-visit';button.textContent='譲渡会会場へ';
 template.content.querySelector('.town-full-map')?.append(button);return template.innerHTML;
};
const beforeVisitRender=render;
render=function(state){
 beforeVisitRender(state);
 if(titleScreenOpen)return;
 const visit=state.campaign.requiredVisit;
 if(!visit)return;
 const frame=app.querySelector('.game-frame')||app.firstElementChild;
 if(!frame)return;
 frame.classList.add('required-visit');
 let target;
 if(visit.step==='outing')target=app.querySelector('[data-action="open-outing"]');
 if(visit.step==='destination'){
  target=app.querySelector(visit.kind==='clinic'?'[data-action="open-map-shop"][data-shop="clinic"]':'[data-action="open-required-visit"]');
  if(target)target.dataset.action='open-required-visit';
 }
 if(visit.step==='clinic')target=app.querySelector('[data-action="confirm-clinic-visit"]');
 if(!target)return;
 app.querySelectorAll('button,input,select,textarea,[tabindex]').forEach(el=>{if(el!==target){el.disabled=true;el.setAttribute('tabindex','-1');}});
 const shade=document.createElement('div');shade.className='visit-shade';shade.setAttribute('aria-hidden','true');frame.append(shade);
 target.classList.add('visit-target');
 const notice=document.createElement('div');notice.className='visit-notice';notice.setAttribute('role','status');
 notice.textContent=visit.step==='clinic'?'確認を終えたら、おうちへ戻ろう':`${visit.kind==='clinic'?'手術予定の日です。病院へいこう':'譲渡会の日です。会場へいこう'}${visit.step==='outing'?' — おでかけをタップ':''}`;
 frame.append(notice);
 if(visit.step==='clinic')shade.classList.add('clinic-shade');
};
app.addEventListener('click',event=>{
 const action=event.target.closest('[data-action]')?.dataset.action;
 if(action==='open-required-visit')dispatch({type:'OPEN_REQUIRED_VISIT'});
 if(action==='confirm-clinic-visit')dispatch({type:'CONFIRM_CLINIC_VISIT'});
});
const visitStyle=document.createElement('style');visitStyle.textContent=`
.required-visit{position:relative}.visit-shade{position:absolute;inset:0;background:#302b254d;z-index:140;touch-action:none}.visit-target{position:relative!important;z-index:142!important;box-shadow:0 0 0 5px #f8df9c,0 0 0 9px #fff9!important;opacity:1!important;pointer-events:auto!important}.book-map-hotspot.visit-target{position:absolute!important}.visit-notice{position:absolute;z-index:143;top:68px;left:18px;right:18px;padding:14px;border-radius:14px;background:#fff9e9;color:#584c38;text-align:center;font-size:14px;pointer-events:none}.book-map-hotspot.event{left:73%;top:70%}.clinic-shade{background:transparent}.required-visit .footer,.required-visit footer,.required-visit .campaign-footer{z-index:auto}
`;document.head.append(visitStyle);
gameState=reconcileVisit(gameState);render(gameState);
