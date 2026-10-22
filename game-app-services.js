'use strict';
function appRewardDay(){const d=new Date(gameNow());return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;}
const appServicesReducer=reduceGameState;
reduceGameState=function(state,action){
 if(action.type==='APP_SCHEDULE_NEXT')return {...state,ui:{...state.ui,appSchedulePage:(state.ui.appSchedulePage||0)+1,...(state.ui.appSchedulePage?{appScheduleSeen:getCat(state).id}:{})}};
 if(action.type==='APP_REWARD_START'){if(state.economy?.appRewardDay===appRewardDay()||state.ui.appRewardStarted||state.ui.adToken)return state;return {...state,ui:{...state.ui,appRewardStarted:Date.now()}};}
 if(action.type==='APP_REWARD_FINISH'){if(!state.ui.appRewardStarted||Date.now()-state.ui.appRewardStarted<3200||state.economy?.appRewardDay===appRewardDay())return state;return {...state,coins:state.coins+CONFIG.economy.adRewardCoins,economy:{...state.economy,appRewardDay:appRewardDay(),adClaims:(state.economy?.adClaims||0)+1},ui:{...state.ui,appRewardStarted:null}};}
 if(action.type==='APP_PHOTO')return {...state,ui:{...state.ui,appPhoto:action.index,appPhotoPose:'sit'}};
 if(action.type==='APP_PHOTO_POSE')return {...state,ui:{...state.ui,appPhotoPose:['sit','sleep','punch','knead'].filter(p=>p!==state.ui.appPhotoPose)[Math.floor(Math.random()*3)]}};
 if(action.type==='APP_PHOTO_CLOSE'||action.type==='APP_ALBUM_CLOSE')return {...state,ui:{...state.ui,appPhoto:null,modal:'notebook'}};
 return appServicesReducer(state,action);
};
let appRewardTimer;
function fitAlbumFace(svg){const entry=svgRigs.get(svg);if(!entry)return;const r=entry.rig,young=r.d.age==='kitten',scale=r.scale*(young?.74:1),headScale=scale*(young?1.15:1),y=r.ground-195*scale*(young?.88:1);svg.setAttribute('viewBox',`${360-90*headScale} ${y-86*headScale} ${180*headScale} ${140*headScale}`);svg.setAttribute('preserveAspectRatio','xMidYMid meet');}
const appServicesRender=render;
render=function(state){const albumScroll=app.querySelector('.album-photo-list')?.scrollTop||0;appServicesRender(state);clearTimeout(appRewardTimer);
 if(state.ui.scheduleIntro&&state.ui.appScheduleSeen!==getCat(state).id&&app.querySelector('.home-phone')){const intro=document.createElement('section'),page=state.ui.appSchedulePage||0;intro.className='center-help modal-layer';intro.setAttribute('role','dialog');intro.setAttribute('aria-label','これからの予定');intro.innerHTML=`<section class="shared-guide-note senior-review">${seniorDialogueContents(ACTIVITY_DIALOGUE[page?'firstScheduleEvent':'firstScheduleSurgery'].copy,`<button class="guide-next-ready" data-app-schedule-next>${page?'予定を確認する':'つぎへ'}</button>`)}</section>`;app.append(intro);}
 const reward=app.querySelector('.app-pay button');if(reward){reward.removeAttribute('data-action');reward.dataset.appReward='';const viewed=state.economy?.appRewardDay===appRewardDay();reward.disabled=viewed||!!state.ui.appRewardStarted;reward.classList.toggle('reward-viewed',viewed);reward.innerHTML=viewed?'✓ 本日は受取済み<br>また明日':state.ui.appRewardStarted?'広告の再生中…<br>モック表示':'広告を見て<br>コインを受け取る';}
 if(state.ui.appRewardStarted)appRewardTimer=setTimeout(()=>dispatch({type:'APP_REWARD_FINISH'}),Math.max(0,3200-(Date.now()-state.ui.appRewardStarted)));
 app.querySelectorAll('.app-album i').forEach((n,i)=>{n.dataset.appPhoto=String(Math.max(0,state.album.length-3)+i);n.setAttribute('role','button');n.setAttribute('tabindex','0');});
 app.querySelectorAll('.app-album i svg').forEach(fitAlbumFace);
 if(state.ui.modal==='album'){
  app.querySelector('.loop-album')?.closest('.release-overlay')?.remove();
  const overlay=document.createElement('section');overlay.className='home-phone-layer app-album-layer modal-layer';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-label','アルバム');
  overlay.innerHTML=`<article class="home-phone album-phone loop-album"><header><small>MEMORIES</small><h2>アルバム</h2></header><div class="album-photo-list loop-album-list">${state.album.map((e,i)=>`<button class="album-print" data-app-photo="${i}"><span>${renderCatArt({...e,id:'archive-'+e.catId})}</span><strong>${surgeryText(e.name)}</strong><small>${e.outcome==='adopted'?'新しい家族へ':'地域で見守る'}</small></button>`).join('')||'<p>思い出がたまっていくよ</p>'}</div><button class="album-return" data-app-album-close>アプリに戻る</button></article>`;
  app.append(overlay);mountGameCats();overlay.querySelectorAll('.game-cat-svg').forEach(freezeAlbumCat);overlay.querySelector('.album-photo-list').scrollTop=albumScroll;
 }
 if(Number.isInteger(state.ui.appPhoto)&&state.album[state.ui.appPhoto]){const entry=state.album[state.ui.appPhoto],overlay=document.createElement('section');overlay.className='app-photo-view home-phone-layer modal-layer';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-label','思い出の写真');overlay.innerHTML=`<article class="home-phone photo-phone"><header><small>MEMORIES</small><h2>${surgeryText(entry.name)}</h2></header><figure class="album-print"><div>${renderCatArt({...entry,id:'photo-'+entry.catId})}</div><figcaption>${surgeryText(entry.name)}<small>${entry.outcome==='adopted'?'新しい家族と、これからも。':'これからも、この街で。'}</small></figcaption></figure><button data-app-photo-pose>他の写真を見る</button><button data-app-photo-close>アプリに戻る</button></article>`;app.append(overlay);mountGameCats();overlay.querySelectorAll('.game-cat-svg').forEach(freezeAlbumCat);}
};
function freezeAlbumCat(svg){const entry=svgRigs.get(svg);if(!entry)return;const pose=svg.closest('.app-photo-view')?(gameState.ui.appPhotoPose||'sit'):'sit';CatSVG.applyPose(entry.rig,CatSVG.poseModel(pose,.65),.65,pose);svg.dataset.staticPhoto='true';fitFirstPortrait(svg);}
const appPhotoScenePose=scenePose;scenePose=svg=>svg.closest('.app-photo-view')?[gameState.ui.appPhotoPose||'sit','neutral']:appPhotoScenePose(svg);
app.addEventListener('click',e=>{const photo=e.target.closest('[data-app-photo]');if(photo){e.preventDefault();e.stopImmediatePropagation();dispatch({type:'APP_PHOTO',index:Number(photo.dataset.appPhoto)});return;}if(e.target.closest('[data-app-reward]'))dispatch({type:'APP_REWARD_START'});if(e.target.closest('[data-app-photo-pose]'))dispatch({type:'APP_PHOTO_POSE'});if(e.target.closest('[data-app-photo-close]'))dispatch({type:'APP_PHOTO_CLOSE'});},true);
app.addEventListener('click',e=>{if(e.target.closest('[data-app-schedule-next]'))dispatch({type:'APP_SCHEDULE_NEXT'});});
app.addEventListener('click',e=>{if(e.target.closest('[data-app-album-close]'))dispatch({type:'APP_ALBUM_CLOSE'});});
