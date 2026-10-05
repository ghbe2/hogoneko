'use strict';
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
