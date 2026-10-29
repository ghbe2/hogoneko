'use strict';
const homeTourReducer=reduceGameState;
reduceGameState=function(state,action){
 const current=state.onboarding.homeTour;
 if(action.type==='HOME_TOUR_NEXT'){
  if(current==='pay'||current==='close'){const next=homeTourReducer(state,{type:'CLOSE_MODAL'});return {...next,onboarding:{...next.onboarding,homeTour:'play'}};}
  const index=HOME_TOUR.findIndex(s=>s[0]===current),step=HOME_TOUR[index+1]?.[0]||'done';
  return {...state,onboarding:{...state.onboarding,homeTour:step}};
 }
 const next=homeTourReducer(state,action);
 if(action.type==='OPEN_NOTEBOOK'&&!current&&['prompt','opened'].includes(state.onboarding.appIntro))return {...next,onboarding:{...next.onboarding,homeTour:'profile'},ui:{...next.ui,modal:'notebook',scheduleIntro:false,appScheduleSeen:getCat(next).id}};
 if(action.type==='CLOSE_MODAL'&&current==='close')return {...next,onboarding:{...next.onboarding,homeTour:'play'}};
 return next;
};
const homeTourRender=render;
let homeTourLastStep=null;
render=function(state){
 const step=HOME_TOUR.find(s=>s[0]===state.onboarding.homeTour);
 if(step&&HOME_TOUR.indexOf(step)<=4&&state.ui.modal!=='notebook')state={...state,ui:{...state.ui,modal:'notebook'}};
 if(step)roomPreparationOpen=['food','items'].includes(step[0]);
 else if(state.onboarding.homeTour==='done'&&app.querySelector('.home-tour'))roomPreparationOpen=false;
 homeTourRender(state);
 if(!step||titleScreenOpen){homeTourLastStep=null;return;}
 const target=app.querySelector(step[1]);if(!target)return;
 const overlay=document.createElement('section');overlay.className='home-tour'+(homeTourLastStep!==step[0]?' entering':'');homeTourLastStep=step[0];overlay.setAttribute('role','dialog');overlay.setAttribute('aria-label',step[2]);
 if(['play','clean','food','items'].includes(step[0]))overlay.classList.add('room-care-tour');
 const text=ACTIVITY_DIALOGUE['homeTour_'+step[0]];
 overlay.innerHTML=`<div class="home-tour-focus"></div><article><h2>${text.title}</h2><p>${text.copy}</p>${step[0]==='close'?'':`<button data-home-tour-next>${step[0]==='items'?'お世話をはじめる':step[0]==='pay'?'部屋へ戻る':'つぎへ'} →</button>`}</article>`;
 app.append(overlay);
 const a=app.getBoundingClientRect(),r=target.getBoundingClientRect(),ring=overlay.firstElementChild,card=overlay.lastElementChild;
 Object.assign(ring.style,{left:(r.left-a.left-3)+'px',top:(r.top-a.top-3)+'px',width:(r.width+6)+'px',height:(r.height+6)+'px'});
 const lower=['profile','vitals'].includes(step[0]);
 card.style.top=lower?'auto':'12px';card.style.bottom=lower?'12px':'auto';
};
for(const type of ['pointerdown','click'])window.addEventListener(type,e=>{
 if(e.target.closest('[data-alpha-report],.alpha-report,.alpha-layer'))return;
 const step=HOME_TOUR.find(s=>s[0]===gameState.onboarding.homeTour);if(!step||!app.querySelector('.home-tour'))return;
 if(e.target.closest('[data-home-tour-next]')){if(type==='click')dispatch({type:'HOME_TOUR_NEXT'});e.preventDefault();e.stopImmediatePropagation();return;}
 if(step[0]==='close'&&e.target.closest('.home-phone-close'))return;
 e.preventDefault();e.stopImmediatePropagation();
},true);
