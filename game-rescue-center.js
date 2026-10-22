'use strict';
const centerShop=renderMapShop;
renderMapShop=function(state){
 if(state.campaign.shopId!=='plaza')return centerShop(state).replaceAll('ペットショップ','スーパーホームセンター');
 const cat=getCat(state),ready=cat.status==='raising'&&isGraduationReady(state)&&cat.body.days+1>=carePlan(cat).eventDay;
 return receptionShell(state,'plaza',ACTIVITY_DIALOGUE[cat.heart>=80?'centerHappy':'centerHello'].copy,`<div class="center-menu"><button data-center="senior"><strong>先輩からのアドバイス</strong><span>保護・お世話・病院について</span><b aria-hidden="true">›</b></button><button data-action="go-event" ${ready?'':'disabled'}><strong>譲渡会に申し込む</strong><span>${ready?'このまま会場へご案内します':carePlan(cat).eventDay?carePlan(cat).eventDay+'日目から参加できます':'手術を終えた２日後にご案内'}</span><b aria-hidden="true">›</b></button></div>`,'').replaceAll('ふれあい広場','保護センター');
};
const centerTown=renderTown;renderTown=state=>centerTown(state).replaceAll('ふれあい広場','保護センター').replaceAll('ペットショップ','スーパーホームセンター').replaceAll('まだ早い','調査中').replaceAll('保護に行く','保護しに行く');
const centerReviewReducer=reduceGameState;
reduceGameState=function(state,action){
 if(action.type==='CENTER_REVIEW_OPEN')return {...state,ui:{...state.ui,centerReview:{kind:action.kind,page:0}}};
 const review=state.ui.centerReview;
 if(review&&['CENTER_REVIEW_NEXT','CENTER_REVIEW_BACK'].includes(action.type)){
  const keys=centerReviewPages(review.kind,state),page=review.page+(action.type==='CENTER_REVIEW_NEXT'?1:-1);
  return {...state,ui:{...state.ui,centerReview:page>=keys.length?null:{...review,page:Math.max(0,page)}}};
 }
 const next=centerReviewReducer(state,action);
 return next.campaign.phase!=='shop'||next.campaign.shopId!=='plaza'?{...next,ui:{...next.ui,centerReview:null}}:next;
};
function centerReviewKeys(kind,state){return ['centerRescue','centerRoom','centerHeart','centerSurgery',...(state.flags.returnedCat?['centerMultiple','centerRenovation']:[])];}
function centerReviewPages(kind,state){
 return centerReviewKeys(kind,state).flatMap(key=>{
  const sentences=ACTIVITY_DIALOGUE[key].copy.match(/[^。]+。?/g)||[],pages=[];
  for(const sentence of sentences){if(pages.length&&pages[pages.length-1].length+sentence.length<=40)pages[pages.length-1]+=sentence;else pages.push(sentence);}
  return pages.map((text,i)=>({key:`${key}:${i}`,text}));
 });
}
let centerReviewFrame=0;
const centerReviewRender=render;
render=function(state){
 centerReviewRender(state);cancelAnimationFrame(centerReviewFrame);
 const review=state.ui.centerReview;if(!review)return;
 const keys=centerReviewPages(review.kind,state),page=review.page,text=keys[page].text,key='center:'+keys[page].key,panel=document.createElement('div');
 panel.className='center-help modal-layer';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');
 panel.setAttribute('aria-label','先輩からのアドバイス');
 panel.innerHTML=`<section class="shared-guide-note senior-review">${seniorDialogueContents('',`<button data-center-back ${page?'':'disabled'} aria-label="ひとつ前へ">←</button><small aria-label="${page+1}ページ / ${keys.length}">${page+1} / ${keys.length}</small><button data-center-next>${page===keys.length-1?'受付へ':'つぎへ'}</button>`)}</section>`;
 app.append(panel);if(!guideSpeechCache.has(key))guideSpeechCache.set(key,performance.now());
 const tick=()=>{if(!panel.isConnected)return;const count=Math.min(text.length,Math.floor((performance.now()-guideSpeechCache.get(key))/18)),ready=count===text.length;panel.querySelector('p').textContent=text.slice(0,count);const button=panel.querySelector('[data-center-next]');button.disabled=!ready;button.classList.toggle('guide-next-ready',ready);if(!ready)centerReviewFrame=requestAnimationFrame(tick);};tick();
};
app.addEventListener('click',e=>{const button=e.target.closest('[data-center]');if(button){for(const {key} of centerReviewPages(button.dataset.center,gameState))guideSpeechCache.delete('center:'+key);dispatch({type:'CENTER_REVIEW_OPEN',kind:button.dataset.center})}if(e.target.closest('[data-center-next]'))dispatch({type:'CENTER_REVIEW_NEXT'});if(e.target.closest('[data-center-back]'))dispatch({type:'CENTER_REVIEW_BACK'});});
