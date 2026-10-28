'use strict';
// Interactions belong to a room object, never to an unrelated idle animation.
const FURNITURE_REACTIONS={blanket:'knead',sunmat:'knead',senior_mat:'knead',scratch:'scratch',box:'sit',tower:'sit',shelf:'sit',hammock:'sleep',tunnel:'stalk',doll:'punch'};
function roomObjectCuePoint(state,id,pose){
 const world=app.querySelector('[data-room-world]'),node=app.querySelector('.placed-item.item-'+id);
 const entry=getPlaced(getRoom(state)).find(p=>p.itemId===id);if(!world||!node||!entry)return null;
 const r=world.getBoundingClientRect(),b=node.getBoundingClientRect(),scale=.65;
 const feeding=pose==='eat';
 const footHeight=pose==='sit'?67:35;
 return {x:(b.left-r.left+b.width/2+(feeding?25:0))/r.width*100,y:(b.top-r.top+(feeding?-18:8-footHeight*scale))/r.height*100,scale,distance:'near',surface:id};
}
function queueObjectReaction(state,id,pose){
 const point=roomObjectCuePoint(state,id,pose);if(!point)return;
 const now=Date.now(),cue={catId:getCat(state).id,pose,point,itemId:id,started:now+800,reveal:now+800,until:now+5000,previous:1};
 catLifeCues=[cue];scheduleLifeCueRefresh(cue);
}
function freeMessPoint(preferred){
 const world=app.querySelector('[data-room-world]');if(!world)return preferred;
 const r=world.getBoundingClientRect(),bounds=roomPlacementBounds(r.height),obstacles=[...world.querySelectorAll('.placed-item')].map(n=>n.getBoundingClientRect());
 const mess=app.querySelector('.mess-object'),mw=mess?.offsetWidth||67,mh=mess?.offsetHeight||36;
 const clear=(x,y)=>x>=4&&x+mw<=r.width-4&&y>=bounds.floorTop&&y+mh<=bounds.floorBottom&&!obstacles.some(b=>x+mw+4>b.left-r.left&&x-4<b.right-r.left&&y+mh+4>b.top-r.top&&y-4<b.bottom-r.top);
 const px=preferred.x*r.width/100,py=preferred.y*r.height/100;
 if(clear(px,py))return preferred;
 const candidates=[];for(let y=bounds.floorTop;y<=bounds.floorBottom-mh;y+=8)for(let x=4;x<=r.width-mw-4;x+=8)if(clear(x,y))candidates.push({x,y,d:Math.hypot(x-px,y-py)});
 candidates.sort((a,b)=>a.d-b.d);const best=candidates[0];return best?{x:best.x/r.width*100,y:best.y/r.height*100}:null;
}
const objectReactionReduce=reduceGameState;
reduceGameState=function(state,action){
 if(action.type==='LIFE_MESS_POSITION')action={...action,point:freeMessPoint(action.point)};
 const next=objectReactionReduce(state,action);
 if(next.campaign.phase!=='room'||document.hidden||next.ui.modal||next.ui.layoutMode||getCat(next).status!=='raising')return next;
 const before=getCat(state),after=getCat(next),care=state.ui.careAnimation;
 if(after.body.foodLevel<before.body.foodLevel){const cue=catLifeCues.find(c=>c.pose==='eat'&&c.catId===after.id),point=roomObjectCuePoint(next,'bowl','eat');if(cue&&point)cue.point=point;}
 if(after.body.waterLevel<before.body.waterLevel&&!currentLifeCue())queueObjectReaction(next,'water','eat');
 if(action.type==='FINISH_CARE'&&care&&!next.ui.careAnimation){
  if(care.operation==='food'&&before.body.foodLevel<=50&&after.body.foodLevel>before.body.foodLevel)queueObjectReaction(next,'bowl','eat');
  if(care.operation==='water'&&before.body.waterLevel<=50&&after.body.waterLevel>before.body.waterLevel)queueObjectReaction(next,'water','eat');
 }else if((action.type==='ROAM_CAT'||state.ui.layoutMode&&!next.ui.layoutMode)&&!currentLifeCue()&&!commandDraft&&!discoveryScene(next)){
  const entries=getPlaced(getRoom(next)).filter(p=>FURNITURE_REACTIONS[p.itemId]&&getDurability(next,p.itemId)>0);
  if(entries.length){const entry=(state.ui.layoutMode?entries.find(p=>p.itemId===state.ui.lastLayoutItem):null)||entries[Math.floor(gameNow()/6000)%entries.length];queueObjectReaction(next,entry.itemId,FURNITURE_REACTIONS[entry.itemId]);}
 }
 return next;
};
function cancelRoomTools(){
 if(commandDraft){clearCommandDrag(commandDraft,true);commandDraft=null;}
 playDraft=null;document.querySelectorAll('.command-ghost,.drop-ready,.drop-hover').forEach(n=>n.matches('.command-ghost')?n.remove():n.classList.remove('drop-ready','drop-hover'));
}
// A cleaning redraw can detach the captured source. Finish on window release too.
window.addEventListener('pointerup',event=>{if(commandDraft){const d=commandDraft;commandDraft=null;if(d.moved)completeCommandDrag(d,event.clientX,event.clientY);else clearCommandDrag(d,true);}});
window.addEventListener('pointercancel',cancelRoomTools);window.addEventListener('blur',cancelRoomTools);
document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelRoomTools();});
const objectReactionRender=render;
function visibleRoomCatPoint(node){
 if(!node)return null;const r=node.parentElement.getBoundingClientRect(),css=getComputedStyle(node),m=new DOMMatrixReadOnly(css.transform==='none'?undefined:css.transform);
 return {x:parseFloat(css.left)/r.width*100,y:parseFloat(css.top)/r.height*100,scale:Math.hypot(m.a,m.b),surface:node.dataset.travelSurface||'floor'};
}
const continuousRoomTravel=animateFelineTravel;
animateFelineTravel=function(node,from,to,...rest){
 const key=JSON.stringify([to.x,to.y,to.scale]);
 if(node._travelAnimation?.playState==='running'&&node.dataset.travelTarget===key)return node._travelAnimation;
 if(node._travelAnimation?.playState==='running')from=visibleRoomCatPoint(node);
 node.dataset.travelTarget=key;node.dataset.travelSurface=to.surface||'floor';
 const animation=continuousRoomTravel(node,from,to,...rest),cue=currentLifeCue();
 if(animation&&cue){const arrival=Date.now()+animation.effect.getComputedTiming().duration;if(arrival>cue.started){const delay=arrival-cue.started;cue.started+=delay;cue.reveal+=delay;cue.until+=delay;scheduleLifeCueRefresh(cue);}}
 return animation;
};
render=function(state){
 const old=app.querySelector('.cat-object'),from=visibleRoomCatPoint(old),oldId=old?.querySelector('svg')?.dataset.catId,travelTarget=old?.dataset.travelTarget,travelSurface=old?.dataset.travelSurface;
 if(state.campaign.phase!=='room')cancelRoomTools();
 objectReactionRender(state);
 if(state.campaign.phase!=='room')return;
 const cue=currentLifeCue();
 const cat=app.querySelector('.cat-object');
 if(cat&&travelTarget){cat.dataset.travelTarget=travelTarget;cat.dataset.travelSurface=travelSurface||'floor';}
 if(cue?.itemId){const point=roomObjectCuePoint(state,cue.itemId,cue.pose);if(point&&cat){cue.point=point;cat.style.left=point.x+'%';cat.style.top=point.y+'%';}}
 if(cat&&from&&oldId===cat.querySelector('svg')?.dataset.catId&&!state.ui.layoutMode&&!state.ui.holdingCat){
  const to=getCatPoint(state),r=cat.parentElement.getBoundingClientRect();
  if(Math.hypot((to.x-from.x)*r.width/100,(to.y-from.y)*r.height/100)>2||Math.abs(to.scale-from.scale)>.02)animateFelineTravel(cat,from,to);
 }
 const mess=app.querySelector('.mess-object');if(!mess)return;
 const preferred=getCat(state).body.vomitPoint||{x:parseFloat(mess.style.left)||50,y:parseFloat(mess.style.top)||75},point=freeMessPoint(preferred);
 if(!point){mess.style.visibility='hidden';return;}
 mess.style.left=point.x+'%';mess.style.top=point.y+'%';
};
