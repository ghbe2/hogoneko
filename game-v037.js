'use strict';
// Provisional progression: never gate necessities or remove already-owned items.
const SHOP_UNLOCKS={ribbon:1,bug:1,hammock:1,peek_toy:3};
function graduatedCount(state){return new Set(state.album.filter(e=>['adopted','tnr'].includes(e.outcome)).map(e=>e.catId)).size;}
function shopUnlocked(state,id){return owned(state,id)||graduatedCount(state)>=(SHOP_UNLOCKS[id]||0);}
function productBenefit(id){
 const item=getItem(id),cleaner=getCleaner(id);
 if(item?.kind==='hand')return '基本道具より遊びが速い。好みに合う子へ。';
 if(item?.kind==='placed')return '部屋の居場所に。次の子にも引き継ぐ。';
 if(id==='groom_comb')return '抜け毛を予防。掃除の手間を減らす。';
 if(id==='groom_wipe')return '体を拭いてお手入れ。';
 if(cleaner)return `掃除の強さ ${cleaner.power}。まとめて片づける。`;
 if(getFood(id))return '基本ごはんの2倍の量を、一度で補充。';
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
 const keeps=sheet.querySelector('.loop-keeps');keeps.textContent='家具・道具・残りの消耗品は引き継ぎ。無料のごはん・玩具・ぞうきんも使えます。';
 const count=graduatedCount(state),newItems=SHOP_CATALOG.filter(p=>SHOP_UNLOCKS[p.id]===count);
 if(newItems.length){const note=document.createElement('div');note.className='progression-news';note.textContent='新入荷：'+newItems.map(p=>p.label).join('・');keeps.after(note);}
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
reduceGameState=function(state,action){
 const next=discoveryReduce(state,action);
 if(state.campaign.phase!=='room'||next.campaign.phase!=='room'||state.ui.modal||state.ui.layoutMode||!discoveryAvailable(state))return next;
 const a=state.ui.careAnimation;
 const care=action.type==='FINISH_CARE'&&a&&a.id===action.id&&!next.ui.careAnimation;
 const call=action.type==='EXECUTE_CONTACT'&&action.contact==='call'&&next.ui.feel?.id!==state.ui.feel?.id;
 const pet=action.type==='TAP_CAT'&&!next.ui.careAnimation&&next.ui.feel?.id!==state.ui.feel?.id;
 const toy=action.type==='FINISH_PLAY'&&owned(state,action.itemId||state.ui.equippedHand)&&getDurability(state,action.itemId||state.ui.equippedHand)>0;
 if(!care&&!call&&!pet&&!toy)return next;
 return {...next,coins:next.coins+5,dailyDiscovery:{lastDay:discoveryDay(),visits:(state.dailyDiscovery?.visits||0)+1},ui:{...next.ui,coinDiscovery:{id:Date.now()+Math.random(),until:Date.now()+2200}}};
};
const discoveryPose=scenePose;
scenePose=function(svg){const pose=discoveryPose(svg);if(svg.closest('.cat-object')&&gameState.campaign.phase==='room'&&!gameState.ui.layoutMode&&!gameState.ui.modal&&!gameState.ui.careAnimation&&!gameState.ui.playMode&&discoveryAvailable(gameState)&&pose[0]==='sit'&&Date.now()%9000<2200)return ['punch','neutral'];return pose;};
const discoveryRender=render;let lastDiscovery=null;
render=function(state){
 discoveryRender(state);const cat=app.querySelector('.cat-object'),stage=app.querySelector('.stage');if(!cat||!stage||state.ui.modal||state.ui.layoutMode)return;
 const c=cat.getBoundingClientRect(),s=stage.getBoundingClientRect();
 if(discoveryAvailable(state)){const clue=document.createElement('span');clue.className='discovery-glint';clue.textContent='✧';clue.style.left=Math.max(12,Math.min(s.width-12,c.left-s.left+c.width*.6))+'px';clue.style.top=Math.min(s.height-15,c.bottom-s.top-5)+'px';clue.setAttribute('aria-hidden','true');stage.appendChild(clue);}
 const found=state.ui.coinDiscovery;if(!found||found.id===lastDiscovery||found.until<Date.now())return;lastDiscovery=found.id;
 const coin=document.createElement('span');coin.className='discovery-coin';coin.textContent='● +5';coin.setAttribute('role','status');coin.setAttribute('aria-label','5コインを見つけた');const x=Math.max(30,Math.min(s.width-50,c.left-s.left+c.width/2)),y=Math.max(35,c.top-s.top+c.height*.5);coin.style.left=x+'px';coin.style.top=y+'px';stage.appendChild(coin);
 coin.animate([{translate:'0 0',opacity:0,scale:.5},{offset:.2,translate:'0 -25px',opacity:1,scale:1.15},{offset:.6,translate:'0 -25px',opacity:1,scale:1},{translate:`${s.width-42-x}px ${-y}px`,opacity:0,scale:.45}],{duration:2100,fill:'forwards'});setTimeout(()=>coin.remove(),2200);
};
const discoveryStyle=document.createElement('style');discoveryStyle.textContent='.discovery-glint{position:absolute;pointer-events:none;color:#d6ac54;font-size:20px;animation:discovery-glint 3s ease-in-out infinite}.discovery-coin{position:absolute;z-index:90;pointer-events:none;color:#ba872d;font:bold 23px system-ui;text-shadow:0 2px #fff8}@keyframes discovery-glint{50%{opacity:.2;scale:.7}}@media(prefers-reduced-motion:reduce){.discovery-glint{animation:none}}';document.head.appendChild(discoveryStyle);render(gameState);
