'use strict';
// Presentation only. Affinity, daily caps, overflow, consumption and save rules stay unchanged.
const heartShow={catId:null,value:0,target:0,last:0,until:0,mergeUntil:0,mergeValue:0,live:false,pending:[]};
const heartLayer=document.createElement('div');heartLayer.className='bond-layer';heartLayer.setAttribute('aria-hidden','true');
const spots=[[.15,.31],[.82,.46],[.23,.69],[.72,.18],[.84,.72],[.13,.53],[.48,.15],[.67,.67],[.33,.28],[.47,.77]];
function beginBond(cat,from,to,live=false){
 const now=performance.now();
 if(heartShow.catId!==cat.id||now>heartShow.until+1000){heartShow.catId=cat.id;heartShow.value=from;heartShow.pending=[];heartLayer.replaceChildren();heartShow.mergeUntil=0;}
 heartShow.target=to;heartShow.live=live;heartShow.until=now+(live?1200:Math.max(3000,Math.abs(to-from)*650+2200));
}
const bondReduce=reduceGameState;
reduceGameState=function(state,action){
 const next=bondReduce(state,action);
 const before=getCat(state),after=getCat(next);
 const eligible=next!==state&&state.campaign.phase==='room'&&next.campaign.phase==='room'&&before.id===after.id&&!state.ui.modal&&!state.ui.layoutMode&&!document.hidden;
 if(eligible){
  const direct=['FINISH_CARE','EXECUTE_CONTACT','TAP_CAT','FINISH_PLAY'].includes(action.type);
  const meal=action.type==='SYNC_REAL_TIME'&&state.realClock&&Date.now()-state.realClock.processedAt<60000&&after.body.foodLevel<before.body.foodLevel;
  if((direct||meal)&&after.heart!==before.heart){
   // Live play already previewed exactly this gain. Never replay it on release.
   if(action.type==='FINISH_PLAY'&&action.live&&heartShow.catId===after.id){heartShow.target=after.heart;heartShow.live=false;heartShow.until=performance.now()+900;}
   else beginBond(after,before.heart,after.heart);
  }
 }
 return next;
};
updateLiveHeartMeter=function(draft){const cat=getCat(gameState);beginBond(cat,cat.heart,Math.round((cat.heart+draft.heartEarned)*10)/10,true);};
// Keep personality cues, but stop legacy heart bursts and fixed meters.
spawnLiveFeedback=function(cat,affinity,big=false,moodOnly=false){if(moodOnly){feelSpawn(cat,affinity,false,true);showFeel(cat,affinity);}};
const bondRender=render;
render=function(state){bondRender(state);app.querySelectorAll('.live-heart-meter,.heart-closeup,.play-heart-burst').forEach(n=>n.remove());};
function bondNode(cls,text){const n=document.createElement('span');n.className=cls;n.textContent=text;return n;}
function floatHeart(index,w,h,birth){
 const el=bondNode('bond-small','♥'),p=spots[index];el.dataset.index=index;el.style.left=p[0]*w+'px';el.style.top=p[1]*h+'px';el.style.setProperty('--phase',`${-index*.37}s`);heartLayer.appendChild(el);
 if(birth)el.animate([{translate:`${birth.x-p[0]*w}px ${birth.y-p[1]*h}px`,scale:1},{translate:'0 0',scale:1}],{duration:750,easing:'ease-out'});
 return el;
}
function bondTick(now){
 const dt=Math.min(100,now-(heartShow.last||now));heartShow.last=now;
 const stage=app.querySelector('.stage'),catNode=stage?.querySelector('.cat-object'),cat=getCat(gameState);
 const allowed=stage&&catNode&&gameState.campaign.phase==='room'&&!gameState.ui.modal&&!gameState.ui.layoutMode&&!document.hidden&&heartShow.catId===cat.id;
 const visible=allowed&&(now<heartShow.until||now<heartShow.mergeUntil);
 if(!visible){heartLayer.remove();requestAnimationFrame(bondTick);return;}
 if(heartLayer.parentElement!==stage)stage.appendChild(heartLayer);
 const s=stage.getBoundingClientRect(),c=catNode.getBoundingClientRect(),w=s.width,h=s.height;
 const birth={x:Math.max(25,Math.min(w-25,c.left-s.left+c.width*.75)),y:Math.max(65,c.top-s.top+c.height*.2)};
 const gaugeX=Math.max(Math.min(w/2,122),Math.min(w-Math.min(w/2,122),c.left-s.left+c.width/2)),gaugeY=Math.max(25,c.top-s.top-24);
 const before=heartShow.value,diff=heartShow.target-before;
 heartShow.value=Math.abs(diff)<.002?heartShow.target:before+Math.sign(diff)*Math.min(Math.abs(diff),dt*(heartShow.live?.004:.0016));
 const value=heartShow.value,whole=Math.floor(value+.00001),oldWhole=Math.floor(before+.00001);
 if(whole>oldWhole&&Math.floor(value/10)>Math.floor(before/10))heartShow.pending.push(whole);
 if(now>=heartShow.mergeUntil&&heartShow.pending.length){
  const threshold=heartShow.pending.shift();heartShow.mergeValue=threshold;heartShow.mergeUntil=now+2600;
  heartLayer.querySelector('.bond-growing')?.remove();
  for(let i=0;i<10;i++)if(!heartLayer.querySelector(`[data-index="${i}"]`))floatHeart(i,w,h,i===9?birth:null);
  heartLayer.querySelectorAll('.bond-small').forEach(n=>{n.animate([{translate:'0 0',opacity:.85},{translate:`${birth.x-parseFloat(n.style.left)}px ${birth.y-parseFloat(n.style.top)}px`,scale:.3,opacity:0}],{duration:450,fill:'forwards'});setTimeout(()=>n.remove(),460);});
  const big=bondNode('bond-big','♥');big.style.left=birth.x+'px';big.style.top=birth.y+'px';heartLayer.appendChild(big);
  big.animate([{scale:.35,opacity:0},{offset:.25,scale:1.5,opacity:1},{offset:.5,scale:1,opacity:1},{translate:`${gaugeX-birth.x}px ${gaugeY-birth.y}px`,scale:.4,opacity:0}],{duration:1400,delay:450,fill:'both'});setTimeout(()=>big.remove(),1900);
  const row=document.createElement('div');row.className='bond-gauge';row.innerHTML=renderHeartVisual({...cat,heart:threshold});row.querySelectorAll('.heart-slot').forEach((n,i)=>n.style.setProperty('--order',i));heartLayer.querySelector('.bond-gauge')?.remove();heartLayer.appendChild(row);
 }
 const row=heartLayer.querySelector('.bond-gauge');if(row){row.style.left=gaugeX+'px';row.style.top=gaugeY+'px';if(now>=heartShow.mergeUntil)row.remove();}
 if(now>=heartShow.mergeUntil){
  const count=((whole%10)+10)%10;
  heartLayer.querySelectorAll('.bond-small').forEach(n=>{if(+n.dataset.index>=count)n.remove();});
  for(let i=0;i<count;i++)if(!heartLayer.querySelector(`[data-index="${i}"]`))floatHeart(i,w,h,whole>oldWhole&&i===count-1?birth:null);
  let growing=heartLayer.querySelector('.bond-growing');const fraction=((value%1)+1)%1;
  if(fraction>.005&&now<heartShow.until){if(!growing){growing=bondNode('bond-growing','♥');heartLayer.appendChild(growing);}growing.style.left=birth.x+'px';growing.style.top=birth.y+'px';growing.style.scale=.18+fraction*.82;growing.style.opacity=.5+fraction*.5;}else growing?.remove();
 }
 requestAnimationFrame(bondTick);
}
const bondStyle=document.createElement('style');bondStyle.textContent=`
.bond-layer{position:absolute;inset:0;z-index:74;pointer-events:none}.bond-small,.bond-growing,.bond-big{position:absolute;color:#d16c86;font-size:27px;line-height:1;text-shadow:0 2px #fff7;transform:translate(-50%,-50%);pointer-events:none}.bond-small{animation:bond-float 3s ease-in-out infinite alternate;animation-delay:var(--phase);opacity:.85}.bond-big{font-size:60px}.bond-gauge{position:absolute;transform:translate(-50%,-100%);width:240px;max-width:100%;pointer-events:none}.bond-gauge .heart-visual{margin:0;padding:0;background:none}.bond-gauge small{display:none}.bond-gauge .heart-row{gap:2px;justify-content:center}.bond-gauge .heart-slot,.bond-gauge .heart-fill{font-size:22px;height:24px}.bond-gauge .heart-slot{animation:bond-pop .3s both;animation-delay:calc(var(--order)*60ms)}
@keyframes bond-float{to{margin-top:-5px;margin-left:3px}}@keyframes bond-pop{from{opacity:0;scale:.3;translate:0 7px}to{opacity:1;scale:1;translate:0 0}}@media(prefers-reduced-motion:reduce){.bond-small,.bond-gauge .heart-slot{animation:none}}
`;document.head.appendChild(bondStyle);requestAnimationFrame(bondTick);
