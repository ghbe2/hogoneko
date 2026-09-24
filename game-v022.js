'use strict';
// Rubbing is distance driven: waiting or dropping a tool never cleans anything.
TOUCH_TOOLS.splice(TOUCH_TOOLS.findIndex(t=>t.id==='pickup'),1);
if(gameState.ui.touchMode==='pickup')gameState.ui.touchMode='pet';
const rubInventory=renderInventory;
renderInventory=function(state){return rubInventory({...state,ui:{...state.ui,inventoryTab:state.ui.inventoryTab==='touch'?'play':state.ui.inventoryTab}}).replace(/<button[^>]*data-action="inventory-tab"[^>]*data-tab="touch"[^>]*>[\s\S]*?<\/button>/g,'');};
const rubTouchTools=renderTouchTools;
renderTouchTools=state=>rubTouchTools(state).replace('選んだら、右の「さわる」をタップして実行','ネコをこすってお手入れ。動かさず長押しで抱く').replace('タップでなでる','ネコをこすると撫でる');
const rubReducer=reduceGameState;
reduceGameState=function(state,action){
 if(['TAP_CAT','TOUCH_NOW','EXECUTE_CONTACT'].includes(action.type)&&commandDraft&&['clean','food'].includes(commandDraft.command))return state;
 if(action.type==='TOUCH_NOW'&&!action.fromGesture&&!state.ui.holdingCat)return {...state,ui:{...state.ui,touchActive:true,interactionMode:null}};
 if(action.type==='TAP_TROUBLE'&&['hair','vomit','litter','broken'].includes(action.problem))return state;
 if(action.type==='RUB_CLEAN'){
  if(state.campaign.phase!=='room'||state.ui.layoutMode||state.ui.modal||state.ui.careAnimation)return state;
  const tool=getCleaner(action.cleanerId);if(!tool||!state.inventory[tool.id])return state;
  let next=state,worked=false;
  for(const target of action.targets){
   if(target.problem==='hair'){
    const cat=getCat(next);if(!cat.body.hair.some(h=>h.id===target.hairId))continue;
    next={...next,cats:next.cats.map((c,i)=>i?c:{...c,body:{...c.body,hair:c.body.hair.map(h=>h.id===target.hairId?{...h,wipeProgress:(h.wipeProgress||0)+(tool.id==='starter_clean'?.2:1)}:h).filter(h=>(h.wipeProgress||0)<.999)}})};worked=true;
   }else{
    const before=getProblemLevel(getCat(next),target.problem);if(before<=0)continue;
    let trial=rubReducer({...next,inventory:{...next.inventory,[tool.id]:state.inventory[tool.id]}},{type:'START_CARE',operation:'clean',cleanerId:tool.id,problem:target.problem});
    if(!trial.ui.careAnimation)continue;
    trial=rubReducer(trial,{type:'FINISH_CARE',id:trial.ui.careAnimation.id});next=trial;worked=true;
   }
  }
  if(!worked)return state;
  return {...next,inventory:{...next.inventory,[tool.id]:tool.unlimited?1:Math.max(0,state.inventory[tool.id]-1)},ui:{...next.ui,equippedCleaner:tool.id,reaction:state.ui.reaction,catFocus:state.ui.catFocus,purrUntil:state.ui.purrUntil}};
 }
 return rubReducer(state,action);
};
const rubStart=startCommandDrag,rubMove=moveCommandDrag,rubEnd=completeCommandDrag;
startCommandDrag=function(draft,x,y){if(['clean','food'].includes(draft.command)){endCatRub();catStroke=null;}rubStart(draft,x,y);if(draft.command==='clean'){draft.rub={x,y,distance:0,lastAt:0};draft.ghost.classList.add('rub-tool');}};
moveCommandDrag=function(draft,x,y){
 if(draft.command!=='clean')return rubMove(draft,x,y);
 if(!draft.ghost)return;
 draft.ghost.style.left=x+'px';draft.ghost.style.top=y+'px';
 const tool=getCleaner(draft.itemId),r=draft.rub;if(!tool||!r)return;
 const distance=Math.hypot(x-r.x,y-r.y);r.x=x;r.y=y;
 const radius=tool.id==='starter_clean'?2:12+tool.power*12,targets=[];
 const stage=document.querySelector('.stage')?.getBoundingClientRect();
 const inside=stage&&x>=stage.left&&x<=stage.right&&y>=stage.top&&y<=stage.bottom;
 document.querySelectorAll('[data-drop-target="clean"]').forEach(node=>{
  const b=node.getBoundingClientRect(),dx=Math.max(b.left-x,0,x-b.right),dy=Math.max(b.top-y,0,y-b.bottom);
  const hit=inside&&Math.hypot(dx,dy)<=radius;
  node.classList.toggle('drop-hover',hit);
  if(hit&&(node.dataset.problem==='hair'||getProblemLevel(getCat(gameState),node.dataset.problem)>0))targets.push({problem:node.dataset.problem,hairId:node.dataset.hair});
 });
 draft.valid=!!targets.length;draft.ghost.classList.toggle('invalid',!draft.valid);
 draft.ghost.style.setProperty('--scrub-size',(radius*2)+'px');
 if(!draft.valid||distance>80){r.distance=0;return;}
 if(!gameState.inventory[tool.id])return;
 r.distance+=Math.min(distance,24);
 const threshold=tool.id==='starter_clean'?96:48/Math.sqrt(Math.max(.5,tool.power));
 draft.ghost.style.setProperty('--scrub-turn',(r.distance/threshold*25)+'deg');
 if(r.distance>=threshold&&performance.now()-r.lastAt>160){
  r.distance=0;r.lastAt=performance.now();dispatch({type:'RUB_CLEAN',cleanerId:tool.id,targets:tool.id==='starter_clean'?targets.slice(0,1):targets});
  draft.ghost.classList.remove('rub-flash');void draft.ghost.offsetWidth;draft.ghost.classList.add('rub-flash');
 }
};
completeCommandDrag=function(draft,...args){if(draft.command==='clean'){clearCommandDrag(draft,true);document.querySelectorAll('.drop-hover').forEach(n=>n.classList.remove('drop-hover'));return;}return rubEnd(draft,...args);};
// Capture cat gestures before the old tap/drag handlers. Do not capture room panning.
let catRub=null;
function endCatRub(){if(catRub)clearTimeout(catRub.timer);catRub?.node.classList.remove('cat-hold-charge');catRub=null;}
window.addEventListener('pointerdown',event=>{
 const node=event.target.closest('.cat-object,.held-cat');
 if(!node||commandDraft||event.button!==0||gameState.campaign.phase!=='room'||gameState.ui.layoutMode||gameState.ui.modal||gameState.ui.careAnimation)return;
 event.preventDefault();event.stopImmediatePropagation();
 if(gameState.ui.holdingCat){dispatch({type:'RELEASE_CAT'});suppressClickUntil=Date.now()+600;return;}
 const point=getVisibleTouchPoint();catStroke=null;
 catRub={node,id:event.pointerId,x:event.clientX,y:event.clientY,startX:event.clientX,startY:event.clientY,distance:0,moved:false,point};
 node.classList.add('cat-hold-charge');
 // Pickup uses the existing affinity/refusal logic, independent of the selected care tool.
 catRub.timer=setTimeout(()=>{
  if(!catRub||catRub.moved)return;catRub.held=true;node.classList.remove('cat-hold-charge');
  gameState={...gameState,ui:{...gameState.ui,interactionMode:'pickup'}};dispatch({type:'TAP_CAT'});
  gameState={...gameState,ui:{...gameState.ui,interactionMode:null}};
 },650);
},true);
window.addEventListener('pointermove',event=>{
 if(!catRub||catRub.id!==event.pointerId)return;
 event.preventDefault();event.stopImmediatePropagation();
 const r=catRub,dx=event.clientX-r.x,dy=event.clientY-r.y;r.x=event.clientX;r.y=event.clientY;
 if(Math.hypot(event.clientX-r.startX,event.clientY-r.startY)>9){r.moved=true;clearTimeout(r.timer);r.node.classList.remove('cat-hold-charge');}
 if(r.held||!r.moved)return;
 const node=document.querySelector('.cat-object'),b=node?.getBoundingClientRect();
 if(!b||event.clientX<b.left-12||event.clientX>b.right+12||event.clientY<b.top-12||event.clientY>b.bottom+12){r.distance=0;return;}
 r.distance+=Math.min(24,Math.hypot(dx,dy));
 if(r.distance>=45&&!gameState.ui.careAnimation){r.distance=0;dispatch({type:'TOUCH_NOW',fromGesture:true,point:r.point});}
},{capture:true,passive:false});
window.addEventListener('pointerup',event=>{if(catRub?.id===event.pointerId){event.preventDefault();event.stopImmediatePropagation();suppressClickUntil=Date.now()+600;endCatRub();}},true);
window.addEventListener('pointercancel',endCatRub,true);window.addEventListener('blur',endCatRub);
const rubStyle=document.createElement('style');rubStyle.textContent=`
.inventory-menu-sheet .inventory-tabs{grid-template-columns:repeat(3,minmax(0,1fr))}
.rub-tool{overflow:visible;transform:translate(-50%,-50%) rotate(var(--scrub-turn,0deg))}
.rub-tool::before{content:'';position:absolute;width:var(--scrub-size,36px);height:var(--scrub-size,36px);left:50%;top:50%;transform:translate(-50%,-50%);border:1px dashed #fff9e6;border-radius:50%;background:#fff9e622;z-index:-1}
.rub-flash::after{content:'✦';position:absolute;top:-14px;right:-10px;color:#fff6da;animation:scrub-spark .3s both}
@keyframes scrub-spark{to{transform:translateY(-14px);opacity:0}}
.cat-hold-charge{filter:drop-shadow(0 0 1px #e4b9a5);animation:cat-charge .65s linear forwards!important}
.sub-command.touch-ready{box-shadow:0 0 0 2px #c99883!important}
.touch-gesture-guide{position:absolute;bottom:119px;right:16px;max-width:180px;padding:6px 9px;border-radius:12px;background:#fff8eceb;color:#866b58;font-size:10px;pointer-events:none;z-index:24}
@keyframes cat-charge{to{filter:drop-shadow(0 0 9px #e4b9a5)}}
`;document.head.appendChild(rubStyle);
const rubRender=render;
render=function(state){rubRender(state);
 const touch=app.querySelector('[data-action="touch-now"]');
 if(touch){touch.setAttribute('aria-label','さわる。タップで案内、長押しで撫でる・コーム・ウェットを選ぶ');touch.classList.toggle('touch-ready',!!state.ui.touchActive);}
 if(state.ui.touchActive&&!state.ui.modal&&!state.ui.layoutMode)app.querySelector('.stage')?.insertAdjacentHTML('beforeend','<div class="touch-gesture-guide">ネコをこする · 長押しで抱く</div>');
 app.querySelectorAll('[data-drop-target="clean"]').forEach(node=>{
  node.setAttribute('aria-label','掃除道具を持ったまま、ここをこすって掃除');
  if(node.dataset.problem==='hair')return;
  const level=getProblemLevel(getCat(state),node.dataset.problem);
  const mark=node.matches('.mess-object')?node:node.querySelector('.book-litter-mark');
  if(mark&&level>0){mark.style.opacity=String(Math.min(1,.25+level*.25));if(mark.classList.contains('book-litter-mark'))mark.textContent='● '.repeat(Math.ceil(level));}
 });
};render(gameState);
