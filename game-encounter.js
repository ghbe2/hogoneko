'use strict';
// Bounds describe the cage centre and are shared by preview, guide and drop validation.
function encounterPlacementBounds(scene){
 const r=scene.getBoundingClientRect(),bottom=r.bottom-34;
 return {left:r.left+55,right:r.right-55,top:Math.min(r.top+r.height/3+32,bottom-32),bottom};
}
function moveEncounterDrag(draft,event){
 const b=draft.bounds;
 draft.position={x:Math.max(b.left,Math.min(b.right,event.clientX)),y:Math.max(b.top,Math.min(b.bottom,event.clientY))};
 draft.ghost.style.left=draft.position.x+'px';draft.ghost.style.top=draft.position.y+'px';
}
function beginEncounterDrag(draft,event){
 draft.start={x:event.clientX,y:event.clientY};
 draft.ghost.innerHTML=encounterTrapArt();draft.ghost.style.width='110px';draft.ghost.style.height='63px';
 draft.bounds=encounterPlacementBounds(draft.dropTarget);draft.source.classList.add('encounter-drag-source');
 draft.dropTarget.classList.remove('drop-ready');
 moveEncounterDrag(draft,event);
}
// Probability is internal tuning only. No rates are rendered into player UI.
const BAIT_GRADES={food_dry:1,food_wet:2,food_chicken:2,food_fish:3,food_soup:3};
const ENCOUNTER_TUNING={baseRare:.03,boost:[0,.0025,.006,.01],waitMs:4200};
const encounterFoods=(state=gameState)=>CONFIG.stage1.foods.filter(f=>!f.water&&(state.inventory[f.id]>=1||(f.id==='food_dry'&&state.onboarding?.status==='active'&&state.onboarding?.flowVersion===1)));
function encounterFood(state){return encounterFoods(state).find(f=>f.id===state.campaign.fieldFood)||encounterFoods(state)[0]||getFood(state.campaign.fieldFood)||getFood('food_dry');}
function encounterPools(area){const all=stageCoats(area),special=all.filter(id=>CatSVG.coats[id].rare);const rare=special.length?special:all.slice(-1);return {rare,common:all.filter(id=>!rare.includes(id))};}
function rollEncounter(state,foodId,random=Math.random){
 const area=state.campaign.area||'a1',pools=encounterPools(area),rare=random()<ENCOUNTER_TUNING.baseRare+ENCOUNTER_TUNING.boost[BAIT_GRADES[foodId]||0];
 const base=getCat(state),seed=crypto.getRandomValues(new Uint32Array(1))[0],dna=CatSVG.sampleDNA(seed);
 const cat=stageCat({...base,status:'captured',sex:random()<.5?'female':'male',phenotype:{...dna,earCut:'none'},types:drawShuffledTypes({...base,types:[]})},area,random,rare?pools.rare:pools.common);
 return {version:1,foodId,area,rare,cat,scene:rare?(random()<.5?'rainbow':'moon'):(random()<.22?'breeze':'quiet'),startedAt:gameNow(),readyAt:gameNow()+ENCOUNTER_TUNING.waitMs};
}
const encounterReducer=reduceGameState;
reduceGameState=function(state,action){
 const c=state.campaign;
 if(['FIELD_TOGGLE_FOOD','FIELD_ADD_BAIT','REMOVE_FIELD_BAIT','SELECT_FIELD_FOOD'].includes(action.type))return state;
 if(action.type==='FIELD_PLACE_TRAP'){
  if(c.phase!=='field'||c.trapPlaced||c.trapWaiting||!canStartStage(state,c.area||'a1'))return state;
  const food=getFood(action.foodId||encounterFood(state).id);
  if(!food||food.water||!(state.inventory[food.id]>=1))return state;
  let next=encounterReducer({...state,campaign:{...c,fieldFood:food.id,bait:[food.id]}},action);
  if(!next.campaign.trapPlaced)return state;
  next=encounterReducer(next,{type:'FINISH_FIELD_PREP'});
  if(!next.campaign.trapWaiting)return state;
  return {...next,campaign:{...next.campaign,encounter:rollEncounter(state,food.id)}};
 }
 if(action.type==='TRAP_READY'&&c.encounter&&gameNow()<c.encounter.readyAt)return state;
 if(action.type==='OPEN_TRAP'&&c.encounter&&gameNow()<c.encounter.readyAt)return state;
 if(['GO_RESCUE','ENTER_STAGE','ENTER_PARK','NEXT_RESCUE'].includes(action.type)){
  const next=encounterReducer(state,action);return next.campaign.phase==='field'&&!next.campaign.trapPlaced||action.type==='NEXT_RESCUE'&&next!==state?{...next,campaign:{...next.campaign,encounter:null,fieldFood:'food_dry'}}:next;
 }
 return encounterReducer(state,action);
};
// Old waiting saves get one pinned result, persisted before any presentation.
if(gameState.campaign.phase==='field'&&gameState.campaign.trapWaiting&&!gameState.campaign.encounter){gameState={...gameState,campaign:{...gameState.campaign,encounter:rollEncounter(gameState,gameState.campaign.bait[0]||'food_dry')}};saveGameState(gameState);}
const chevrons=grade=>`<span class="bait-luck" aria-label="香りのランク${['なし','控えめ','豊か','特別'][grade]}">${Array.from({length:grade},()=>'<i></i>').join('')}</span>`;
function encounterTrapArt(){return `<svg viewBox="0 0 220 125" aria-hidden="true"><ellipse cx="112" cy="111" rx="92" ry="9" fill="#574a3820"/><path d="M30 35L65 15H193V88L163 110H30Z" fill="#e7ddc3" stroke="#746e5b" stroke-width="3"/><path d="M30 35H163L193 15M163 35V110M163 110L193 88" fill="none" stroke="#746e5b" stroke-width="3"/><path d="M45 38V105M64 38V105M84 38V105M104 38V105M124 38V105M144 38V105M174 32V98M185 25V91M34 58H160M34 82H160" fill="none" stroke="#8b8771" stroke-width="3"/><path d="M91 16V8Q91 3 98 3H123Q130 3 130 8V16" fill="none" stroke="#746e5b" stroke-width="4"/><ellipse cx="100" cy="98" rx="23" ry="5" fill="#b68b59"/></svg>`;}
const fieldArtCache=new Map();
function fieldBackdrop(state){
 const area=state.campaign.area||'a1',viewHeight=Math.max(400,(app.clientHeight-52)*450/Math.max(1,app.clientWidth)),key=area+state.season+':'+viewHeight;if(fieldArtCache.has(key))return fieldArtCache.get(key);
 const source=bookScene({a1:'field',a2:'park',a3:'alley',a4:'mountain'}[area],state),doc=new DOMParser().parseFromString(source,'image/svg+xml'),svg=doc.documentElement;
 svg.setAttribute('preserveAspectRatio','xMidYMin slice');svg.setAttribute('class','encounter-landscape');svg.setAttribute('aria-hidden','true');svg.removeAttribute('role');
 if(area==='a1'){
  // Preserve illustration proportions. Move the horizon, and extend the ground instead of stretching it.
  svg.setAttribute('viewBox',`0 ${500-viewHeight/3} 450 ${viewHeight}`);
  svg.querySelectorAll('path').forEach(n=>{const d=n.getAttribute('d')||'';if(d.startsWith('M0 506Q170 481 450 500'))n.setAttribute('d',d.replace('V760','V2200'));});
 }
 // Close the gap below the apartment: its walls now reach behind the boundary wall.
 if(area==='a1')svg.querySelectorAll('rect[x="183"][y="143"]').forEach(n=>n.setAttribute('height','295'));
 for(const node of [...svg.children])if(node.tagName==='path'&&/^(M-20 511|M334 504)/.test(node.getAttribute('d')||'')){
  const group=doc.createElementNS('http://www.w3.org/2000/svg','g');group.setAttribute('class','encounter-plant');node.before(group);const detail=node.nextElementSibling;group.append(node);if(detail?.hasAttribute('data-plant-material'))group.append(detail);
 }
 svg.querySelectorAll('.season-details>g').forEach(node=>{const group=doc.createElementNS('http://www.w3.org/2000/svg','g');group.setAttribute('class','encounter-plant flower');while(node.firstChild)group.append(node.firstChild);node.append(group);});
 const result=new XMLSerializer().serializeToString(svg);fieldArtCache.set(key,result);return result;
}
const encounterBackground=bookBackground;
bookBackground=function(node,svg){if(node?.matches('.field-scene'))return;return encounterBackground(node,svg);};
renderField=function(state){
 const c=state.campaign,food=encounterFood(state),trap=FIELD_TRAPS.find(t=>t.id===c.fieldTrap)||FIELD_TRAPS[0],grade=BAIT_GRADES[food.id]||0,waiting=c.trapWaiting;
 const scene=c.encounter?.scene||'quiet';
 const effect=scene==='rainbow'?'<div class="encounter-rainbow" aria-hidden="true"></div>':scene==='moon'?'<div class="encounter-night" aria-hidden="true"></div><div class="encounter-moon" aria-hidden="true"></div>':'';
 const cage=waiting?`<button class="trap illustrated-trap ${c.trapReady?'ready':''}" style="left:${c.trapPosition?.x??50}%;top:${c.trapPosition?.y??68}%;bottom:auto" ${c.trapReady?'data-action="open-trap" aria-label="保護器を開ける"':'disabled'}>${encounterTrapArt()}</button>`:'';
 const chooser=waiting?'':`<section class="encounter-picker" aria-label="餌を中央に合わせて保護器を設置"><div class="encounter-cage-row"><button class="encounter-trap" data-field-drag="trap" data-trap="${trap.id}" aria-label="保護器を草地へ運ぶ" ${!(state.inventory[food.id]>=1)?'disabled':''}>${encounterTrapArt()}</button></div><div class="bait-carousel" tabindex="0" role="listbox" aria-label="横に送って餌を選ぶ" aria-activedescendant="bait-${food.id}">${encounterFoods(state).map(f=>`<div class="bait-option ${f.id===food.id?'chosen':''}" id="bait-${f.id}" role="option" aria-selected="${f.id===food.id}" data-food-id="${f.id}"><span class="bait-picture">${f.emoji}</span>${chevrons(BAIT_GRADES[f.id]||0)}</div>`).join('')}</div><p class="bait-detail"><strong>${food.label}</strong><span>${food.unlimited&&state.inventory[food.id]>=1?'∞':'×'+(state.inventory[food.id]||0)}</span></p></section>`;
 return renderCampaignShell(state,stageName(c.area||'a1'),`<div class="field-scene encounter-scene ${scene}" data-field-drop="scene">${fieldBackdrop(state)}${effect}${cage}</div>${chooser}`).replace('class="campaign-frame"','class="campaign-frame field-fullscreen encounter-screen"')+(state.ui.modal==='fieldTraps'?renderFieldChoice(state):'');
};
let encounterTimer=null,encounterTimerKey=null,gustTimer=null,gustStopTimer=null,gustKey=null;
function installCarousel(){
 const rail=app.querySelector('.bait-carousel');if(!rail||rail.dataset.bound)return;rail.dataset.bound='true';
 const options=[...rail.querySelectorAll('.bait-option')];
 if(!options.length)return;
 for(const type of ['pointerdown','wheel','keydown'])rail.addEventListener(type,()=>{rail.dataset.baitInteracted='true';},{capture:true});
 const center=option=>option.offsetLeft+option.offsetWidth/2-rail.clientWidth/2;
 rail.scrollLeft=center(options.find(o=>o.dataset.foodId===encounterFood(gameState).id)||options[0]);
 function select(){const middle=rail.getBoundingClientRect().left+rail.clientWidth/2;const option=options.reduce((a,b)=>Math.abs(b.getBoundingClientRect().left+b.clientWidth/2-middle)<Math.abs(a.getBoundingClientRect().left+a.clientWidth/2-middle)?b:a);const food=getFood(option.dataset.foodId);
  options.forEach(o=>{o.classList.toggle('chosen',o===option);o.setAttribute('aria-selected',String(o===option));});rail.setAttribute('aria-activedescendant',option.id);
  gameState={...gameState,campaign:{...gameState.campaign,fieldFood:food.id}};
  const detail=app.querySelector('.bait-detail');if(detail){detail.querySelector('strong').textContent=food.label;detail.querySelector('span').textContent=food.unlimited&&gameState.inventory[food.id]>=1?'∞':'×'+(gameState.inventory[food.id]||0);}
  const button=app.querySelector('.encounter-trap');if(button)button.disabled=!(gameState.inventory[food.id]>=1);
 }
 rail.addEventListener('scroll',select,{passive:true});rail.addEventListener('scrollend',()=>saveGameState(gameState));
 let wheelTimer;rail.addEventListener('wheel',event=>{event.preventDefault();rail.classList.add('dragging');rail.scrollLeft+=Math.abs(event.deltaX)>Math.abs(event.deltaY)?event.deltaX:event.deltaY;select();clearTimeout(wheelTimer);wheelTimer=setTimeout(()=>{const target=center(options.find(o=>o.classList.contains('chosen')));rail.classList.remove('dragging');rail.scrollTo({left:target,behavior:'smooth'});saveGameState(gameState);},160);},{passive:false});
 rail.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight'].includes(event.key))return;event.preventDefault();const i=options.findIndex(o=>o.classList.contains('chosen')),next=options[Math.max(0,Math.min(options.length-1,i+(event.key==='ArrowRight'?1:-1)))];rail.scrollTo({left:center(next),behavior:'smooth'});});
 let drag=null;
 rail.addEventListener('pointerdown',event=>{if(event.button!==0)return;drag={x:event.clientX,left:rail.scrollLeft};rail.setPointerCapture(event.pointerId);rail.classList.add('dragging');event.preventDefault();});
 rail.addEventListener('pointermove',event=>{if(drag){event.preventDefault();rail.scrollLeft=drag.left+drag.x-event.clientX;select();}});
 const finish=()=>{if(!drag)return;const delta=rail.scrollLeft-drag.left,origin=options.reduce((a,b)=>Math.abs(center(b)-drag.left)<Math.abs(center(a)-drag.left)?b:a);drag=null;const index=options.indexOf(origin),chosen=options[Math.max(0,Math.min(options.length-1,index+(Math.abs(delta)>18?Math.sign(delta):0)))];rail.classList.remove('dragging');rail.scrollTo({left:center(chosen),behavior:'smooth'});saveGameState(gameState);rail.dispatchEvent(new CustomEvent('bait-released',{bubbles:true}));};
 rail.addEventListener('pointerup',()=>{select();finish();});rail.addEventListener('pointercancel',()=>{drag=null;rail.dataset.baitInteracted='false';rail.classList.remove('dragging');});
 select();
}
function scheduleGust(){
 clearTimeout(gustTimer);const scene=gameState.campaign.encounter?.scene||'quiet',strong=scene!=='quiet';
 gustTimer=setTimeout(()=>{const plants=[...app.querySelectorAll('.encounter-plant')];if(!document.hidden&&plants.length){const selected=strong?plants:plants.filter(()=>Math.random()<.6);selected.forEach(n=>n.classList.add(strong?'gust-strong':'gust'));clearTimeout(gustStopTimer);gustStopTimer=setTimeout(()=>plants.forEach(n=>n.classList.remove('gust','gust-strong')),520);}if(gameState.campaign.phase==='field')scheduleGust();},strong?1400+Math.random()*1800:2500+Math.random()*4500);
}
const encounterRender=render;
render=function(state){
 if(app.querySelector('.bait-carousel.dragging')&&state.campaign.phase==='field'&&!state.campaign.trapWaiting&&!state.ui.modal)return;
 encounterRender(state);installCarousel();
 const c=state.campaign,key=c.phase==='field'&&c.trapWaiting&&!c.trapReady?c.trapToken+':'+(c.encounter?.readyAt||0):null;
 if(key!==encounterTimerKey){clearTimeout(encounterTimer);encounterTimerKey=key;if(key)encounterTimer=setTimeout(()=>dispatch({type:'TRAP_READY',token:c.trapToken}),Math.max(0,(c.encounter?.readyAt||gameNow()+1000)-gameNow())+30);}
 const active=c.phase==='field'&&!state.ui.modal&&!titleScreenOpen,gkey=active?(c.encounter?.scene||'quiet'):null;
 if(gkey!==gustKey){gustKey=gkey;clearTimeout(gustTimer);clearTimeout(gustStopTimer);if(active)scheduleGust();}
};
const encounterStyle=document.createElement('style');encounterStyle.textContent=`
.encounter-drag-source{visibility:hidden}.encounter-picker:has(.encounter-drag-source){visibility:hidden}
#app .encounter-screen .campaign-scroll{display:block;position:relative;height:100%;padding:0}.encounter-scene{isolation:isolate;overflow:hidden}.encounter-landscape{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:-2}.encounter-picker{position:absolute;bottom:max(12px,env(safe-area-inset-bottom));left:0;right:0;display:flex;flex-direction:column;align-items:center;z-index:5;color:#645b46}.encounter-picker:before{content:'';position:absolute;inset:-10px 0 -12px;background:linear-gradient(transparent,#ead8bba6 48%,#ead8bbe8);z-index:-1;pointer-events:none}.encounter-cage-row{position:relative;width:140px;height:70px;display:flex;justify-content:center}.encounter-cage-row .encounter-trap{width:110px;height:63px;border:0;padding:0;background:none;touch-action:none;cursor:grab}.encounter-cage-row .encounter-trap svg{width:100%;height:100%;pointer-events:none}.encounter-change{position:absolute;right:-24px;top:22px;min-height:44px;width:44px;border:1px solid #fff8e599;border-radius:50%;background:#fff8e5cc;color:#75694f;font-size:22px}.encounter-instruction{font-size:12px;line-height:1.5;margin:2px 0 0}.bait-carousel{display:flex;position:relative;width:100%;box-sizing:border-box;gap:14px;padding:8px calc(50% - 52px);overflow-x:auto;overflow-y:hidden;scroll-snap-type:x mandatory;scrollbar-width:none;touch-action:none;cursor:grab;user-select:none}.bait-carousel::-webkit-scrollbar{display:none}.bait-carousel.dragging{scroll-snap-type:none;cursor:grabbing}.bait-option{flex:0 0 104px;scroll-snap-align:center;text-align:center;display:flex;flex-direction:column;align-items:center;gap:3px;opacity:.55;color:#655a44;pointer-events:none}.bait-option.chosen{opacity:1}.bait-picture{width:58px;height:58px;display:grid;place-items:center;border-radius:50%;background:#fff8e594;border:2px solid transparent}.bait-picture img{width:44px;height:42px;object-fit:contain;pointer-events:none}.bait-option.chosen .bait-picture{border-color:#ac945d;background:#fff7df;box-shadow:0 0 18px #f8e7a666}.bait-detail{display:flex;align-items:center;justify-content:center;gap:12px;height:24px;margin:0;font-size:13px}.bait-detail strong{font-weight:500}.bait-detail span{font-size:14px}.bait-luck{height:15px;display:flex;gap:4px;align-items:center;justify-content:center}.bait-luck i{width:9px;height:9px;border-left:2px solid #ad8d4c;border-top:2px solid #ad8d4c;transform:rotate(45deg)}.encounter-wait{position:absolute;left:0;right:0;bottom:16%;text-align:center;color:#665b45;font-size:14px;pointer-events:none}.encounter-plant{transform-box:fill-box;transform-origin:50% 100%}.encounter-plant.gust{animation:encounter-rustle .36s linear}.encounter-plant.gust-strong{animation:encounter-rustle-strong .48s linear}.encounter-night{position:absolute;inset:0;background:#182c5366;pointer-events:none;z-index:-1}.encounter-moon{position:absolute;top:8%;left:15%;width:65px;height:65px;border-radius:50%;background:#fff3c4;box-shadow:0 0 35px 12px #fff0ba55;pointer-events:none}.encounter-rainbow{position:absolute;left:13%;top:6%;width:74%;aspect-ratio:2/1;border-radius:200px 200px 0 0;border:7px solid #d6979390;border-bottom:0;box-shadow:0 -7px #dfbf8090,0 -14px #d6d79690,0 -21px #a3c9b090,0 -28px #9cbccd90;pointer-events:none;opacity:.8}.moon .encounter-wait{color:#fff5d5}.encounter-scene .trap{z-index:3}
@keyframes encounter-rustle{0%,100%{transform:translateX(0)}15%,45%,75%{transform:translateX(-1px) rotate(-.25deg)}30%,60%,90%{transform:translateX(1px) rotate(.25deg)}}@keyframes encounter-rustle-strong{0%,100%{transform:translateX(0)}12%,36%,60%,84%{transform:translateX(-1.5px) rotate(-.4deg)}24%,48%,72%,94%{transform:translateX(1.5px) rotate(.4deg)}}
@media(prefers-reduced-motion:reduce){.encounter-plant.gust,.encounter-plant.gust-strong{animation:none}.bait-carousel{scroll-behavior:auto}}
`;document.head.append(encounterStyle);
