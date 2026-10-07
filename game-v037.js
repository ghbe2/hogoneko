'use strict';
const stableEncounterRender=render;let encounterMarkup=null;
render=function(state){
 if(!titleScreenOpen&&state.campaign.phase==='trapInspect'&&!state.ui.modal){
  const markup=renderTrapInspect(state,getCat(state));
  if(app.querySelector('.capture-inspect')&&encounterMarkup===markup)return;
  encounterMarkup=markup;
 }else encounterMarkup=null;
 stableEncounterRender(state);
};
const closeEncounter=renderTrapInspect;
const closeMount=mountGameCats;
mountGameCats=function(){closeMount();app.querySelectorAll('.capture-cat .game-cat-svg').forEach(svg=>{if(svg.dataset.framed)return;svg.dataset.framed='1';{if(!svg.isConnected)return;let points=[];const inverse=svg.getScreenCTM()?.inverse();if(!inverse)return;svg.querySelectorAll('path,ellipse,circle,polygon').forEach(el=>{if(el.closest('defs,clipPath,mask'))return;for(let n=el;n&&n!==svg;n=n.parentElement){const s=getComputedStyle(n);if(s.display==='none'||s.visibility==='hidden'||Number(s.opacity)===0)return;}const r=el.getBoundingClientRect();if(!r.width&&!r.height)return;points.push(new DOMPoint(r.left,r.top).matrixTransform(inverse),new DOMPoint(r.right,r.bottom).matrixTransform(inverse));});if(!points.length)return;const x=Math.min(...points.map(p=>p.x)),y=Math.min(...points.map(p=>p.y)),w=Math.max(...points.map(p=>p.x))-x,h=Math.max(...points.map(p=>p.y))-y;svg.setAttribute('viewBox',[x-w*.08,y-h*.1,w*1.16,h*1.2].map(n=>n.toFixed(2)).join(' '));svg.setAttribute('preserveAspectRatio','xMidYMid meet');}});};
renderTrapInspect=function(state,cat){const t=document.createElement('template');t.innerHTML=closeEncounter(state,cat);const frame=t.content.querySelector('.capture-footprint'),cage=frame?.querySelector('.capture-cage');if(cage)frame.replaceWith(cage);const food=t.content.querySelector('.capture-food');if(food)food.innerHTML=bookImage(bookIcons.starter_food);return t.innerHTML;};
const encounterCloseStyle=document.createElement('style');encounterCloseStyle.textContent=`
#app .capture-inspect{background-image:none!important;background:radial-gradient(ellipse at 50% 42%,#f9ebd0,#dfcfb7);padding:0;gap:10px;display:flex;flex-direction:column}
#app .capture-inspect .capture-cage{width:100%;height:auto;min-height:240px;flex:1;border:0;border-radius:0;box-shadow:none}
#app .capture-inspect .capture-cat{width:90%;height:90%;left:5%;right:auto;bottom:3%;transform:none;animation:none}
#app .capture-inspect .capture-cat .game-cat-svg{width:100%;height:100%;transform:scale(.85);transform-origin:center center}
#app .capture-food .book-icon{width:100px;height:66px;max-width:none;max-height:none;object-fit:contain}
#app .capture-food{left:calc(50% - 50px);bottom:12px;width:100px;height:66px}
#app .capture-inspect .capture-note{order:-1;align-self:center;margin:12px 12px 0;box-shadow:none;background:#fff8eadb}
#app .campaign-frame:has(.capture-inspect) [data-action="go-clinic"]{background:#637d59;color:#fffdf5;border-color:#637d59;font-size:16px;font-weight:700;min-height:56px;box-shadow:0 4px 12px #43593b30}
#app .capture-inspect.revealing .capture-cat{animation:captured-cat-reveal 2.8s ease-out both}
#app .capture-inspect.settled .capture-cat{opacity:1;filter:none;animation:encounter-breathe 3s ease-in-out infinite}
@keyframes encounter-breathe{50%{translate:0 -3px}}
#app .capture-inspect.settled .capture-cage-dark{opacity:.25;transition:opacity .8s}
#app .capture-inspect.settled .capture-cage:after{opacity:.12;transition:opacity .8s}
#app .campaign-scroll:has(>.capture-inspect){padding:0}
#app .capture-inspect> :not(.capture-cage){flex:none;max-width:calc(100% - 24px);margin:0 12px 12px}
`;document.head.append(encounterCloseStyle);
renderDebugQuickbar=()=>'';renderDebugPanel=()=>'';renderIntakeDebug=()=>'';
const fullFieldBackground=bookBackground;
bookBackground=function(node,svg){if(node?.matches('.field-scene')&&svg)svg=svg.replace('<svg ','<svg preserveAspectRatio="xMidYMid slice" ');return fullFieldBackground(node,svg);};
const baitFirstReduce=reduceGameState;
reduceGameState=function(state,action){
 const c=state.campaign;
 if(action.type==='FIELD_TOGGLE_FOOD'){
  if(c.phase!=='field'||c.trapWaiting||!getFood(action.id)||getFood(action.id).water)return state;
  const selected=c.bait.includes(action.id);
  if(!selected&&(!(state.inventory[action.id]>=1)||c.bait.length>=CONFIG.capture.maxMix))return state;
  return {...state,campaign:{...c,bait:selected?c.bait.filter(id=>id!==action.id):[...c.bait,action.id]}};
 }
 if(action.type==='FIELD_PLACE_TRAP'&&(!c.bait.length||c.bait.some(id=>state.inventory[id]<1)))return state;
 return baitFirstReduce(state,action);
};
const autoTrapDispatch=dispatch;
dispatch=function(action){autoTrapDispatch(action);if(action.type==='FIELD_PLACE_TRAP'&&gameState.campaign.phase==='field'&&gameState.campaign.trapPlaced&&!gameState.campaign.trapWaiting)autoTrapDispatch({type:'FINISH_FIELD_PREP'});};
const baitFirstField=renderField;
renderField=function(state){
 const t=document.createElement('template');t.innerHTML=baitFirstField(state);const c=state.campaign;
 t.content.querySelector('.campaign-frame')?.classList.add('field-fullscreen');
 t.content.querySelectorAll('.prepared-bait,[data-action="finish-field-prep"]').forEach(n=>n.remove());
 // Bait selection stays plural in state; the cage shows a single serving.
 const serving=t.content.querySelector('.trap-bait');if(serving)serving.innerHTML=c.bait.length?(getFood(c.bait[0])?.emoji||'◉'):'';
 const kit=t.content.querySelector('.field-kit');if(kit){
  const trap=FIELD_TRAPS.find(t=>t.id===c.fieldTrap)||FIELD_TRAPS[0];
  kit.innerHTML=c.trapWaiting?'':`<div class="field-food-list" aria-label="保護に使う餌">${CONFIG.stage1.foods.filter(f=>!f.water).map(f=>`<button class="field-food-pill ${c.bait.includes(f.id)?'selected':''}" aria-pressed="${c.bait.includes(f.id)}" data-action="field-toggle-food" data-id="${f.id}" ${state.inventory[f.id]>=1?'':'disabled'}><span>${f.emoji}</span><strong>${f.label}</strong><small>${c.bait.includes(f.id)?'✓ ':''}${f.unlimited?'∞':'×'+(state.inventory[f.id]||0)}</small></button>`).join('')}</div><div class="field-trap-row"><button class="gear-card" data-field-drag="trap" data-trap="${trap.id}" ${c.bait.length?'':'disabled'}><span>${trap.emoji}</span><strong>${trap.label}</strong><small>ドラッグして置く</small></button><button class="field-switch" data-action="field-menu" data-kind="trap" aria-label="保護器を選ぶ">切り替え ▾</button></div>`;
 }
 if(kit){
  if(c.trapWaiting)kit.innerHTML='<div class="field-trap-row"><button class="gear-card"></button><button class="field-switch"></button></div>';
  kit.classList.add('encounter-kit');
  kit.querySelectorAll('.field-food-pill:disabled').forEach(n=>n.remove());
  const row=kit.querySelector('.field-trap-row'),button=row.querySelector('.gear-card');
  button.classList.add('encounter-trap');
  button.innerHTML=`<svg viewBox="0 0 220 125" aria-hidden="true"><ellipse cx="112" cy="111" rx="92" ry="9" fill="#574a3820"/><path d="M30 35L65 15H193V88L163 110H30Z" fill="#e7ddc3" stroke="#746e5b" stroke-width="3"/><path d="M30 35H163L193 15M163 35V110M163 110L193 88" fill="none" stroke="#746e5b" stroke-width="3"/><path d="M45 38V105M64 38V105M84 38V105M104 38V105M124 38V105M144 38V105M174 32V98M185 25V91M34 58H160M34 82H160" fill="none" stroke="#8b8771" stroke-width="3"/><path d="M91 16V8Q91 3 98 3H123Q130 3 130 8V16" fill="none" stroke="#746e5b" stroke-width="4"/><ellipse cx="100" cy="98" rx="23" ry="5" fill="${c.bait.length?'#b68b59':'#c9bfa7'}"/></svg><small>${c.bait.length?'草むらへ、そっと置く':'まずは、ごはんを選んで'}</small>`;
  const change=row.querySelector('.field-switch');change.innerHTML='⇄';change.classList.add('encounter-change');change.title='保護器を選ぶ';
  kit.prepend(row);
  const placed=t.content.querySelector('.field-scene .trap');if(placed){placed.classList.add('illustrated-trap');placed.replaceChildren(button.querySelector('svg').cloneNode(true));}
  if(c.trapWaiting)kit.replaceChildren();
 }
 const status=t.content.querySelector('.trap-status');if(status)status.remove();
 return t.innerHTML;
};
app.addEventListener('click',e=>{const b=e.target.closest('[data-action="field-toggle-food"]');if(b&&!b.disabled)dispatch({type:'FIELD_TOGGLE_FOOD',id:b.dataset.id});});
window.addEventListener('pointerdown',e=>{const svg=e.target.closest('.encounter-trap')?.querySelector('svg');if(svg&&fieldDragDraft?.ghost){fieldDragDraft.ghost.replaceChildren(svg.cloneNode(true));fieldDragDraft.ghost.style.width='160px';fieldDragDraft.ghost.style.height='100px';}});
const fieldStyle=document.createElement('style');fieldStyle.textContent=`
.screen-guide,.debug-quickbar,.debug-panel,.intake-debug-panel{display:none!important}.tutorial-focus{outline:none!important;animation:none!important}
#app .field-scene .trap.ready{border-color:#70675f}
#app .field-scene .illustrated-trap{width:180px;height:110px;border:0;border-radius:0;background:none;box-shadow:none;padding:0;opacity:1}#app .field-scene .illustrated-trap:after{display:none}#app .illustrated-trap>svg{width:100%;height:100%;pointer-events:none}
#app .field-fullscreen .campaign-screen{position:relative;flex:1;min-height:0;padding:0}#app .field-fullscreen .campaign-scroll{position:relative;flex:1;height:100%;padding:0;display:block}#app .field-fullscreen .field-scene{position:absolute;inset:0;width:100%;height:100%;max-height:none;min-height:0;margin:0;border-radius:0;aspect-ratio:auto}#app .field-fullscreen .field-scene>svg{width:100%;height:100%}
#app .field-fullscreen .field-kit{position:absolute;bottom:12px;left:12px;right:12px;display:flex;flex-direction:column;gap:10px;padding:0;margin:0;z-index:4;background:none}#app .field-kit:empty{display:none}.field-food-list{display:flex;gap:8px;overflow-x:auto;touch-action:pan-x;padding:4px}.field-food-pill{flex:0 0 104px;min-height:76px;border:1px solid #e1d2bb;border-radius:22px;background:#fff8eeed;padding:8px;color:#715746;display:grid;justify-items:center;gap:3px}.field-food-pill.selected{border:2px solid #8a9d73;background:#edf2de}.field-food-pill:disabled{opacity:.45}.field-food-pill strong{font-size:11px;font-weight:500}.field-food-pill small{font-size:11px}.field-food-pill img{width:32px;height:28px;object-fit:contain}.field-trap-row{display:flex;align-items:center;justify-content:center;gap:10px}#app .field-trap-row .gear-card{width:185px;min-height:68px;border-radius:32px;background:#fff8e9;border:1px solid #e1d2bb;box-shadow:none}#app .field-trap-row .field-switch{width:auto;min-height:44px;border-radius:24px;padding:10px 16px;background:#fff8e9}#app .field-trap-row .gear-card:disabled{opacity:.45}
#app .field-fullscreen .encounter-kit{max-width:480px;margin:auto;gap:4px;bottom: max(16px,env(safe-area-inset-bottom));left:16px;right:16px;isolation:isolate}
.encounter-kit:before{content:'';position:absolute;inset:-20px -16px -25px;background:linear-gradient(transparent,#eee0c7b0 45%,#eee0c7e8);z-index:-1;pointer-events:none}
#app .encounter-kit .field-trap-row{position:relative;width:230px;align-self:center;gap:0}
#app .encounter-kit .encounter-trap{display:flex;flex-direction:column;align-items:center;width:220px;height:146px;padding:0;border:0;border-radius:0;background:none;box-shadow:none;gap:0;opacity:1;cursor:grab}
.encounter-trap svg{width:210px;height:120px;pointer-events:none;filter:drop-shadow(0 5px 6px #574a3820);transition:transform .2s}
#app .encounter-trap small{font-size:12px;letter-spacing:.08em;color:#655b45;background:none}.encounter-trap:disabled svg{opacity:.55}.encounter-trap:not(:disabled):hover svg{transform:translateY(-4px)}
#app .encounter-kit .encounter-change{position:absolute;right:-8px;top:34px;width:44px;height:44px;min-height:44px;border:1px solid #fff9e9a0;border-radius:50%;padding:0;background:#fff9e9bd;box-shadow:none;font-size:22px;color:#726750}
.encounter-kit .field-food-list{padding:8px 4px 4px;gap:10px;scrollbar-width:none;scroll-snap-type:x proximity}.encounter-kit .field-food-list::-webkit-scrollbar{display:none}
.encounter-kit .field-food-pill{flex:0 0 82px;min-height:92px;padding:5px 2px;gap:4px;border:0;border-radius:0;background:none;scroll-snap-align:start;position:relative;align-content:start}
.encounter-kit .field-food-pill>span{width:54px;height:54px;border-radius:50%;display:grid;place-items:center;background:#fff7e7b0;border:2px solid transparent;transition:background .2s,transform .2s}
.encounter-kit .field-food-pill.selected{background:none;border:0}.encounter-kit .field-food-pill.selected>span{background:#fff9e9;border-color:#788b60;transform:translateY(-3px);box-shadow:0 3px 10px #57654320}
.encounter-kit .field-food-pill img{width:42px;height:36px}.encounter-kit .field-food-pill strong{max-width:82px;line-height:1.4;font-size:11px}.encounter-kit .field-food-pill small{font-size:11px;color:#736951}
#app .encounter-kit .field-trap-row .encounter-change{border-radius:50%;width:44px;height:44px;padding:0}.encounter-kit .field-food-list{width:max-content;max-width:100%;align-self:center}
`;document.head.append(fieldStyle);
// A reset must not be undone by pagehide/visibility/timer autosaves on reload.
let resettingSave=false;
const saveBeforeResetGuard=saveGameState;
saveGameState=function(state){return resettingSave?false:saveBeforeResetGuard(state);};
resetGameSave=function(){
 resettingSave=true;
 try{localStorage.removeItem(SAVE_KEY);}catch(error){resettingSave=false;window.alert('記録を消せませんでした。ブラウザの保存設定を確認してください。');return;}
 location.reload();
};
// Keep the opening quiet: the illustration, title and one clear start action.
const quietTitle=renderTitle;
renderTitle=function(state){
 const t=document.createElement('template');t.innerHTML=quietTitle(state);
 t.content.querySelectorAll('.title-kicker,.title-screen>p,.title-actions small').forEach(n=>n.remove());
 const button=t.content.querySelector('[data-action="start-game"]');
 button.className='opening-start';button.innerHTML=`<span>${state.onboarding.status==='new'?'はじめる':'つづきから'}</span><span aria-hidden="true">→</span>`;
 return t.innerHTML;
};
const quietTitleRender=render;
render=function(state){quietTitleRender(state);const title=app.querySelector('.title-screen');if(!title)return;
 const restart=title.querySelector('.new-release-game');if(restart){
  if(state.onboarding.status==='new'){restart.remove();return;}
  const options=document.createElement('details');options.className='opening-options';
  options.innerHTML='<summary aria-label="タイトルの設定">⋯</summary>';restart.textContent='はじめから遊び直す';options.appendChild(restart);title.appendChild(options);
 }
};
const openingStyle=document.createElement('style');openingStyle.textContent=`
#app .campaign-button{border:1px solid #f0e5d4;border-radius:32px;background:#fff8e9;color:#715746;box-shadow:0 3px 12px #70553414;font-weight:500;transition:transform .15s,background .15s}
#app .campaign-button.secondary{background:#ffffff75;border-color:#d9c8ae;box-shadow:none;color:#806b58}
#app .campaign-button:disabled{background:#e8e1d7;border-color:transparent;box-shadow:none;color:#9d9488;cursor:default}
#app .campaign-button:not(:disabled):active{transform:scale(.98);background:#fffdf4}
#app .campaign-button:focus-visible{outline:3px solid #876f4c;outline-offset:3px}
#app .story-screen .title-actions{display:grid;grid-template-rows:16px 56px 44px;row-gap:6px;flex:0 0 128px;height:128px;padding:0;margin-top:auto;width:100%;justify-items:center}
#app .story-screen .story-pages{grid-row:1;margin:0;align-self:center}
#app .story-screen [data-action="next-story"]{grid-row:2;min-height:56px;width:min(100%,260px);font-size:15px;letter-spacing:.08em}
#app .story-screen .story-back{grid-row:3;min-height:44px;font-size:12px;padding:10px 16px;margin:0}
#app .story-screen{padding-bottom:18px}
#app .story-screen .intro-illustration{flex:1 1 220px;min-height:85px;max-height:220px}
.storybook .title-screen{padding:clamp(28px,8vh,64px) 24px 32px}
.storybook .title-screen h1{font-size:46px;letter-spacing:.18em;margin:0;text-indent:.18em}
.storybook .title-screen .title-actions{width:auto;padding:0;margin-bottom:10px}
.title-screen .opening-start{min-width:208px;min-height:56px;padding:14px 24px;border:1px solid #fff9e9;border-radius:40px;background:#fff8e9ed;color:#715746;font:inherit;font-size:17px;letter-spacing:.12em;display:flex;align-items:center;justify-content:center;gap:25px;box-shadow:0 4px 18px #70553420;cursor:pointer;transition:transform .15s,background .15s}
.title-screen .opening-start:active{transform:scale(.96);background:#fffdf4}.title-screen .opening-start:focus-visible{outline:3px solid #876f4c;outline-offset:5px}
.opening-options{position:absolute;right:14px;top:12px;z-index:5;text-align:right}.opening-options summary{list-style:none;cursor:pointer;width:44px;height:44px;display:grid;place-items:center;font-size:24px;color:#806b58;border-radius:50%;background:#fff8e970}.opening-options summary::-webkit-details-marker{display:none}.opening-options .new-release-game{background:#fff8ec;border:1px solid #d9c8ae;border-radius:12px;padding:14px;min-height:48px;color:#755b49;font-size:13px;box-shadow:0 5px 18px #70553422}
`;document.head.appendChild(openingStyle);
// Provisional progression: never gate necessities or remove already-owned items.
const SHOP_UNLOCKS={ribbon:1,bug:1,hammock:1,peek_toy:3};
function graduatedCount(state){return new Set(state.album.filter(e=>['adopted','tnr'].includes(e.outcome)).map(e=>e.catId)).size;}
function shopUnlocked(state,id){return owned(state,id)||graduatedCount(state)>=(SHOP_UNLOCKS[id]||0);}
function nextShopGoal(state){
 const count=graduatedCount(state),locked=SHOP_CATALOG.filter(p=>!shopUnlocked(state,p.id));
 const threshold=Math.min(...locked.map(p=>SHOP_UNLOCKS[p.id]));
 if(!Number.isFinite(threshold))return '';
 return `あと${threshold-count}匹の卒業で入荷：`+locked.filter(p=>SHOP_UNLOCKS[p.id]===threshold).map(p=>p.label).join('・');
}
function productBenefit(id){
 const item=getItem(id),cleaner=getCleaner(id);
 if(item?.kind==='hand')return '基本道具より遊びが速い。好みに合う子へ。';
 if(item?.kind==='placed')return '部屋の居場所に。次の子にも引き継ぐ。';
 if(id==='groom_comb')return '抜け毛を予防。掃除の手間を減らす。';
 if(id==='groom_wipe')return '体を拭いてお手入れ。';
 if(cleaner)return `掃除の強さ ${cleaner.power}。まとめて片づける。`;
 if(getFood(id))return 'お皿半分ずつ補充。好みに合うごはんを。';
 return '';
}
const progressionReduce=reduceGameState;
reduceGameState=function(state,action){
 if(action.type==='BUY_SHOP_ITEM'&&!shopUnlocked(state,action.itemId))return {...state,ui:{...state.ui,shopNotice:`卒業${SHOP_UNLOCKS[action.itemId]}匹で入荷します（譲渡・TNR）。`}};
 let next=progressionReduce(state,action);
 if(action.type==='NEXT_RESCUE'&&next!==state&&state.campaign.phase==='result')next={...next,economy:{...next.economy,cycleStartSpent:state.economy?.spent||0}};
 return next;
};
const progressionProducts=shopProducts;
shopProducts=function(state,...args){
 const t=document.createElement('template');t.innerHTML=progressionProducts(state,...args);
 t.content.querySelectorAll('.shop-product').forEach(node=>{
  const id=node.dataset.item,required=SHOP_UNLOCKS[id]||0;
  if(!shopUnlocked(state,id)){node.disabled=true;node.classList.add('progression-locked');node.querySelector('b').textContent=`卒業 ${graduatedCount(state)} / ${required} 匹で入荷`;node.querySelector('small:last-child').textContent='譲渡・TNRどちらも対象';}
  const detail=document.createElement('small');detail.className='product-benefit';detail.textContent=productBenefit(id);node.appendChild(detail);
 });return t.innerHTML;
};
const progressionPrep=renderLoopSheet;
renderLoopSheet=function(state){
 const html=progressionPrep(state);if(state.ui.modal!=='nextPrep')return html;
 const t=document.createElement('template');t.innerHTML=html;
 const sheet=t.content.querySelector('.loop-prep'),p=sheet.querySelector('p'),total=state.economy?.spent||0,baseline=state.economy?.cycleStartSpent;
 const costs=Number.isFinite(baseline)?`今回の支出 ${Math.max(0,total-baseline)} コイン`:`これまでの支出 ${total} コイン`;
 p.innerHTML=`${costs}<br>次の初診：12コイン${state.coins<12?`（あと${12-state.coins}）`:`・支払い後 ${state.coins-12} コイン`}`;
 const keeps=sheet.querySelector('.loop-keeps');keeps.textContent='家具・道具・残りの消耗品は引き継ぎ。無料のごはん・玩具・コロコロも使えます。';
 const count=graduatedCount(state),newItems=SHOP_CATALOG.filter(p=>SHOP_UNLOCKS[p.id]===count);
 const news=newItems.length?'新入荷：'+newItems.map(p=>p.label).join('・'):nextShopGoal(state);
 if(news){const note=document.createElement('div');note.className='progression-news';note.textContent=newItems.length?news:news+'（譲渡・TNR）';keeps.after(note);}
 sheet.querySelector('header h2').textContent=count?'次の子へ、少しずつ。':'次の出会いへ。';
 return t.innerHTML;
};
const progressionStyle=document.createElement('style');progressionStyle.textContent=`
.shop-product .product-benefit{color:#75634e;font-size:11px;line-height:1.5;white-space:normal}.shop-product.progression-locked{opacity:.65}.progression-news{font-size:12px;line-height:1.5;padding:8px;background:#e7ebdc;border-radius:10px}.loop-prep .loop-keeps{padding:10px;font-size:12px}.loop-prep header h2{font-size:18px}.loop-prep{gap:6px}.loop-prep header h2{margin:6px 0}.loop-prep .loop-balance{font-size:25px}
`;document.head.appendChild(progressionStyle);render(gameState);

// Daily discovery: local calendar day, once per save, not per cat or simulated day.
function discoveryDay(now=new Date()){return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;}
function discoveryAvailable(state){return getCat(state).status==='raising'&&(!state.dailyDiscovery?.lastDay||state.dailyDiscovery.lastDay<discoveryDay());}
const discoveryReduce=reduceGameState;
function discoveryScene(state){return state.campaign.phase==='room'&&!state.ui.modal&&!state.ui.layoutMode&&!state.ui.holdingCat&&!state.ui.careAnimation&&!state.campaign.requiredVisit&&discoveryAvailable(state);}
reduceGameState=function(state,action){
 if(action.type==='ROAM_CAT'&&discoveryScene(state))return state;
 const next=discoveryReduce(state,action);
 if(action.type!=='PICK_DISCOVERY_COIN'||!discoveryScene(state)||!discoveryScene(next))return next;
 return {...next,coins:next.coins+5,dailyDiscovery:{lastDay:discoveryDay(),visits:(state.dailyDiscovery?.visits||0)+1},ui:{...next.ui,coinDiscovery:{id:Date.now()+Math.random(),until:Date.now()+2200}}};
};
const discoveryPose=scenePose;
scenePose=function(svg){const pose=discoveryPose(svg);if(svg.closest('.cat-object')&&discoveryScene(gameState)&&!gameState.ui.playMode&&!['walk','jump'].includes(pose[0]))return [Date.now()%4500<2900?'punch':'sit','neutral'];return pose;};
const discoveryRender=render;let lastDiscovery=null;
render=function(state){
 discoveryRender(state);const cat=app.querySelector('.cat-object'),stage=app.querySelector('.stage');if(!cat||!stage||state.ui.modal||state.ui.layoutMode)return;
 const c=cat.getBoundingClientRect(),s=stage.getBoundingClientRect();
 if(discoveryScene(state)){const clue=document.createElement('button');clue.type='button';clue.className='discovery-pickup';clue.dataset.action='pick-discovery-coin';clue.innerHTML='<span>●</span>';clue.setAttribute('aria-label','ネコが遊んでいるコインを拾う');stage.appendChild(clue);positionDiscoveryCoin();}
 const found=state.ui.coinDiscovery;if(!found||found.id===lastDiscovery||found.until<Date.now())return;lastDiscovery=found.id;
 const coin=document.createElement('span');coin.className='discovery-coin';coin.textContent='● +5';coin.setAttribute('role','status');coin.setAttribute('aria-label','5コインを見つけた');const x=Math.max(30,Math.min(s.width-50,c.left-s.left+c.width/2)),y=Math.max(35,c.top-s.top+c.height*.5);coin.style.left=x+'px';coin.style.top=y+'px';stage.appendChild(coin);
 coin.animate([{translate:'0 0',opacity:0,scale:.5},{offset:.2,translate:'0 -25px',opacity:1,scale:1.15},{offset:.6,translate:'0 -25px',opacity:1,scale:1},{translate:`${s.width-42-x}px ${-y}px`,opacity:0,scale:.45}],{duration:2100,fill:'forwards'});setTimeout(()=>coin.remove(),2200);
};
const discoveryStyle=document.createElement('style');discoveryStyle.textContent='.discovery-glint{position:absolute;pointer-events:none;color:#d6ac54;font-size:20px;animation:discovery-glint 3s ease-in-out infinite}.discovery-coin{position:absolute;z-index:90;pointer-events:none;color:#ba872d;font:bold 23px system-ui;text-shadow:0 2px #fff8}@keyframes discovery-glint{50%{opacity:.2;scale:.7}}@media(prefers-reduced-motion:reduce){.discovery-glint{animation:none}}';document.head.appendChild(discoveryStyle);render(gameState);
function positionDiscoveryCoin(){const coin=app.querySelector('.discovery-pickup'),cat=app.querySelector('.cat-object'),stage=app.querySelector('.stage');if(!coin||!cat||!stage)return;const c=cat.getBoundingClientRect(),s=stage.getBoundingClientRect();coin.style.left=Math.max(24,Math.min(s.width-24,c.left-s.left+c.width*.67))+'px';coin.style.top=Math.max(24,Math.min(s.height-24,c.bottom-s.top-12))+'px';}
app.addEventListener('click',event=>{if(event.target.closest('[data-action="pick-discovery-coin"]'))dispatch({type:'PICK_DISCOVERY_COIN'});});
discoveryStyle.textContent+='.discovery-pickup{position:absolute;z-index:76;width:48px;height:48px;padding:0;border:0;background:none;transform:translate(-50%,-50%);touch-action:manipulation}.discovery-pickup span{display:block;color:#dca735;font-size:30px;text-shadow:0 2px #8d631f,0 0 2px #fff;animation:coin-roll 4.5s ease-in-out infinite}@keyframes coin-roll{0%,65%,100%{translate:-7px 0;rotate:-20deg}32%{translate:7px -3px;rotate:30deg}}@media(prefers-reduced-motion:reduce){.discovery-pickup span{animation:none}}';
setInterval(positionDiscoveryCoin,100);
