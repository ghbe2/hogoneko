'use strict';
// Room pickup owns only this gesture and its cat rig. Artwork is shared with the review.
window.CatRoomHold=(()=>{
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),smooth=v=>{v=clamp(v,0,1);return v*v*(3-2*v)};
 let pending=null,active=null,last=0,consumedId=null;
 const eligible=s=>s.campaign.phase==='room'&&getCat(s).status==='raising'&&!titleScreenOpen&&!s.ui.modal&&!s.ui.layoutMode&&!s.ui.careAnimation&&!s.ui.playMode&&!s.onboarding?.guide&&!['open','profile','vitals','calendar','pay','play','clean','food','items'].includes(s.onboarding?.homeTour)&&!commandDraft&&!playDraft&&!discoveryScene(s)&&!['eat','poop','vomit'].includes(currentLifeCue()?.pose);
 function captureOff(){const p=pending;pending=null;if(p&&app.hasPointerCapture?.(p.id))app.releasePointerCapture(p.id);}
 function stopEvent(e){e.preventDefault();e.stopImmediatePropagation();}
 function edge(a){const w=a.world.getBoundingClientRect().width;return Math.min(35,Math.max(18,(a.node.offsetWidth*a.point.scale*.65+28)/w*100));}
 function floorPoint(a,x,y){const r=a.world.getBoundingClientRect(),bounds=roomPlacementBounds(r.height),half=a.node.offsetHeight*a.point.scale/2;return {...a.point,x:clamp(x,edge(a),100-edge(a)),y:clamp(y,(bounds.floorTop-half*.15)/r.height*100,(bounds.floorBottom-half*.75)/r.height*100),surface:'floor',catId:a.catId};}
 function persist(a,point){gameState={...gameState,ui:{...gameState.ui,catFocus:null,playRestPoint:{...point,catId:a.catId},holdingCat:false}};}
 function finish(immediate=false){const a=active;if(!a)return;captureOff();const point=a.phase==='reject'?a.point:a.phase==='land'&&a.destination?.surface!=='floor'?a.destination:floorPoint(a,a.x,a.groundY);persist(a,point);a.entry.roomHold=false;a.entry.rig.depthManual=false;a.entry.previous=null;a.entry.since=performance.now();a.node.style.zIndex=a.zIndex;a.node.classList.remove('room-cat-held');delete a.node.dataset.holdPhase;active=null;saveGameState(gameState);if(!immediate)render(gameState);}
 function land(){const a=active;if(!a||!['lift','hold'].includes(a.phase))return;captureOff();a.phase='land';a.time=0;a.fromY=a.y;a.fromBlend=a.blend;a.destination=a.perch||floorPoint(a,a.x,a.groundY);a.fromX=a.x;}
 function cancel(){consumedId=null;captureOff();if(active){active.groundY=active.point.y;finish();}}
 function begin(p){consumedId=p.id;const svg=p.node.querySelector('.game-cat-svg'),entry=svgRigs.get(svg);if(!entry)return false;const point=visibleRoomCatPoint(p.node)||getCatPoint(gameState),cat=getCat(gameState),reaction=CatHoldMotion.reaction(getAffinity(cat,'touch').score,cat.heart);
  catLifeCues=[];
  p.node._travelAnimation?.cancel();p.node.getAnimations().forEach(a=>a.cancel());p.node.classList.remove('walking','jumping','answering','fleeing');
  active={node:p.node,svg,entry,world:p.node.parentElement,point:{...point},x:point.x,y:point.y,tx:point.x,ty:point.y,groundY:point.y,catId:cat.id,reaction,phase:reaction.a===4?'reject':'lift',time:0,clock:0,blend:0,zIndex:p.node.style.zIndex};entry.roomHold=true;entry.rig.depthManual=true;p.node.classList.add('room-cat-held');p.node.style.zIndex='78';
  gameState={...gameState,ui:{...gameState.ui,catFocus:null,playRestPoint:{...point,catId:cat.id}}};if(reaction.a===4)captureOff();return true;
 }
 window.addEventListener('pointerdown',e=>{
  if(!(e.target instanceof Element)||!e.target.closest('.cat-object'))return;
  if(e.isPrimary===false)return;
  if(active){stopEvent(e);return;}
  if(e.button===0&&discoveryScene(gameState)&&app.querySelector('.discovery-pickup')){
   // Treat the cat and the little coin between its paws as one tap target.
   const node=e.target.closest('.cat-object');
   const startX=e.clientX,startY=e.clientY,id=e.pointerId;
   function clear(event){if(event?.pointerId!=null&&event.pointerId!==id)return;window.removeEventListener('pointerup',collect,true);window.removeEventListener('pointercancel',clear,true);window.removeEventListener('blur',clear);}
   function collect(up){if(up.pointerId!==id)return;clear();stopEvent(up);suppressClickUntil=Date.now()+450;
    if(Math.hypot(up.clientX-startX,up.clientY-startY)<12&&discoveryScene(gameState))dispatch({type:'PICK_DISCOVERY_COIN'});
   }
   stopEvent(e);node.setPointerCapture(id);window.addEventListener('pointerup',collect,true);window.addEventListener('pointercancel',clear,true);window.addEventListener('blur',clear);return;
  }
  if(e.button!==0||!eligible(gameState))return;
  stopEvent(e);endCatRub();catStroke=null;suppressClickUntil=0;
  pending={id:e.pointerId,node:e.target.closest('.cat-object'),x:e.clientX,y:e.clientY,point:getVisibleTouchPoint()};app.setPointerCapture(e.pointerId);
 },true);
 window.addEventListener('pointermove',e=>{if(!pending||pending.id!==e.pointerId)return;stopEvent(e);const p=pending,dx=e.clientX-p.x,dy=e.clientY-p.y;if(!active&&Math.hypot(dx,dy)>10)begin(p);if(!active||!pending)return;const a=active,r=a.world.getBoundingClientRect();a.perch=perchNearPointer(e.clientX,e.clientY);a.tx=clamp(a.point.x+dx/r.width*100,edge(a),100-edge(a));a.groundY=floorPoint(a,a.tx,a.point.y+dy/r.height*100).y;a.ty=clamp(a.point.y+dy/r.height*100-9,24,76);},{capture:true,passive:false});
 window.addEventListener('pointerup',e=>{if(consumedId===e.pointerId){consumedId=null;stopEvent(e);captureOff();suppressClickUntil=Date.now()+450;if(active)land();return;}if(!pending||pending.id!==e.pointerId)return;stopEvent(e);const p=pending;captureOff();suppressClickUntil=Date.now()+450;if(active)land();else dispatch({type:'TOUCH_NOW',fromGesture:true,point:p.point});},true);
 window.addEventListener('click',e=>{if(active&&e.target instanceof Element&&e.target.closest('.cat-object'))stopEvent(e);},true);
 window.addEventListener('pointercancel',e=>{if(e.isPrimary!==false)cancel();},true);window.addEventListener('blur',cancel);document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel()});
 window.addEventListener('resize',cancel);app.addEventListener('lostpointercapture',e=>{if(e.target===app&&pending?.id===e.pointerId)cancel()});
 const reduce=reduceGameState;reduceGameState=function(s,a){if((active||pending)&&['ROAM_CAT','TAP_CAT','TOUCH_NOW','EXECUTE_CONTACT','START_PLAY','FINISH_PLAY'].includes(a.type))return s;return reduce(s,a)};
 const basePoint=getCatPoint;getCatPoint=function(s){return active&&s.campaign.phase==='room'&&getCat(s).id===active.catId?{...active.point}:basePoint(s)};
 const baseRender=render;render=function(s){
  const a=active;if(a&&(s.campaign.phase!=='room'||s.ui.modal||s.ui.layoutMode||getCat(s).id!==a.catId)){finish(true);s=gameState;}
  baseRender(s);
  if(pending&&!active){const cat=app.querySelector('.cat-object');if(cat)pending.node=cat;else captureOff();}
  if(active){const fresh=app.querySelector('.cat-object');if(!fresh){finish(true);return;}fresh._travelAnimation?.cancel();if(!active.node.contains(active.svg))active.node.append(active.svg);fresh.replaceWith(active.node);active.world=active.node.parentElement;svgRigs.set(active.svg,active.entry);}
 };
 // Old long-press saves must never reopen with a detached floating cat.
 gameState.ui.holdingCat=false;
 function frame(now){const dt=Math.min(.08,(now-last)/1000||0);last=now;const a=active;if(a){a.time+=dt;a.clock+=dt;
  if(['lift','hold'].includes(a.phase)){a.blend=clamp(a.blend+dt/.22,0,1);a.x+=(a.tx-a.x)*(1-Math.exp(-dt*16));a.y+=(a.ty-a.y)*(1-Math.exp(-dt*16));if(a.phase==='lift'&&a.time>=.22){a.phase='hold';a.time=0;if(a.reaction.a===3)land();}}
  if(a.phase==='reject'&&a.time>.25){a.phase='escape';a.time=0;a.escapeX=a.x>50?edge(a):100-edge(a);a.fromX=a.x;a.leap=true;a.escapeY=a.y;}
  if(a.phase==='land'){const u=smooth(a.time/.4);a.x=a.fromX+(a.destination.x-a.fromX)*u;a.y=a.fromY+(a.destination.y-a.fromY)*u;a.blend=a.fromBlend*(1-u);if(u===1){if(a.reaction.away){a.phase='escape';a.time=0;a.fromX=a.x;a.escapeX=clamp(a.x+(a.x>50?-17:17),edge(a),100-edge(a));}else{finish();requestAnimationFrame(frame);return;}}}
  if(a.phase==='escape'){const u=clamp(a.time/.7,0,1);a.x=a.fromX+(a.escapeX-a.fromX)*smooth(u);if(a.leap)a.y=a.escapeY-10*Math.sin(Math.PI*u);if(a.time>=.7){a.groundY=a.y;finish();requestAnimationFrame(frame);return;}}
  let pose=a.phase==='escape'?(a.leap?'jump':'walk'):a.phase==='reject'?'cower':'sit',m=CatLifeMotion.model(pose,a.clock);if(a.blend)m=CatSVG.mixModel(m,CatHoldMotion.model(a.clock,a.reaction,a.time,a.phase),smooth(a.blend));const rig=a.entry.rig;rig.d.mood=a.reaction.tense?'wary':'happy';a.node.style.setProperty('--cat-facing',a.phase==='escape'&&a.escapeX>a.fromX?'-1':'1');CatSVG.applyPose(rig,m,a.clock,pose);CatHoldMotion.decorate(rig,a.reaction,a.blend,a.clock,a.time,a.phase);a.node.style.left=a.x+'%';a.node.style.top=a.y+'%';a.node.style.transform=`translate(-50%,-50%) scale(${a.point.scale})`;a.node.dataset.holdPhase=a.phase;
 }requestAnimationFrame(frame)}requestAnimationFrame(frame);
 const style=document.createElement('style');style.textContent='.cat-object{touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}.cat-object.room-cat-held{animation:none!important;transition:none!important;cursor:grabbing}';document.head.append(style);
 return {get active(){return active},cancel};
})();
