'use strict';
function appRewardDay(){const d=new Date(gameNow());return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;}
const appServicesReducer=reduceGameState;
reduceGameState=function(state,action){
 if(action.type==='APP_SCHEDULE_NEXT')return {...state,ui:{...state.ui,appSchedulePage:(state.ui.appSchedulePage||0)+1,...(state.ui.appSchedulePage?{appScheduleSeen:getCat(state).id}:{})}};
 if(action.type==='APP_REWARD_START'){if(state.economy?.appRewardDay===appRewardDay()||state.ui.appRewardStarted)return state;return {...state,ui:{...state.ui,appRewardStarted:Date.now()}};}
 if(action.type==='APP_REWARD_FINISH'){if(!state.ui.appRewardStarted||Date.now()-state.ui.appRewardStarted<3200||state.economy?.appRewardDay===appRewardDay())return state;return {...state,coins:state.coins+50,economy:{...state.economy,appRewardDay:appRewardDay(),adClaims:(state.economy?.adClaims||0)+1},ui:{...state.ui,appRewardStarted:null}};}
 if(action.type==='APP_PHOTO')return {...state,ui:{...state.ui,appPhoto:action.index,appPhotoPose:'sit'}};
 if(action.type==='APP_PHOTO_POSE')return {...state,ui:{...state.ui,appPhotoPose:['sit','sleep','punch','knead'].filter(p=>p!==state.ui.appPhotoPose)[Math.floor(Math.random()*3)]}};
 if(action.type==='APP_PHOTO_CLOSE')return {...state,ui:{...state.ui,appPhoto:null}};
 return appServicesReducer(state,action);
};
let appRewardTimer;
function fitAlbumFace(svg){const head=svg.querySelector('[data-part="headRig"]'),inverse=svg.getCTM()?.inverse();if(!head||!inverse)return;const box=head.getBBox(),matrix=inverse.multiply(head.getCTM()),points=[[box.x,box.y],[box.x+box.width,box.y],[box.x,box.y+box.height],[box.x+box.width,box.y+box.height]].map(([x,y])=>new DOMPoint(x,y).matrixTransform(matrix));const x=Math.min(...points.map(p=>p.x)),y=Math.min(...points.map(p=>p.y)),w=Math.max(...points.map(p=>p.x))-x,h=Math.max(...points.map(p=>p.y))-y;svg.setAttribute('viewBox',`${x-3} ${y-3} ${w+6} ${h+6}`);svg.setAttribute('preserveAspectRatio','xMidYMid meet');}
const appServicesRender=render;
render=function(state){appServicesRender(state);clearTimeout(appRewardTimer);
 if(state.ui.scheduleIntro&&state.ui.appScheduleSeen!==getCat(state).id&&app.querySelector('.home-phone')){const intro=document.createElement('section'),page=state.ui.appSchedulePage||0;intro.className='center-help modal-layer';intro.setAttribute('role','dialog');intro.setAttribute('aria-label','これからの予定');intro.innerHTML=`<section class="shared-guide-note senior-review">${seniorDialogueContents(ACTIVITY_DIALOGUE[page?'firstScheduleEvent':'firstScheduleSurgery'].copy,`<button class="guide-next-ready" data-app-schedule-next>${page?'予定を確認する':'つぎへ'}</button>`)}</section>`;app.append(intro);}
 const reward=app.querySelector('.app-pay button');if(reward){reward.removeAttribute('data-action');reward.dataset.appReward='';const viewed=state.economy?.appRewardDay===appRewardDay();reward.disabled=viewed||!!state.ui.appRewardStarted;reward.classList.toggle('reward-viewed',viewed);reward.innerHTML=viewed?'✓ 本日は受取済み<br>また明日':state.ui.appRewardStarted?'広告の再生中…<br>モック表示':'広告を見て<br>コインを受け取る';}
 if(state.ui.appRewardStarted)appRewardTimer=setTimeout(()=>dispatch({type:'APP_REWARD_FINISH'}),Math.max(0,3200-(Date.now()-state.ui.appRewardStarted)));
 app.querySelectorAll('.app-album i').forEach((n,i)=>{n.dataset.appPhoto=String(Math.max(0,state.album.length-3)+i);n.setAttribute('role','button');n.setAttribute('tabindex','0');});
 app.querySelectorAll('.app-album i svg').forEach(fitAlbumFace);
 if(Number.isInteger(state.ui.appPhoto)&&state.album[state.ui.appPhoto]){const entry=state.album[state.ui.appPhoto],overlay=document.createElement('section');overlay.className='app-photo-view modal-layer';overlay.innerHTML=`<article><h2>${surgeryText(entry.name)}</h2><div>${renderCatArt({...entry,id:'photo-'+entry.catId})}</div><button data-app-photo-pose>別のポーズを見る</button><button data-app-photo-close>アルバムにもどる</button></article>`;app.append(overlay);mountGameCats();overlay.querySelectorAll('.game-cat-svg').forEach(fitFirstPortrait);}
};
const appPhotoScenePose=scenePose;scenePose=svg=>svg.closest('.app-photo-view')?[gameState.ui.appPhotoPose||'sit','neutral']:appPhotoScenePose(svg);
app.addEventListener('click',e=>{const photo=e.target.closest('[data-app-photo]');if(photo){e.preventDefault();e.stopImmediatePropagation();dispatch({type:'APP_PHOTO',index:Number(photo.dataset.appPhoto)});return;}if(e.target.closest('[data-app-reward]'))dispatch({type:'APP_REWARD_START'});if(e.target.closest('[data-app-photo-pose]'))dispatch({type:'APP_PHOTO_POSE'});if(e.target.closest('[data-app-photo-close]'))dispatch({type:'APP_PHOTO_CLOSE'});},true);
app.addEventListener('click',e=>{if(e.target.closest('[data-app-schedule-next]'))dispatch({type:'APP_SCHEDULE_NEXT'});});
