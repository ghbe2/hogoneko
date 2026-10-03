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
