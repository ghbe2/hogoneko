'use strict';
// The TNR farewell is a persisted presentation, not a second graduation transaction.
const releaseReturnReducer=reduceGameState;
reduceGameState=function(state,action){
 const cat=getCat(state),run=adoptionRunFor(state),release=state.campaign.tnrRelease;
 if(action.type==='GO_EVENT'){
  const next=releaseReturnReducer(state,action);
  return next.campaign.phase==='graduation'&&getCat(next).status==='raising'?reduceGameState(next,{type:'BEGIN_ADOPTION'}):next;
 }
 if(action.type==='HOME_FROM_ADOPTION'&&run?.outcome==='tnr'&&run.status==='done'){
  if(!release||release.catId!==cat.id)return {...state,campaign:{...state.campaign,tnrRelease:{catId:cat.id,area:cat.rescueArea||state.campaign.area||'a1',openedAt:null,done:false,adClaimed:false}},ui:{...state.ui,modal:null}};
  if(!release.done||state.ui.tnrAd)return state;
 }
 if(action.type.startsWith('TNR_')){
  if(!release||release.catId!==cat.id||state.campaign.phase!=='result')return state;
  if(action.type==='TNR_OPEN')return release.openedAt?state:{...state,campaign:{...state.campaign,tnrRelease:{...release,openedAt:Date.now()}}};
  if(action.type==='TNR_FINISH')return !release.openedAt||Date.now()-release.openedAt<6000?state:{...state,campaign:{...state.campaign,tnrRelease:{...release,done:true}}};
  if(action.type==='TNR_AD_START')return !release.done||release.adClaimed||state.ui.tnrAd?state:{...state,ui:{...state.ui,tnrAd:{token:action.token,at:Date.now()}}};
  if(action.type==='TNR_AD_CANCEL')return {...state,ui:{...state.ui,tnrAd:null}};
  if(action.type==='TNR_AD_FINISH'){
   const ad=state.ui.tnrAd;if(!ad||ad.token!==action.token||Date.now()-ad.at<3200||release.adClaimed)return state;
   return {...state,coins:state.coins+CONFIG.economy.adRewardCoins,campaign:{...state.campaign,tnrRelease:{...release,adClaimed:true}},ui:{...state.ui,tnrAd:null}};
  }
  return state;
 }
 const next=releaseReturnReducer(state,action);
 if(action.type==='HOUSEHOLD_RETURN'&&next!==state&&state.household?.pendingReturn&&!next.household?.pendingReturn){
  const returning=getCat(next),id='return-'+returning.id,letters={...next.economy?.familyLetters};
  if(!letters[id])letters[id]={catId:id,name:returning.name,kind:'return',arrivedAt:Date.now(),coins:CARE_BALANCE.familyCoins,itemId:drawFamilyItem(),claimed:false,bonusClaimed:true};
  return {...next,economy:{...next.economy,familyLetters:letters,pendingFamilyLetter:id}};
 }
 return next;
};
const beforeTnrResult=renderResult;
function releaseTrapArt(){const t=document.createElement('template');t.innerHTML=encounterTrapArt();const svg=t.content.querySelector('svg');svg.insertAdjacentHTML('beforeend','<path d="M164 36L191 18V87L164 107Z" fill="#746e5b"/><g class="tnr-door"><path d="M163 35L193 15V88L163 110Z" fill="#d4c8a9" stroke="#746e5b" stroke-width="3"/><path d="M173 32V98M184 26V92M165 58L191 40M165 82L191 64" fill="none" stroke="#8b8771" stroke-width="3"/></g>');return svg.outerHTML;}
renderResult=function(state,cat){
 const r=state.campaign.tnrRelease;if(!r||r.catId!==cat.id)return beforeTnrResult(state,cat);
 const elapsed=r.done?6000:r.openedAt?Math.min(6000,Date.now()-r.openedAt):0;
 return `<section class="tnr-field ${r.openedAt?'is-open':''} ${r.done?'is-done':''}" style="--release-delay:-${elapsed}ms" aria-label="${stageName(r.area)}で地域へ戻す">${fieldBackdrop({...state,campaign:{...state.campaign,area:r.area}})}<p class="tnr-location">${stageName(r.area)}</p><div class="tnr-carrier">${encounterTrapArt()}</div><div class="tnr-cat">${renderCatArt(cat)}</div><section class="tnr-note"><h2>${r.done?'これからも、この街で。':r.openedAt?'':'元いた場所へ、戻ってきました。'}</h2><p>${r.done?'おかえりなさい。これからも地域の一員として、この子の暮らしを見守っていきましょう。':r.openedAt?'':'かごを開けて、あとはこの子のペースに任せましょう。'}</p>${!r.openedAt?'<button data-release="TNR_OPEN">かごを開ける</button>':r.done?`${state.ui.tnrAd?'<button disabled>広告の再生中…（モック）</button><button data-release="TNR_AD_CANCEL">中止する</button>':`<button data-release="TNR_AD_START" ${r.adClaimed?'disabled':''}>${r.adClaimed?'受取済み ✓':`広告を見て ${CONFIG.economy.adRewardCoins}コイン受け取る`}</button><button data-adoption-action="HOME_FROM_ADOPTION">自宅へ帰る</button>`}<small>広告は任意・今回１回のみ。アイテムの付与はありません。</small>`:''}</section></section>`;
};
const releaseScenePose=scenePose;
scenePose=svg=>svg.closest('.tnr-cat')?[gameState.campaign.tnrRelease?.done?'sit':'walk','neutral']:releaseScenePose(svg);
const releaseRender=render;let releaseTimer,releaseAdTimer;
render=function(state){
 clearTimeout(releaseTimer);clearTimeout(releaseAdTimer);releaseRender(state);
 const r=state.campaign.tnrRelease,field=app.querySelector('.tnr-field');
 if(field){
  const carrier=field.querySelector('.tnr-carrier');carrier.innerHTML=releaseTrapArt();
  field.querySelectorAll('.game-cat-svg').forEach(fitFirstPortrait);
  if(r.openedAt&&!r.done)releaseTimer=setTimeout(()=>dispatch({type:'TNR_FINISH'}),Math.max(0,6000-(Date.now()-r.openedAt)));
  if(state.ui.tnrAd){const ad=state.ui.tnrAd;releaseAdTimer=setTimeout(()=>dispatch({type:'TNR_AD_FINISH',token:ad.token}),Math.max(0,3200-(Date.now()-ad.at)));}
 }
};
const releaseNormalize=normalizeLoadedState;
normalizeLoadedState=function(...args){const s=releaseNormalize(...args);return s?{...s,ui:{...s.ui,tnrAd:null}}:s;};
gameState={...gameState,ui:{...gameState.ui,tnrAd:null}};
app.addEventListener('click',e=>{const b=e.target.closest('[data-release]');if(b&&!b.disabled)dispatch({type:b.dataset.release,token:crypto.randomUUID()});});
