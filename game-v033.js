'use strict';
// First repeat-play tier. Adoption and TNR are equally valid completed rescues.
function graduatedCount(state){return new Set(state.album.filter(e=>['adopted','tnr'].includes(e.outcome)).map(e=>e.catId)).size;}
function parkUnlocked(state){return graduatedCount(state)>0;}
const beforeAreaReducer=reduceGameState;
reduceGameState=function(state,action){
 if(action.type==='CHOOSE_AREA'){
  if(getCat(state).status!=='candidate'||state.campaign.requiredVisit||!['a1','a2'].includes(action.area)||action.area==='a2'&&!parkUnlocked(state))return state;
  if(action.area==='a2')return {...state,ui:{...state.ui,modal:'areaBrief'}};
  return beforeAreaReducer({...state,campaign:{...state.campaign,area:'a1'}},{type:'GO_RESCUE'});
 }
 if(action.type==='ENTER_PARK'){
  if(getCat(state).status!=='candidate'||!parkUnlocked(state)||state.ui.modal!=='areaBrief')return state;
  return beforeAreaReducer({...state,campaign:{...state.campaign,area:'a2'}},{type:'GO_RESCUE'});
 }
 // Calls from the opening tutorial continue to select the first area.
 if(action.type==='GO_RESCUE')return beforeAreaReducer({...state,campaign:{...state.campaign,area:'a1'}},action);
 let next=beforeAreaReducer(state,action);
 if(action.type==='OPEN_TRAP'&&state.campaign.phase==='field'&&next.campaign.phase==='trapInspect'){
  const area=state.campaign.area||'a1',cat=getCat(next);
  next={...next,cats:[{...cat,rescueArea:area,...(area==='a2'?{age:'kitten',estimatedAgeMonths:4,phenotype:{...cat.phenotype,age:'kitten'},body:{...cat.body,weight:680}}:{})}]};
 }
 if(action.type==='SEND_EVENT'&&next.album.length>state.album.length){
  const area=getCat(state).rescueArea||state.campaign.area||'a1';
  next={...next,album:next.album.map((e,i)=>i===next.album.length-1?{...e,area}:e)};
  if(area!=='a1'&&next.campaign.outcome==='tnr')next={...next,areas:{...next.areas,a1:state.areas.a1||{tnrCount:0},[area]:{...state.areas[area],tnrCount:(state.areas[area]?.tnrCount||0)+1}}};
 }
 if(action.type==='NEXT_RESCUE'&&next!==state)next={...next,cats:next.cats.map(cat=>({...cat,rescueArea:null}))};
 return next;
};
const beforeAreaTown=renderTown;
renderTown=function(state){
 const t=document.createElement('template');t.innerHTML=beforeAreaTown(state);
 const field=t.content.querySelector('.book-map-hotspot.field');if(field){field.dataset.action='choose-area';field.dataset.area='a1';field.disabled=getCat(state).status!=='candidate';}
 const park=t.content.querySelector('.book-map-hotspot.park');if(park){const unlocked=parkUnlocked(state),button=document.createElement('button');button.className=park.className;button.dataset.action='choose-area';button.dataset.area='a2';button.disabled=!unlocked||getCat(state).status!=='candidate';button.innerHTML=`<strong>公園</strong><small>${unlocked?'子猫のケア':'1匹を見送ると解放'}</small>`;park.replaceWith(button);}
 return t.innerHTML;
};
const beforeAreaField=renderField;
renderField=function(state){const area=state.campaign.area||'a1';return beforeAreaField({...state,areas:{...state.areas,a1:state.areas[area]||{tnrCount:0}}}).replace('>空き地</span>',`>${area==='a2'?'公園':'空き地'}</span>`);};
const beforeAreaResult=renderResult;
renderResult=function(state,cat){let html=beforeAreaResult(state,cat);if(cat.rescueArea==='a2')html=html.replaceAll('住宅街','公園');return graduatedCount(state)===1?html.replace('</h1>','</h1><small class="area-unlock-note">新しい保護エリア「公園」が開きました</small>'):html;};
const beforeAreaRender=render;
render=function(state){
 beforeAreaRender(state);
 if(state.campaign.phase==='field'){
  const area=state.campaign.area||'a1',last=state.album.filter(e=>e.outcome==='tnr'&&(e.area||'a1')===area&&e.phenotype).at(-1);
  app.querySelectorAll('.field-tnr-cat').forEach(el=>{if(last)el.innerHTML=renderCatArt({...last,id:last.catId,status:'tnr'});else el.remove();});mountGameCats();
 }
 if(state.ui.modal==='areaBrief')app.insertAdjacentHTML('beforeend',`<div class="release-overlay" role="dialog" aria-modal="true" aria-label="公園の保護"><section class="release-sheet area-brief"><header><small>ステージ2・公園</small><h2>小さな体を、育てよう。</h2></header><div class="area-brief-art">🐾</div><p>ここで出会うのは子猫。<br>ごはんと水を用意して、成長を見守ろう。</p><div class="area-target">680gから、手術の目標700gへ</div><small>心は50から。今の家具・道具を使えます。<br>難しければ空き地を選んでも大丈夫。</small><button class="campaign-button" data-action="enter-park">公園で保護する</button><button class="campaign-button secondary" data-action="close-modal">街へ戻る</button></section></div>`);
};
app.addEventListener('click',event=>{const node=event.target.closest('[data-action]');if(node?.dataset.action==='choose-area')dispatch({type:'CHOOSE_AREA',area:node.dataset.area});if(node?.dataset.action==='enter-park')dispatch({type:'ENTER_PARK'});});
const areaStyle=document.createElement('style');areaStyle.textContent=`.area-brief{text-align:center;gap:12px}.area-brief header{padding:0}.area-brief h2{font-size:21px}.area-brief p{font-size:14px;line-height:1.8;margin:0}.area-brief>small{font-size:11px;line-height:1.7}.area-brief-art{font-size:42px;background:#dfe9d5;border-radius:20px;padding:18px}.area-target{padding:12px;background:#f0e3cb;border-radius:12px;font-size:14px}.area-unlock-note{display:block;color:#657a4e;font-size:11px;margin:6px 0}@media(max-height:650px){.area-brief{gap:8px}.area-brief-art{padding:8px;font-size:30px}.area-brief h2{font-size:19px}}`;document.head.append(areaStyle);render(gameState);
