'use strict';
// Presentation only: care gain, caps and toy wear keep their existing balance.
const heartShow={catId:null,value:0,target:0,until:0,live:false,lastWhole:0};
const heartLayer=document.createElement('div');heartLayer.className='bond-layer';heartLayer.setAttribute('aria-hidden','true');
function beginBond(cat,from,to,live=false){
 const now=performance.now();
 if(heartShow.catId!==cat.id||now>heartShow.until+1000){heartShow.catId=cat.id;heartShow.value=from;heartShow.lastWhole=Math.floor(from);heartLayer.replaceChildren();}
 heartShow.target=to;heartShow.live=live;heartShow.until=now+(live?1500:2400);
}
const bondReduce=reduceGameState;
reduceGameState=function(state,action){
 const next=bondReduce(state,action),before=getCat(state),after=getCat(next);
 const eligible=next!==state&&state.campaign.phase==='room'&&next.campaign.phase==='room'&&before.id===after.id&&!state.ui.modal&&!state.ui.layoutMode&&!document.hidden;
 if(eligible){
  const direct=['FINISH_CARE','EXECUTE_CONTACT','TAP_CAT','FINISH_PLAY'].includes(action.type),meal=action.type==='SYNC_REAL_TIME'&&state.realClock&&Date.now()-state.realClock.processedAt<60000&&after.body.foodLevel<before.body.foodLevel;
  if((direct||meal)&&after.heart!==before.heart){
   if(action.type==='FINISH_PLAY'&&action.live&&heartShow.catId===after.id){heartShow.target=after.heart;heartShow.live=false;heartShow.until=performance.now()+1800;}
   else beginBond(after,before.heart,after.heart);
  }
 }
 return next;
};
updateLiveHeartMeter=function(draft){const cat=getCat(gameState);beginBond(cat,cat.heart,Math.round((cat.heart+draft.heartEarned)*10)/10,true);};
spawnLiveFeedback=function(cat,affinity,big=false,moodOnly=false){if(moodOnly){showFeel(cat,affinity);if(['superMatch','match','superDislike'].includes(affinity)){feelSpawn(cat,affinity,false,true);const cue=cat.closest('.stage')?.querySelector('.live-heart:last-child');if(cue)cue.textContent=affinity==='superDislike'?'💢':'♡';}}};
const bondRender=render;
render=function(state){bondRender(state);app.querySelectorAll('.live-heart-meter,.heart-closeup,.play-heart-burst').forEach(n=>n.remove());};
function bondTick(now){
 const stage=app.querySelector('.stage'),node=stage?.querySelector('.cat-object'),cat=getCat(gameState);
 if(!stage||!node||gameState.campaign.phase!=='room'||gameState.ui.modal||gameState.ui.layoutMode||document.hidden||heartShow.catId!==cat.id||now>=heartShow.until){heartLayer.remove();requestAnimationFrame(bondTick);return;}
 if(heartLayer.parentElement!==stage)stage.append(heartLayer);
 if(!heartLayer.firstChild)heartLayer.innerHTML='<div class="bond-cluster"><svg class="bond-heart" viewBox="0 0 64 60"><path d="M32 55C24 48 4 33 4 18C4 1 25-3 32 11C39-3 60 1 60 18C60 33 40 48 32 55Z" fill="#d98299"/><path d="M12 17q1-7 8-7" fill="none" stroke="#f9c9d2" stroke-width="4" stroke-linecap="round"/></svg><div class="bond-beads">'+Array.from({length:10},()=>'<i></i>').join('')+'</div></div>';
 const s=stage.getBoundingClientRect(),c=node.getBoundingClientRect(),cluster=heartLayer.firstChild;
 cluster.style.left=Math.max(65,Math.min(s.width-65,c.left-s.left+c.width/2))+'px';cluster.style.top=Math.max(100,c.top-s.top-12)+'px';
 const whole=Math.floor(heartShow.target+.00001),previous=heartShow.lastWhole;
 const count=whole%10;cluster.querySelectorAll('.bond-beads i').forEach((n,i)=>n.classList.toggle('filled',i<count));
 if(whole!==previous){
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,burst=whole>previous&&Math.floor(whole/10)>Math.floor(previous/10);
  cluster.querySelector('.bond-heart').style.scale=String(.75+Math.min(100,whole)/400);
  if(!reduced){cluster.querySelector('.bond-heart').animate([{transform:'scale(1)'},{transform:`scale(${burst?1.45:1.12})`},{transform:'scale(1)'}],{duration:burst?700:280});
   if(burst)for(let i=0;i<10;i++){const spark=document.createElement('i');spark.className='bond-spark';cluster.append(spark);const a=i*Math.PI/5;spark.animate([{translate:'0 0',opacity:1},{translate:`${Math.cos(a)*55}px ${Math.sin(a)*45}px`,opacity:0}],{duration:650,fill:'forwards'});setTimeout(()=>spark.remove(),700);}
  }
  heartShow.lastWhole=whole;
 }
 heartShow.value=heartShow.target;requestAnimationFrame(bondTick);
}
const bondStyle=document.createElement('style');bondStyle.textContent=`
.bond-layer{position:absolute;inset:0;z-index:74;pointer-events:none}.bond-cluster{position:absolute;transform:translate(-50%,-100%);width:116px;display:flex;flex-direction:column;align-items:center;gap:4px}.bond-heart{width:44px;height:42px;filter:drop-shadow(0 1px 1px #fff8);transform-origin:center}.bond-beads{display:flex;gap:3px;padding:5px;background:#fff8e9e8;border-radius:12px}.bond-beads i{width:7px;height:7px;border-radius:50%;background:#e1d8cc}.bond-beads i.filled{background:#d98299}.bond-spark{position:absolute;left:54px;top:20px;width:7px;height:7px;border-radius:50%;background:#e0a0af}
`;document.head.append(bondStyle);requestAnimationFrame(bondTick);
