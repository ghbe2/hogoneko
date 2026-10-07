'use strict';
// Graduation is a saved memory, not a reset of the player's possessions.
const beforeLoopReducer=reduceGameState;
// Older completed saves can recover details only for the cat still present in the save.
const lastGraduate=getCat(gameState);
if(['adopted','tnr'].includes(lastGraduate.status)){
 gameState={...gameState,album:gameState.album.map(e=>e.catId===lastGraduate.id&&!Number.isFinite(e.weight)?{...e,heart:lastGraduate.heart,weight:lastGraduate.body.weight,types:[...lastGraduate.types],surgery:structuredClone(lastGraduate.surgery||null)}:e)};
 saveGameState(gameState);
}
reduceGameState=function(state,action){
 if(action.type==='OPEN_FAREWELL')return state.campaign.phase==='result'?{...state,ui:{...state.ui,modal:'farewell'}}:state;
 if(action.type==='OPEN_ALBUM')return state.campaign.requiredVisit?state:{...state,ui:{...state.ui,modal:'album'}};
 if(action.type==='NEXT_RESCUE'&&state.campaign.phase!=='result')return state;
 if(action.type==='PREPARE_NEXT'&&state.campaign.phase==='result')return {...state,ui:{...state.ui,modal:'nextPrep'}};
 let next=beforeLoopReducer(state,action);
 if(getCat(state).status!=='raising'&&getCat(next).status==='raising'){
  next={...next,cats:next.cats.map((cat,i)=>i?cat:{...cat,arrivalMemory:{heart:cat.heart,weight:cat.body.weight,phenotype:structuredClone(cat.phenotype||null)}})};
 }
 if(action.type==='SEND_EVENT'&&next.album.length>state.album.length){
  const cat=getCat(state);
  next={...next,album:next.album.map((entry,i)=>i===next.album.length-1?{...entry,arrivalMemory:structuredClone(cat.arrivalMemory||null),heart:cat.heart,weight:cat.body.weight,types:[...cat.types],surgery:structuredClone(cat.surgery),savedAt:Date.now()}:entry)};
 }
 return next;
};
const beforeLoopResult=renderResult;
renderResult=function(state,cat){
 return beforeLoopResult(state,cat).replace('data-action="next-rescue"','data-action="prepare-next"').replace('街へ戻り、次の保護へ','次の保護の準備へ').replace('</footer>',`<button class="loop-text-button" data-action="open-farewell">いっしょに過ごした記録を見る</button></footer>`);
};
function farewellHearts(value){return `<div class="memory-hearts" aria-label="心の記録">${Array.from({length:10},(_,i)=>`<span style="color:${i<Math.floor(value/10)?'#d87890':'#d9d0c8'}">♥</span>`).join('')}</div>`;}
function renderFarewell(state){
 const cat=getCat(state),start=cat.arrivalMemory,entry=state.album.find(e=>e.catId===cat.id),days=entry?.day||cat.body.days+1;
 const card=(label,memory)=>`<article><small>${label}</small><div class="farewell-photo">${renderCatArt({...cat,heart:memory.heart,body:{...cat.body,weight:memory.weight},phenotype:memory.phenotype||cat.phenotype})}</div><strong>${Math.round(memory.weight).toLocaleString('ja-JP')}g</strong>${farewellHearts(memory.heart)}</article>`;
 return `<div class="release-overlay" role="dialog" aria-modal="true" aria-label="いっしょに過ごした記録"><section class="release-sheet farewell-sheet"><header><small>${days}日間、いっしょに。</small><h2>${surgeryText(cat.name)}との記録</h2></header><div class="farewell-pair">${start?card('おうちに来た日',start):'<article class="farewell-missing">お迎え時の記録は<br>残っていません</article>'}${card('見送る日',{heart:cat.heart,weight:cat.body.weight,phenotype:cat.phenotype})}</div><p>${state.campaign.outcome==='tnr'?'これからは、地域で見守る日々へ。':'これからは、新しい家族との日々へ。'}</p><button class="campaign-button secondary" data-action="open-album">アルバムを見る</button><button class="loop-text-button" data-action="close-modal">見送りの場面へ戻る</button></section></div>`;
}
function renderLoopSheet(state){
 if(state.ui.modal==='farewell')return renderFarewell(state);
 if(state.ui.modal==='nextPrep')return `<div class="release-overlay" role="dialog" aria-modal="true" aria-label="次の保護の準備"><section class="release-sheet loop-prep"><header><small>次の出会いへ</small><h2>少しずつ、揃っていく。</h2></header><div class="loop-keeps">部屋・家具・道具は、そのまま次の子へ。</div><div class="loop-balance">● ${state.coins} <small>コイン</small></div><p>次の初診は12コイン。<br>街でごはんや道具を買い足せます。</p><button class="campaign-button" data-action="open-wallet">広告で＋50コインの支援</button><small>任意・ダミー広告。見なくても進めます。</small><button class="campaign-button secondary" data-action="next-rescue">街へ戻る・次の保護へ</button><button class="loop-text-button" data-action="close-modal">卒業の場面へ戻る</button></section></div>`;
 if(state.ui.modal!=='album')return '';
 const entries=[...state.album].reverse();
 return `<div class="release-overlay" role="dialog" aria-modal="true" aria-label="保護のアルバム"><section class="release-sheet loop-album"><header><small>いっしょに過ごした記録</small><h2>アルバム <small>${entries.length}匹</small></h2></header><div class="loop-album-list">${entries.length?entries.map((e,i)=>`<article class="loop-memory"><div class="loop-photo">${e.phenotype?renderCatArt({...e,id:'album-'+i,status:e.outcome}):'<span>🐾</span>'}</div><div><small>${e.outcome==='adopted'?'新しい家族へ':'地域で見守る・TNR'}</small><h3>${surgeryText(e.name)}</h3><p>${e.day}日間いっしょに<br>${surgeryText(e.coatLabel||'')} ${e.sex==='female'?'女の子':e.sex==='male'?'男の子':''}</p>${Number.isFinite(e.weight)?`<p>${Math.round(e.weight).toLocaleString('ja-JP')}g</p>`:''}${Number.isFinite(e.heart)?`<div class="memory-hearts" aria-label="心の記録">${Array.from({length:10},(_,n)=>`<span style="color:${n<Math.floor(e.heart/10)?'#d87890':'#d9d0c8'}">♥</span>`).join('')}</div>`:''}</div></article>`).join(''):'<p class="loop-empty">卒業したネコの記録が、ここに増えていきます。</p>'}</div><button class="campaign-button secondary" data-action="close-modal">戻る</button></section></div>`;
}
const beforeLoopRender=render;
render=function(state){
 const albumScroll=app.querySelector('.loop-album-list')?.scrollTop||0;
 beforeLoopRender(state);
 const host=app.querySelector('.hud-main,.campaign-place');
 if(host&&!state.campaign.requiredVisit&&!host.querySelector('[data-action="open-album"]'))host.insertAdjacentHTML('beforeend','<button class="loop-album-open" data-action="open-album" aria-label="保護のアルバム">記録</button>');
 if(['album','nextPrep','farewell'].includes(state.ui.modal)){
  app.querySelectorAll('.modal-layer,.release-overlay').forEach(el=>el.remove());
  app.insertAdjacentHTML('beforeend',renderLoopSheet(state));mountGameCats();const list=app.querySelector('.loop-album-list');if(list)list.scrollTop=albumScroll;
 }
};
app.addEventListener('click',event=>{const action=event.target.closest('[data-action]')?.dataset.action;if(action==='open-farewell')dispatch({type:'OPEN_FAREWELL'});if(action==='open-album')dispatch({type:'OPEN_ALBUM'});if(action==='prepare-next')dispatch({type:'PREPARE_NEXT'});});
const loopStyle=document.createElement('style');loopStyle.textContent=`
.loop-text-button{border:0;background:none;min-height:36px;color:#886a57;font-size:12px;text-decoration:underline}.loop-album-open{border:0;border-radius:16px;padding:7px 9px;font-size:11px;background:#ecdfce;white-space:nowrap}.loop-album{height:100%;max-height:650px}.loop-album-list{overflow-y:auto;touch-action:pan-y;min-height:0;flex:1;display:flex;flex-direction:column;gap:12px}.loop-memory{display:grid;grid-template-columns:94px minmax(0,1fr);gap:12px;background:#f4eadf;padding:12px;border-radius:14px;flex:none}.loop-photo{height:120px;background:#fff9eb;border:5px solid white;border-bottom-width:15px;display:grid;place-items:center}.loop-photo svg{width:100%;height:100%}.loop-memory h3{font-size:18px;margin:5px 0}.loop-memory small{font-size:10px;color:#8e7969}.loop-memory p{font-size:12px;margin:4px 0;line-height:1.5}.memory-hearts{display:flex;gap:1px;font-size:13px}.loop-prep{gap:12px;text-align:center}.loop-keeps{padding:16px;background:#e7ebdc;border-radius:14px;font-size:13px;line-height:1.7}.loop-balance{font-size:28px;color:#a7833f}.loop-balance small,.loop-prep>small{font-size:11px}.loop-prep p{font-size:13px;line-height:1.7;margin:0}.loop-empty{font-size:14px;line-height:1.8;padding:20px}.loop-prep header h2{font-size:21px}
@media(max-height:650px){.loop-prep{gap:8px}.loop-keeps{padding:12px}.loop-prep header h2{font-size:19px}.campaign-frame:has(.result-copy) .campaign-actions{gap:3px}.campaign-frame:has(.result-copy) .result-copy{padding:12px}}
 .loop-prep header{padding-right:0}
 .farewell-sheet{text-align:center;gap:12px}.farewell-sheet header{padding-right:0}.farewell-sheet h2{font-size:20px;margin:8px 0}.farewell-pair{display:grid;grid-template-columns:1fr 1fr;gap:12px}.farewell-pair article{min-width:0;background:#fff8eb;border-radius:12px;padding:8px}.farewell-pair small{font-size:12px}.farewell-photo{height:140px}.farewell-photo svg{height:100%;width:100%}.farewell-pair .memory-hearts{justify-content:center;font-size:12px;gap:0;margin-top:8px}.farewell-missing{display:grid;place-content:center;font-size:12px;line-height:1.7}.farewell-sheet p{font-size:13px;line-height:1.6;margin:0}.result-cat{animation:farewell-glance 3s ease-in-out 1}@keyframes farewell-glance{0%,100%{rotate:0deg}35%,60%{rotate:-5deg}}@media(max-height:600px){.farewell-photo{height:95px}.farewell-sheet{gap:8px}}@media(prefers-reduced-motion:reduce){.result-cat{animation:none}}
`;document.head.append(loopStyle);
