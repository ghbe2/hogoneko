'use strict';
// Starter supplies use finite save values; unlimited use is a rule, not Infinity in JSON.
const starterIDs=['starter_toy','starter_food','starter_clean','water_refill'];
CONFIG.items.push({id:'starter_toy',label:'布きれじゃらし',kind:'hand',affinityType:'chase',durability:1,playEfficiency:.5,body:{},unlimited:true});
CONFIG.stage1.handItems.unshift('starter_toy');
CONFIG.stage1.foods.unshift({id:'starter_food',label:'おすそわけカリカリ',emoji:'◉',affinityType:'food',unlimited:true});
CONFIG.stage1.cleaners.unshift({id:'starter_clean',label:'コロコロ',emoji:'▱',power:.5,hairPickup:6,uses:1,unlimited:true});
Object.assign(getFood('water_refill'),{label:'小さな水くみ',unlimited:true});
bookIcons.starter_toy=bookSVG('<path d="M55 185Q95 118 144 42" fill="none" stroke="#927653" stroke-width="9" stroke-linecap="round"/><path d="M142 40Q178 66 170 110L208 138 161 149 150 105Q157 71 142 40" fill="#b98981"/>');
bookIcons.starter_clean=bookSVG('<path d="M172 76h24v55h-66v40" fill="none" stroke="#8c9692" stroke-width="11" stroke-linejoin="round"/><rect x="114" y="158" width="32" height="65" rx="14" fill="#b98880"/><rect x="30" y="36" width="153" height="77" rx="20" fill="#faf3df" stroke="#b8ad96" stroke-width="5"/><path d="M58 42v65M151 42v65" stroke="#ded4bb" stroke-width="3"/><path d="M76 74q10-12 20 0m13 13q10-12 20 0" fill="none" stroke="#a5947c" stroke-width="3"/>');
bookIcons.starter_food=bowlSVG(false,true);bookIcons.water_refill=bowlSVG(true,true);
getFood('starter_food').emoji=bookImage(bookIcons.starter_food);
getFood('water_refill').emoji=bookImage(bookIcons.water_refill);
getCleaner('starter_clean').emoji=bookImage(bookIcons.starter_clean);
TOY_EMOJI.starter_toy=bookImage(bookIcons.starter_toy);
TOOL_META.starter_toy={emoji:TOY_EMOJI.starter_toy,label:'布きれじゃらし',kind:'玩具'};
function ensureStarterSupplies(state){
 return {...state,inventory:{...state.inventory,...Object.fromEntries(starterIDs.map(id=>[id,1]))},durability:{...state.durability,starter_toy:1}};
}
Object.assign(DEFAULT_GAME_STATE,ensureStarterSupplies(DEFAULT_GAME_STATE));
const starterNormalize=normalizeLoadedState;
normalizeLoadedState=function(...args){const state=starterNormalize(...args);return state?ensureStarterSupplies(state):state;};
const starterWear=wearToy;
wearToy=(state,id)=>id==='starter_toy'?{inventory:state.inventory,durability:state.durability,broken:false}:starterWear(state,id);
// Keep the same SVG in the hand while dragging, instead of its empty textContent.
const starterDrag=startCommandDrag;
startCommandDrag=function(draft,...args){starterDrag(draft,...args);const icon=draft.target.querySelector('.command-emoji img,.big-emoji img');if(icon&&draft.ghost)draft.ghost.replaceChildren(icon.cloneNode(true));};
const starterReduce=reduceGameState;
reduceGameState=function(state,action){
 const care=state.ui.careAnimation;
 let next=starterReduce(ensureStarterSupplies(state),action);
 // The lint roller collects nearby fur efficiently, but keeps low power for other dirt.
 if(action.type==='FINISH_CARE'&&care?.id===action.id&&care.operation==='hair'&&care.cleanerId==='starter_clean'&&!next.ui.careAnimation){
  const hair=getCat(state).body.hair,target=hair.find(h=>h.id===care.hairId)||hair[0];
  const nearest=[...hair].sort((a,b)=>target?Math.hypot(a.x-target.x,a.y-target.y)-Math.hypot(b.x-target.x,b.y-target.y):0);
  const removed=new Set(nearest.slice(0,getCleaner('starter_clean').hairPickup).map(h=>h.id));
  next={...next,cats:next.cats.map((cat,i)=>i?cat:{...cat,body:{...cat.body,hair:hair.filter(h=>!removed.has(h.id))}})};
 }
 // All bowls use the same half-fill gesture, including free starter supplies.
 if(action.type==='FINISH_CARE'&&care?.id===action.id&&!next.ui.careAnimation&&
   (care.operation==='water'||care.operation==='food'&&care.foodId==='starter_food')){
  const key=care.operation==='water'?'waterLevel':'foodLevel';
  next={...next,cats:next.cats.map((cat,i)=>i?cat:{...cat,body:{...cat.body,[key]:Math.min(100,(getCat(state).body[key]||0)+(care.queuedFill?100:50))}})};
 }
 if(care?.cleanerId==='starter_clean'&&action.type==='FINISH_CARE')next={...next,ui:{...next.ui,equippedCleaner:'starter_clean'}};
 return ensureStarterSupplies(next);
};
const starterDock=renderCommandDock;
renderCommandDock=function(state){
 const template=document.createElement('template');template.innerHTML=starterDock(state);
 template.content.querySelectorAll('.main-command').forEach(button=>{
  const id=button.dataset.tab==='play'?state.ui.equippedHand:button.dataset.tab==='food'?state.ui.equippedFood:state.ui.equippedCleaner;
  button.title=button.querySelector('strong').textContent;
  button.querySelector('strong').remove();
  if(starterIDs.includes(id))button.querySelector('small').textContent='∞';
 });
 return template.innerHTML;
};
const hairShapes=[
 'M4 13Q3 7 7 9Q6 3 10 7Q12 1 13 8Q19 4 17 11Q23 13 17 15Q10 19 4 13',
 'M3 12Q7 5 9 9Q8 2 12 7Q17 3 16 10Q23 7 20 13Q15 18 9 15Q3 17 3 12',
 'M4 14Q0 10 6 10Q5 3 9 7Q11 3 12 9Q19 6 17 12Q23 15 16 16Q9 20 4 14',
 'M3 11Q7 7 10 9Q12 2 14 8Q20 3 18 11Q24 13 19 15Q14 14 10 17Q5 18 3 11',
 'M5 15Q1 8 7 10Q4 3 10 7Q15 1 14 8Q23 5 18 12Q23 18 16 16Q10 20 5 15',
 'M2 13Q4 7 8 10Q9 5 12 9Q19 2 17 10Q23 9 20 14Q12 19 2 13'];
const hairRoom=renderRoomLife;
renderRoomLife=function(...args){
 return hairRoom(...args).replace(/(<button class="shed-hair"[^>]*>)([\s\S]*?)(<\/button>)/g,(all,start,inside,end)=>{
  const id=start.match(/data-hair="([^"]+)"/)?.[1]||'0';let seed=2166136261;for(const char of id)seed=Math.imul(seed^char.charCodeAt(0),16777619)>>>0;
  return start+`<svg viewBox="0 0 26 22" aria-hidden="true" style="width:${12+seed%7}px;transform:rotate(${seed%360}deg)"><path d="${hairShapes[seed%hairShapes.length]}" fill="#b5a48b" opacity=".6"/><path d="M8 12q4-4 8-1M10 15q3-3 7-2" fill="none" stroke="#847661" stroke-width=".7"/></svg>`+end;
 });
};
const starterRender=render;
render=function(state){starterRender(state);
 document.querySelectorAll('.grid-cell[data-item],.grid-cell[data-food],.grid-cell[data-cleaner]').forEach(cell=>{
  const id=cell.dataset.item||cell.dataset.food||cell.dataset.cleaner;if(!starterIDs.includes(id))return;
  const count=cell.querySelector('.stock,.cell-count');if(count)count.textContent='∞';
  const durability=cell.querySelector('.durability');if(durability)durability.remove();
  const small=cell.querySelector('small');if(small)small.textContent=id==='starter_toy'?'∞・ゆっくり育つ':id==='starter_clean'?'∞・毛に強い／汚れに弱い':'∞・半分ずつ補充';
 });
};
let charging=null;
const endCharge=()=>{charging?.node.classList.remove('hold-charging');charging=null;};
window.addEventListener('pointerdown',event=>{
 const node=event.target.closest('[data-action="call-cat"],[data-action="touch-now"]');
 if(!node||node.disabled||event.button!==0)return;
 endCharge();charging={node,id:event.pointerId,x:event.clientX,y:event.clientY};node.classList.add('hold-charging');
},true);
window.addEventListener('pointermove',event=>{if(charging&&charging.id===event.pointerId&&Math.hypot(event.clientX-charging.x,event.clientY-charging.y)>10)endCharge();},true);
window.addEventListener('pointerup',endCharge,true);window.addEventListener('pointercancel',endCharge,true);window.addEventListener('blur',endCharge);
const compactStyle=document.createElement('style');compactStyle.textContent=`
.command-dock.tiered-dock{grid-template-columns:auto 76px;width:max-content;max-width:calc(100% - 20px);gap:18px}
.main-command-row{justify-content:center;gap:8px}
.tiered-dock .main-command{width:58px;height:58px;min-width:58px;padding:5px;position:relative}
.tiered-dock .main-command .command-emoji{display:grid;place-items:center;width:42px;height:42px}
.tiered-dock .main-command .command-emoji .book-icon{width:38px;height:38px;object-fit:contain}
.tiered-dock .main-command::after{bottom:-11px;font-size:10px;padding:2px 8px;white-space:nowrap}
.tiered-dock .main-command small{top:-3px;right:-2px;bottom:auto;font-size:9px;min-width:18px}
.tiered-dock .sub-command{position:relative;isolation:isolate;overflow:hidden}
.tiered-dock .sub-command::before{content:'';position:absolute;inset:0;background:#e6b5ac;transform:scaleX(0);transform-origin:left;z-index:-1}
.tiered-dock .sub-command.hold-charging::before{animation:hold-fill .6s linear forwards}
@keyframes hold-fill{to{transform:scaleX(1)}}
.shed-hair{width:28px;height:28px;display:grid;place-items:center;transform:none}
.shed-hair svg{height:auto;overflow:visible;pointer-events:none}
.command-ghost .book-icon{width:42px;height:42px}
`;document.head.appendChild(compactStyle);
if(gameState.onboarding.status==='new'&&!gameState.flags.starterSuppliesV021){
 gameState={...gameState,ui:{...gameState.ui,equippedHand:'starter_toy',equippedFood:'starter_food',equippedCleaner:'starter_clean'}};
}
gameState={...ensureStarterSupplies(gameState),flags:{...gameState.flags,starterSuppliesV021:true}};saveGameState(gameState);
