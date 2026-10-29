'use strict';
// Presentation only: care gain, caps and toy wear keep their existing balance.
const heartShow={catId:null,value:0,target:0,until:0,live:false,lastWhole:0,bank:0,flight:null};
const heartLayer=document.createElement('div');heartLayer.className='bond-layer';heartLayer.setAttribute('aria-hidden','true');
function beginBond(cat,from,to,live=false){
 const now=performance.now();
 if(heartShow.catId!==cat.id||now>heartShow.until+1000){heartShow.catId=cat.id;heartShow.value=from;heartShow.lastWhole=Math.floor(from);heartShow.bank=Math.floor(Math.max(0,from)/10)*10;heartShow.flight=null;heartLayer.replaceChildren();}
 heartShow.target=Math.max(0,Math.min(100,to));heartShow.live=live;heartShow.until=now+(live?1500:2400);
}
const bondReduce=reduceGameState;
reduceGameState=function(state,action){
 const next=bondReduce(state,action),before=getCat(state),after=getCat(next);
 if(action.type==='FINISH_PLAY'&&action.live){heartShow.live=false;heartShow.until=0;heartShow.flight=null;heartLayer.replaceChildren();heartLayer.remove();return next;}
 const eligible=next!==state&&state.campaign.phase==='room'&&next.campaign.phase==='room'&&before.id===after.id&&!state.ui.modal&&!state.ui.layoutMode&&!document.hidden;
 if(eligible){
  const direct=['FINISH_CARE','EXECUTE_CONTACT','TAP_CAT','FINISH_PLAY'].includes(action.type),meal=action.type==='SYNC_REAL_TIME'&&state.realClock&&Date.now()-state.realClock.processedAt<60000&&after.body.foodLevel<before.body.foodLevel;
  if((direct||meal)&&after.heart!==before.heart){
   beginBond(after,before.heart,after.heart);
  }
 }
 return next;
};
updateLiveHeartMeter=function(draft){
 const cat=getCat(gameState);
 // Positive toys keep the saved heart visible even after their daily allowance.
 if(resolveInteraction(cat,'play',getItem(draft.itemId)).baseHeart<=0)return;
 if(heartShow.draft!==draft){heartShow.draft=draft;heartShow.catId=null;}
 const earned=Math.round((cat.heart+draft.heartEarned)*10)/10;
 if(heartShow.target!==earned||!heartShow.live||heartShow.catId!==cat.id)beginBond(cat,cat.heart,earned,true);
 heartShow.until=Infinity;
};
// Affinity is expressed by the cat; progress hearts are owned by bondTick only.
spawnLiveFeedback=function(){};
const bondRender=render;
render=function(state){bondRender(state);app.querySelectorAll('.live-heart-meter,.heart-closeup,.play-heart-burst').forEach(n=>n.remove());};
const BOND_HEART='<svg viewBox="0 0 64 60"><path d="M32 55C24 48 4 33 4 18C4 1 25-3 32 11C39-3 60 1 60 18C60 33 40 48 32 55Z" fill="#d98299"/><path d="M12 17q1-7 8-7" fill="none" stroke="#f9c9d2" stroke-width="4" stroke-linecap="round"/></svg>';
function burstBond(cluster,now,bank){
 heartShow.flight={start:now,bank};heartShow.until=Math.max(heartShow.until,now+1300);
 const heart=cluster.querySelector('.bond-heart');heart.getAnimations().forEach(a=>a.cancel());
 heart.animate([{transform:'scale(1)',opacity:1},{transform:'scale(1.12)',opacity:1,offset:.18},{transform:'scale(.9)',opacity:0,offset:.28},{transform:'scale(.9)',opacity:0}],{duration:850,fill:'forwards'});
 for(let i=0;i<12;i++){
  const particle=document.createElement('span');particle.className='bond-particle';particle.innerHTML=BOND_HEART;cluster.append(particle);
  const angle=-Math.PI+i*Math.PI*2/12,dx=Math.cos(angle)*(i%2?38:26),dy=Math.sin(angle)*(i%2?28:20);
  particle.animate([{transform:'translate(0,0) scale(.3)',opacity:0},{transform:'translate(0,0) scale(.75)',opacity:1,offset:.22},{transform:`translate(${dx}px,${dy}px) scale(1)`,opacity:1,offset:.43},{transform:`translate(${dx*1.3}px,${dy*1.3-6}px) scale(.15)`,opacity:0}],{duration:850,fill:'forwards'});
  setTimeout(()=>particle.remove(),900);
 }
}
function bondTick(now){
 if(heartShow.live&&heartShow.draft!==commandDraft&&heartShow.draft!==playDraft){heartShow.until=0;heartShow.live=false;heartShow.flight=null;heartLayer.replaceChildren();}
 const stage=app.querySelector('.stage'),node=stage?.querySelector('.cat-object'),cat=getCat(gameState);
 if(!stage||!node||gameState.campaign.phase!=='room'||gameState.ui.modal||gameState.ui.layoutMode||document.hidden||heartShow.catId!==cat.id||now>=heartShow.until){heartLayer.remove();requestAnimationFrame(bondTick);return;}
 if(heartLayer.parentElement!==stage)stage.append(heartLayer);
 if(!heartLayer.firstChild)heartLayer.innerHTML='<div class="bond-cluster"><div class="bond-charge"><span class="bond-heart">'+BOND_HEART+'</span></div></div>';
 const s=stage.getBoundingClientRect(),c=node.getBoundingClientRect(),cluster=heartLayer.firstChild;
 cluster.style.left=Math.max(65,Math.min(s.width-65,c.left-s.left+c.width/2))+'px';cluster.style.top=Math.max(70,c.top-s.top+18)+'px';
 const whole=Math.floor(heartShow.target+.00001),bank=Math.floor(whole/10)*10,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,heart=cluster.querySelector('.bond-heart');
 if(heartShow.flight&&(now-heartShow.flight.start>=850||reduced)){
  heartShow.bank=heartShow.flight.bank;heartShow.flight=null;heart.getAnimations().forEach(a=>a.cancel());
 }
 if(bank<heartShow.bank){heartShow.bank=bank;heartShow.flight=null;heart.getAnimations().forEach(a=>a.cancel());}
 if(!heartShow.flight&&bank>heartShow.bank){if(reduced)heartShow.bank=bank;else burstBond(cluster,now,bank);}
 const charge=heartShow.flight?10:heartShow.target%10;
 const draft=heartShow.draft;
 let canEarn=false;
 if(heartShow.live&&draft){
  const result=resolveInteraction(cat,'play',getItem(draft.itemId));
  const used=Number(gameState.ui.usedHandItems['play_'+draft.itemId])||0;
  const limit=result.affinity==='superMatch'&&!gameState.ui.usedHandItems.heart_overflow?CONFIG.week.heartCapMax:cat.heartCap;
  canEarn=Math.min(result.baseHeart-used,limit-cat.heart)-(draft.heartEarned||0)>=.9999;
 }
 cluster.querySelector('.bond-charge').classList.toggle('is-pulsing',canEarn&&!heartShow.flight);
 // The growing heart is the remainder, not the lifetime score. Its box never moves.
 heart.style.scale=String(.65+1.15*charge/10);heart.style.visibility='visible';
 cluster.dataset.charge=String(charge);cluster.dataset.total=String(heartShow.bank);
 heartShow.lastWhole=whole;
 heartShow.value=heartShow.target;requestAnimationFrame(bondTick);
}
const bondStyle=document.createElement('style');bondStyle.textContent=`
.bond-layer{position:absolute;inset:0;z-index:74;pointer-events:none}.bond-cluster{position:absolute;transform:translate(-50%,-100%);width:116px;display:flex;flex-direction:column;align-items:center;gap:8px}.bond-charge{height:40px;width:40px;display:grid;place-items:center}.bond-heart{display:block;width:34px;height:32px;transform-origin:center;transition:scale .18s ease-out;filter:drop-shadow(0 1px 1px #fff8)}.bond-heart svg,.bond-particle svg{width:100%;height:100%;display:block}.bond-particle{position:absolute;left:52px;top:14px;width:12px;height:12px}.bond-layer .bond-particle{pointer-events:none}.bond-charge.is-pulsing{animation:bond-pulse .9s ease-in-out infinite}@keyframes bond-pulse{0%,100%{transform:scale(1)}45%{transform:scale(1.14)}}@media(prefers-reduced-motion:reduce){.bond-heart{transition:none}.bond-charge.is-pulsing{animation:none}}
`;document.head.append(bondStyle);requestAnimationFrame(bondTick);
