'use strict';
const STARTER_CONTENTS={food_dry:1,starter_toy:1,starter_clean:1,water_refill:1,bowl:1,water:1,litter:1};
const FIRST_FURNITURE=['bowl','water','litter','box'];
const INTAKE_GUIDE_TOP=86;
const GUIDE_NOTE_HEIGHT=210;
// The same rectangles govern automatic placement, drag previews and saved layouts.
function guidedIntake(state){return state.campaign.phase==='intake'&&firstActive(state);}
function intakePlacementFrame(state,width=app.clientWidth,height=app.clientHeight){
 const bounds=roomPlacementBounds(height,state),top=INTAKE_GUIDE_TOP+GUIDE_NOTE_HEIGHT+8;
 // The SVGs include a small transparent margin below their feet.
 return {width,height,top,bottom:bounds.floorBottom,floor:bounds.floorTop+14,
  carrier:{x:width-122,y:Math.max(top,bounds.floorTop-51),width:110,height:63}};
}
function intakeFurnitureRect(p,frame){return {x:p.x*frame.width/100,y:p.y*frame.height/100,width:['shelf','decor_sun'].includes(p.itemId)?100:p.itemId==='tower'?90:84,height:furnitureHeight(p.itemId)};}
function furnitureRectsOverlap(a,b,gap=8){return a.x<b.x+b.width+gap&&a.x+a.width+gap>b.x&&a.y<b.y+b.height+gap&&a.y+a.height+gap>b.y;}
function intakePositionClear(p,placed,frame){
 const r=intakeFurnitureRect(p,frame);
 return r.x>=12-.1&&r.x+r.width<=frame.width-12+.1&&r.y>=frame.top-.1&&r.y+r.height>=frame.floor-.1&&r.y+r.height<=frame.bottom+.1&&!furnitureRectsOverlap(r,frame.carrier)&&placed.every(n=>n.itemId===p.itemId||!furnitureRectsOverlap(r,intakeFurnitureRect(n,frame)));
}
function openIntakePositions(itemId,placed,frame){
 const size=intakeFurnitureRect({itemId,x:0,y:0},frame),minY=Math.max(frame.top,frame.floor-size.height),maxY=frame.bottom-size.height,maxX=frame.width-12-size.width;
 const xs=[12,maxX],ys=[minY,maxY];
 for(let x=20;x<maxX;x+=8)xs.push(x);
 for(let y=minY+8;y<maxY;y+=8)ys.push(y);
 return xs.flatMap(x=>ys.map(y=>({itemId,x:x/frame.width*100,y:y/frame.height*100}))).filter(p=>intakePositionClear(p,placed,frame));
}
function planIntakeFurniture(state,placed,pending,randomize=false){
 const frame=intakePlacementFrame(state);let budget=3000;
 function solve(items,rest){
  if(!rest.length)return items;
  if(--budget<0)return null;
  const options=openIntakePositions(rest[0],items,frame);
  if(randomize)for(let i=options.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[options[i],options[j]]=[options[j],options[i]];}
  for(const p of options){const result=solve([...items,p],rest.slice(1));if(result)return result;}
  return null;
 }
 return solve(placed,pending);
}
function repairIntakePlacement(state){
 if(!guidedIntake(state))return state;
 const room=getRoom(state),frame=intakePlacementFrame(state),valid=[],invalid=[];
 for(const p of room.floor){if(intakePositionClear(p,valid,frame))valid.push(p);else invalid.push(p.itemId);}
 if(!invalid.length)return state;
 // Preserve valid positions. Only legacy/resize collisions are relocated.
 const arranged=planIntakeFurniture(state,valid,invalid)||planIntakeFurniture(state,[],room.floor.map(p=>p.itemId).sort((a,b)=>furnitureHeight(b)-furnitureHeight(a)));
 if(!arranged)return state;
 return {...state,rooms:state.rooms.map(r=>r===room?{...r,floor:r.floor.map(p=>({...p,...arranged.find(n=>n.itemId===p.itemId)}))}:r)};
}
SHOP_CATALOG.push({id:'starter_set',shop:'petshop',category:'tools',label:'初心者セット',price:10,quantity:1,unit:'セット',emoji:''});
bookIcons.starter_set=`<svg viewBox="0 0 100 90"><path d="M14 28h72v48H14Z" fill="#b98b59"/><path d="M14 28L25 14h52l9 14-36 11Z" fill="#ddbe87"/><path d="M50 39v37" stroke="#91744e" stroke-width="2"/><path d="M30 47h40v20H30Z" fill="#f8eed5"/><path d="M42 58l-1-8 6 3 7-3 1 8q-6 8-13 0" fill="#7c926c"/></svg>`;
const firstBenefit=productBenefit;
productBenefit=id=>id==='starter_set'?'これがあれば初心者保護主デビュー！':firstBenefit(id);
const firstActive=s=>s.onboarding?.flowVersion===1&&s.onboarding.status==='active';
const guideTo=(s,guide)=>({...s,onboarding:{...s.onboarding,guide}});
const hasFirstFurniture=s=>FIRST_FURNITURE.every(id=>getPlaced(getRoom(s)).some(p=>p.itemId===id));
const firstComfort=getRoomComfortBreakdown;
getRoomComfortBreakdown=function(s){const r=firstComfort(s);return firstActive(s)&&s.campaign.phase==='intake'?{...r,canExit:hasFirstFurniture(s),missingEssential:FIRST_FURNITURE.filter(id=>!getPlaced(getRoom(s)).some(p=>p.itemId===id))}:r;};
const firstReducer=reduceGameState;
reduceGameState=function(state,action){
 const first=firstActive(state),g=state.onboarding.guide,c=state.campaign,cat=getCat(state);
 if(['CHOOSE_AREA','ENTER_STAGE','ENTER_PARK','GO_RESCUE'].includes(action.type)&&state.coins<RELEASE_ECONOMY.clinic)return rescueFundsNotice(state);
 if(action.type==='START_INTAKE'&&state.onboarding.flowVersion===1)return state;
 if(action.type==='FINISH_EXAM'&&c.firstExamAt&&Date.now()-c.firstExamAt<3000)return state;
 if(action.type==='FIRST_GUIDE_NEXT'){
  if(first&&['healthy','stats','receipt','pay'].includes(g))return guideTo(state,'chartReview');
  const spec=FIRST_GUIDES[g];if(!first||!spec?.next)return state;
  if(g==='essentials')return guideTo({...state,inventory:{...state.inventory,box:Math.max(1,state.inventory.box||0)},durability:{...state.durability,box:getItem('box').durability}},spec.next);
  return guideTo(state,spec.next);
 }
 if(action.type==='FIRST_SCROLL_DONE'&&first&&g==='clinicScroll')return guideTo(state,'clinicBuilding');
 if(action.type==='GO_CLINIC'&&cat.status==='captured'){
  if(!c.trapRevealDone)return state;
  if(first){townScrollTop=app.querySelector('.town-map-scroll')?.clientHeight*1.5||null;return guideTo({...state,campaign:{...c,phase:'town'},ui:{...state.ui,modal:null}},'clinicScroll');}
  return {...state,campaign:{...c,phase:'shop',shopId:'clinic',clinicReception:true},ui:{...state.ui,modal:null}};
 }
 if(action.type==='FIRST_EXAM'){
  if(c.phase!=='shop'||c.shopId!=='clinic'||cat.status!=='captured')return state;
  return guideTo({...state,campaign:{...c,phase:'clinic',clinicStep:'exam',firstExamAt:Date.now()}},null);
 }
 if(action.type==='PAY_FIRST_EXAM'){
  if(c.phase!=='clinic'||c.clinicStep==='exam'||cat.status!=='captured'||c.initialVisitPaidCatId===cat.id)return state;
  let next=firstReducer(state,{type:'START_INTAKE',name:'ネコ'});
  if(next.campaign.phase!=='intake')return state;
  next={...next,cats:next.cats.map(n=>({...n,name:'',named:false})),campaign:{...next.campaign,phase:'town',initialVisitPaidCatId:cat.id},ui:{...next.ui,modal:null,layoutMode:false}};
  townScrollTop=null;return first?guideTo(next,'shopBuilding'):next;
 }
 if(action.type==='GO_HOME'&&cat.status==='intake'){
  if(first&&!state.flags.starterBought)return state;
  const next={...state,campaign:{...c,phase:'intake'},ui:{...state.ui,modal:null,layoutMode:false}};
  return first?guideTo(next,'homeHello'):next;
 }
 if(action.type==='CHOOSE_AREA'&&canStartStage(state,action.area)&&!first){return firstReducer({...state,ui:{...state.ui,modal:'stageGate',stageChoice:action.area}},{type:'ENTER_STAGE'});}
 if(action.type==='CALL_INTAKE_CAT'&&c.phase==='intake'&&!cat.named){
  if(first&&!hasFirstFurniture(state))return state;
  return guideTo({...state,ui:{...state.ui,firstName:true,layoutMode:false,layoutTrayOpen:false}},null);
 }
 if(action.type==='FIRST_NAME_CALL'){
  const name=String(action.name||'').trim().slice(0,8);if(!name||!state.ui.firstName||c.phase!=='intake'||cat.named)return state;
  return guideTo({...state,cats:state.cats.map(n=>n.id===cat.id?{...n,name,named:true}:n),campaign:{...c,intakeCallCount:0},ui:{...state.ui,firstName:false}},'callFirst');
 }
 if(action.type==='FIRST_CALL_PAUSE_DONE'&&g==='callWait')return guideTo(state,'callAgain');
 if(action.type==='CALL_INTAKE_CAT'&&first&&cat.named&&!c.intakeCalled){if(g==='callWait')return state;const count=(c.intakeCallCount||0)+1;const next={...state,campaign:{...c,intakeCallCount:count,firstCalledAt:Date.now()}};return count<4?guideTo(next,count===1?'callWait':'callAgain'):guideTo(firstReducer(next,action),null);}
 if(action.type==='ACCEPT_CAT'&&first){return state.onboarding.farewellSeen?state:guideTo({...state,onboarding:{...state.onboarding,farewellSeen:true}},'farewell');}
 if(action.type==='FIRST_FINISH'&&first&&g==='goodLuck'){const next=firstReducer(guideTo(state,null),{type:'ACCEPT_CAT'});return {...next,onboarding:{...next.onboarding,appIntro:'prompt'},ui:{...next.ui,modal:null,scheduleIntro:false}};}
 if(action.type==='OPEN_NOTEBOOK'&&state.onboarding.appIntro==='prompt'){const next=firstReducer(state,action);return {...next,onboarding:{...next.onboarding,appIntro:'opened'}};}
 if(action.type==='PICK_FURNITURE'&&first&&c.phase==='intake'){
  if(!owned(state,action.itemId))return state;
  const placed=getPlaced(getRoom(state));
  if(placed.some(p=>p.itemId===action.itemId))return {...state,ui:{...state.ui,layoutTrayOpen:false}};
  const remaining=FIRST_FURNITURE.filter(id=>id!==action.itemId&&!placed.some(p=>p.itemId===id)).sort((a,b)=>furnitureHeight(b)-furnitureHeight(a));
  const plan=planIntakeFurniture(state,placed,[action.itemId,...remaining],true),position=plan?.find(p=>p.itemId===action.itemId);
  if(!position)return {...state,ui:{...state.ui,message:'家具の置ける場所を空けてください。'}};
  const next=firstReducer(state,{type:'DROP_LAYOUT_ITEM',itemId:action.itemId,...position});
  if(!getPlaced(getRoom(next)).some(p=>p.itemId===action.itemId))return state;
  const essentials=['bowl','water','litter'].every(id=>getPlaced(getRoom(next)).some(p=>p.itemId===id));
  return guideTo({...next,ui:{...next.ui,layoutTrayOpen:false,pendingFurniture:null}},hasFirstFurniture(next)?'moveFurniture':essentials?'essentials':'addMore');
 }
 if(action.type==='FIRST_PLACE_FURNITURE'){
  if(!first||!state.ui.pendingFurniture||!state.ui.layoutMode)return state;
  const id=state.ui.pendingFurniture;
  let next=firstReducer(state,{type:'DROP_LAYOUT_ITEM',itemId:id,x:action.x,y:action.y});
  if(!getPlaced(getRoom(next)).some(p=>p.itemId===id))return state;
  next={...next,ui:{...next.ui,pendingFurniture:null,layoutMode:!hasFirstFurniture(next)}};
  return guideTo(next,hasFirstFurniture(next)?'roomReady':'addMore');
 }
 let next=firstReducer(state,action);
 if(action.type==='DROP_LAYOUT_ITEM'&&first&&g==='moveFurniture'&&!action.store){const before=getPlaced(getRoom(state)).find(p=>p.itemId===action.itemId),after=getPlaced(getRoom(next)).find(p=>p.itemId===action.itemId);if(before&&after&&(before.x!==after.x||before.y!==after.y))return guideTo({...next,ui:{...next.ui,layoutMode:false,layoutTrayOpen:false}},'roomReady');}
 if(action.type==='START_GAME'&&state.onboarding.status==='new'){
  const inventory=Object.fromEntries(Object.keys(next.inventory).map(id=>[id,0]));inventory.food_wet=1;
  next={...next,inventory,rooms:next.rooms.map(r=>({...r,floor:[],wall:[]})),onboarding:{...next.onboarding,flowVersion:1,guide:null},cats:next.cats.map(n=>({...n,name:'',named:false}))};
 }
 if(action.type==='CHECKOUT_SHOP'&&!state.ui.storeThanks&&next.ui.storeThanks){
  const quantity=storeCart(state).starter_set||0;
  if(quantity){const inventory={...next.inventory},durability={...next.durability};for(const[id,n]of Object.entries(STARTER_CONTENTS)){inventory[id]=getItem(id)?.kind==='placed'?Math.max(1,inventory[id]||0):(inventory[id]||0)+n*quantity;if(getItem(id)?.durability)durability[id]=getItem(id).durability;}next={...next,inventory,durability,flags:{...next.flags,starterBought:true}};}
  next={...next,ui:{...next.ui,storeLeaveAt:Date.now()+3000}};if(first)next=guideTo(next,null);
 }
 if(!first||next===state)return next;
 if(action.type==='CHOOSE_AREA'&&next.campaign.phase==='field')next=guideTo(next,'fieldHello');
 if(action.type==='FIELD_PLACE_TRAP'&&next.campaign.trapWaiting)next=guideTo(next,null);
 if(action.type==='TRAP_READY'&&next.campaign.trapReady)next=guideTo(next,'trapReady');
 if(action.type==='OPEN_TRAP'&&next.campaign.phase==='trapInspect')next=guideTo(next,null);
 if(action.type==='FINISH_TRAP_REVEAL'&&next.campaign.trapRevealDone)next=guideTo(next,'captured');
 if(action.type==='OPEN_MAP_SHOP')next=guideTo(next,action.shopId==='clinic'?'clinicHello':action.shopId==='petshop'?'shopHello':null);
 if(action.type==='FINISH_EXAM'&&next.campaign.clinicStep==='summary')next=guideTo(next,'healthy');
 if(action.type==='SHOP_TAB'&&next.ui.shopTab==='tools')next=guideTo(next,'starter');
 if(action.type==='STORE_DETAIL'&&action.id==='starter_set')next=guideTo(next,null);
 if(action.type==='STORE_ADD'&&next.ui.storeCartOpen)next=guideTo(next,'purchase');
 if(action.type==='BACK_TO_TOWN'&&state.ui.storeThanks)next=guideTo(next,'homeBuilding');
 if(action.type==='TOGGLE_LAYOUT'&&next.ui.layoutMode)next=guideTo(next,'addFurniture');
 if(action.type==='TOGGLE_LAYOUT_TRAY'&&next.ui.layoutTrayOpen)next=guideTo(next,'chooseFurniture');
 return next;
};
// Pointer release, snap alignment and a quiet interval must all be complete.
let baitSettleTimer;
function settleFirstBait(e){const rail=e.target;if(!rail.matches('.bait-carousel'))return;clearTimeout(baitSettleTimer);baitSettleTimer=setTimeout(()=>{if(rail.dataset.baitInteracted!=='true'||!rail.isConnected||rail.classList.contains('dragging')||!firstActive(gameState)||gameState.onboarding.guide!=='bait'||gameState.campaign.fieldFood!=='food_wet')return;const r=rail.getBoundingClientRect(),o=rail.querySelector('.chosen').getBoundingClientRect();if(Math.abs(o.left+o.width/2-r.left-r.width/2)>2)return;gameState=guideTo(gameState,'trap');saveGameState(gameState);render(gameState);},450);}
for(const event of ['scroll','scrollend','bait-released'])app.addEventListener(event,settleFirstBait,true);

const firstTown=renderTown;
renderTown=function(state){const t=document.createElement('template');t.innerHTML=firstTown(state);if(getCat(state).status==='intake')t.content.querySelector('.town-destination.home')?.removeAttribute('disabled');return t.innerHTML;};
const firstShop=renderMapShop;
renderMapShop=function(state){
 if(state.campaign.shopId==='clinic'&&getCat(state).status==='captured')return receptionShell(state,'clinic','こんにちは。\nまずは体調を見てみましょう。',`<div class="clinic-commands"><button data-first="exam"><strong>初診 <span>›</span></strong><small>検査・ワクチン</small></button><button data-clinic="examine" disabled><strong>健康チェック</strong><small>体調の確認</small></button><button data-action="go-surgery" disabled><strong>不妊去勢手術</strong><small>地域猫の準備</small></button></div>`,'');
 const html=firstShop(state);
 if(state.campaign.shopId==='clinic'&&state.campaign.clinicReception&&!state.campaign.clinicExamined){const t=document.createElement('template');t.innerHTML=html;const commands=t.content.querySelector('.clinic-commands');commands?.insertAdjacentHTML('afterbegin','<button data-first="exam" disabled><strong>初診</strong><small>保護した直後の検査・ワクチン</small></button>');return t.innerHTML;}
 return html;
};
const firstPose=scenePose;
scenePose=svg=>svg.closest('.first-exam-cat')?['sleep','neutral']:firstPose(svg);
const firstClinic=renderClinic;
function publicCoatLabel(cat){return (cat.coatLabel||'—').replace(/\s*[A-ZＡ-Ｚ](?=（|$)/g,'').replace(/（レア）/g,'').split(' / ')[0];}
function firstExamArt(){const t=document.createElement('template');t.innerHTML=receptionArt('doctor');const staff=t.content.querySelector('.reception-staff');return `<svg viewBox="0 0 450 300" preserveAspectRatio="xMidYMax meet" aria-hidden="true"><path fill="#d7ddcc" d="M0 0h450v300H0Z"/><path fill="#b5c9bf" stroke="#f5efd9" stroke-width="6" d="M25 50h130v130H25Z"/><path stroke="#f5efd9" stroke-width="5" d="M90 50v130M25 115h130"/>${staff.outerHTML}</svg>`;}
renderClinic=function(state,cat){
 if(state.campaign.clinicStep==='exam'){
  const elapsed=Math.max(0,Date.now()-(state.campaign.firstExamAt||Date.now()));
  return renderCampaignShell(state,'動物病院',`<section class="first-exam"><div class="first-doctor">${firstExamArt()}</div><div class="first-exam-bed"></div><div class="first-exam-cat">${renderCatArt(cat).replace('200 55 320 320','190 245 310 160')}</div><div class="exam-doctor-words" aria-label="先生の診察中のひと言"><p style="animation-delay:${200-elapsed}ms">どれどれ…</p><p style="animation-delay:${1550-elapsed}ms">ふむふむ</p></div></section>`,'');
 }
 if(cat.status!=='captured')return renderMapShop({...state,campaign:{...state.campaign,shopId:'clinic',clinicReception:true,clinicExamined:true}});
 const condition=cat.rescueProfile?.condition,invoice=initialExamInvoice(cat);
 const explaining=firstActive(state)&&['healthy','stats','receipt','pay'].includes(state.onboarding.guide),coat=publicCoatLabel(cat);
 return renderCampaignShell(state,'動物病院',`<section class="first-chart ${explaining?'explaining':''}"><header><h1>診察結果</h1></header><div class="first-profile"><div class="first-chart-cat">${renderCatArt(cat)}</div><div><strong class="first-diagnosis">${condition?'必要な手当てをしました。':'異常はありません。'}</strong><dl class="first-chart-stats"><div><dt>毛柄</dt><dd>${coat}</dd></div><div><dt>体重</dt><dd>${cat.body.weight.toLocaleString()} g</dd></div><div><dt>性別</dt><dd>${cat.sex==='female'?'メス':'オス'}</dd></div></dl></div></div><section class="first-receipt"><h2>診療明細</h2>${invoice.rows.map(row=>`<div><span>${row.label}</span><b>${row.cost} 枚</b></div>`).join('')}<div class="receipt-total"><strong>合計</strong><b>${invoice.total} コイン</b></div>${state.coins<invoice.total?'<small class="medical-debt-note">不足分は未払いになります。</small>':''}</section></section>`,`<button class="campaign-button" data-first="pay" ${explaining?'disabled':''}>${medicalPaymentLabel(state,invoice.total)} <span aria-hidden="true">›</span></button>`);
};
const firstIntake=renderIntake;
renderIntake=function(state,cat){const t=document.createElement('template');t.innerHTML=firstIntake(state,cat);const call=t.content.querySelector('.intake-footer-call');if(call&&!cat.named){call.textContent='名前を決めて、呼ぶ';call.disabled=firstActive(state)&&!hasFirstFurniture(state);}return t.innerHTML;};

// Dialogue is centrally maintained in game-dialogue.js.

const firstTownTutorial=currentTownTutorial;
currentTownTutorial=s=>firstActive(s)&&s.onboarding.guide?null:firstTownTutorial(s);
let firstFrame,firstTimer,shopExitTimer,firstMapGuide,examWordsObserver;
function fitFirstPortrait(svg){
 const inverse=svg.getScreenCTM()?.inverse();if(!inverse)return;const points=[];
 const outlines=[...svg.querySelectorAll('.part-outline')].map(n=>[n,n.style.display]);outlines.forEach(([n])=>n.style.display='inline');
 // Measure in SVG coordinates: scene entry transforms must not shrink the portrait.
 svg.querySelectorAll('path,ellipse,circle,polygon').forEach(n=>{if(n.closest('defs,clipPath,mask'))return;const outline=n.classList.contains('part-outline');for(let p=n;p&&p!==svg;p=p.parentElement){if(p===n&&outline)continue;const s=getComputedStyle(p);if(s.display==='none'||s.visibility==='hidden'||Number(s.opacity)===0&&!outline)return;}const r=n.getBBox(),ctm=n.getScreenCTM();if(!ctm||(!r.width&&!r.height))return;const matrix=inverse.multiply(ctm);for(const [x,y]of [[r.x,r.y],[r.x+r.width,r.y],[r.x,r.y+r.height],[r.x+r.width,r.y+r.height]])points.push(new DOMPoint(x,y).matrixTransform(matrix));});
 outlines.forEach(([n,display])=>n.style.display=display);
 if(!points.length)return;const x=Math.min(...points.map(p=>p.x)),y=Math.min(...points.map(p=>p.y)),w=Math.max(...points.map(p=>p.x))-x,h=Math.max(...points.map(p=>p.y))-y;svg.setAttribute('viewBox',`${x-5} ${y-5} ${w+10} ${h+10}`);svg.setAttribute('preserveAspectRatio','xMidYMax meet');
}
const firstRender=render;
render=function(state){
 cancelAnimationFrame(firstFrame);clearTimeout(firstTimer);clearTimeout(shopExitTimer);state=repairIntakePlacement(state);if(guidedIntake(state))gameState=state;firstRender(state);
 if(guidedIntake(state)){
  app.querySelector('.intake-layout')?.classList.add('guided-intake');
  const r=intakePlacementFrame(state).carrier,cage=app.querySelector('.room-carrier'),emerging=app.querySelector('.intake-emerging-cat');
  if(cage)Object.assign(cage.style,{left:(r.x+r.width/2)+'px',top:(r.y+r.height/2)+'px',width:r.width+'px',height:r.height+'px'});
  if(emerging)Object.assign(emerging.style,{left:(r.x+r.width/2)+'px',top:(r.y+r.height-67)+'px'});
 }
 // The field intentionally keeps its DOM while a carousel is being dragged.
 // Replace its guide explicitly too: otherwise stale and unstyled portraits stack.
 app.querySelectorAll('section.first-guide').forEach(layer=>layer.remove());
 const bait=app.querySelector('.bait-carousel');if(bait&&!bait.parentElement.querySelector('.bait-direction')){bait.parentElement.insertAdjacentHTML('beforeend','<span class="bait-direction is-left" aria-hidden="true"><i></i><i></i><i></i></span><span class="bait-direction is-right" aria-hidden="true"><i></i><i></i><i></i></span>');}
 if(state.onboarding.guide==='callWait')firstTimer=setTimeout(()=>dispatch({type:'FIRST_CALL_PAUSE_DONE'}),Math.max(0,1800-(Date.now()-state.campaign.firstCalledAt)));
 if(firstActive(state)&&state.campaign.phase==='intake'&&state.campaign.intakeCalled&&!state.onboarding.farewellSeen)firstTimer=setTimeout(()=>dispatch({type:'ACCEPT_CAT'}),Math.max(0,1400-(Date.now()-(state.campaign.firstCalledAt||Date.now()))));
 const emerging=app.querySelector('.intake-emerging-cat');if(emerging&&state.campaign.firstCalledAt)emerging.getAnimations().forEach(a=>{a.currentTime=Math.min(1250,Date.now()-state.campaign.firstCalledAt)});
 app.querySelectorAll('.first-chart-cat .game-cat-svg').forEach(fitFirstPortrait);
 if(emerging){const scale=getCatPoint(state).scale||1;emerging.style.setProperty('--intake-cat-scale',scale);emerging.querySelector('svg').style.transform='scale(1.3)';}
 examWordsObserver?.disconnect();
 const examScene=app.querySelector('.first-exam'),examWords=examScene?.querySelector('.exam-doctor-words');
 if(examWords){
  const align=()=>{const scene=examScene.getBoundingClientRect(),head=examScene.querySelector('.reception-staff-head').getBoundingClientRect(),scale=scene.height/examScene.clientHeight||1;examWords.style.top=Math.max(8,(head.top-scene.top)/scale-54)+'px';};
  align();examWordsObserver=new ResizeObserver(align);examWordsObserver.observe(examScene);
 }
 if(state.campaign.phase==='clinic'&&getCat(state).status==='captured'&&state.campaign.clinicStep==='exam')firstTimer=setTimeout(()=>dispatch({type:'FINISH_EXAM'}),Math.max(0,3000-(Date.now()-(state.campaign.firstExamAt||Date.now()))));
 if(state.ui.storeThanks&&state.campaign.phase==='shop')shopExitTimer=setTimeout(()=>dispatch({type:'BACK_TO_TOWN'}),Math.max(0,(state.ui.storeLeaveAt||Date.now()+3000)-Date.now()));
 if(state.ui.firstName){const panel=document.createElement('div');panel.className='first-name modal-layer';panel.innerHTML=`<section><div class="first-name-cat">${renderCatArt(getCat(state))}</div><h2>なまえ決まった？</h2><input maxlength="8" aria-label="ネコの名前"><button data-first="name">決定</button></section>`;panel.querySelector('input').value=state.campaign.nameDraft||'';app.append(panel);mountGameCats();return;}
 if(!firstActive(state)||titleScreenOpen)return;
 const spec=FIRST_GUIDES[state.onboarding.guide];if(!spec)return;
 if(state.onboarding.guide==='chartReview'){const cue=document.createElement('div');cue.className='chart-pay-cue';cue.innerHTML=guideHand();app.querySelector('.campaign-actions')?.append(cue);return;}
 const selector=typeof spec.target==='function'?spec.target():spec.target,target=app.querySelector(selector)||app.querySelector('.stage');if(!target)return;
 const layer=document.createElement('section');layer.className='first-guide';layer.dataset.context=state.campaign.phase;layer.innerHTML=`<div class="first-guide-ring"></div><aside class="first-guide-note shared-guide-note"><header><span class="first-senior">${seniorArt().replace('viewBox="0 0 220 270"','viewBox="45 5 135 190"')}</span><strong class="senior-dialogue-name">保護主のせんぱい</strong></header><p></p>${spec.next||spec.finish?`<button data-first="${spec.finish?'finish':'next'}">${spec.finish?'はじめる':'つぎへ'}</button>`:'<small></small>'}</aside>`;layer.querySelector('p').textContent=typeof spec.copy==='function'?spec.copy():spec.copy;app.append(layer);
 const scroller=app.querySelector('.town-map-scroll');if(state.onboarding.guide==='clinicScroll'&&scroller&&firstMapGuide!=='clinicScroll')scroller.scrollTop=scroller.clientHeight*1.5;firstMapGuide=state.onboarding.guide;
 const watchScroll=()=>{if(!layer.isConnected)return;if(state.onboarding.guide==='clinicScroll'&&scroller&&scroller.scrollTop>=scroller.clientHeight*1.99){dispatch({type:'FIRST_SCROLL_DONE'});return;}firstFrame=requestAnimationFrame(watchScroll);};watchScroll();
};
app.addEventListener('click',event=>{
 const b=event.target.closest('[data-first]');if(b){const map={next:'FIRST_GUIDE_NEXT',finish:'FIRST_FINISH',exam:'FIRST_EXAM',pay:'PAY_FIRST_EXAM',name:'FIRST_NAME_CALL'};dispatch({type:map[b.dataset.first],name:app.querySelector('.first-name input')?.value});return;}
});
app.addEventListener('input',event=>{if(event.target.matches('.first-name input')){gameState={...gameState,campaign:{...gameState.campaign,nameDraft:event.target.value}};saveGameState(gameState);}});
function gateFirstInput(event){
 if(!firstActive(gameState)||titleScreenOpen)return;
 if(gameState.ui.firstName){if(event.target.closest('.first-name'))return;event.preventDefault();event.stopImmediatePropagation();return;}
 const spec=FIRST_GUIDES[gameState.onboarding.guide];if(!spec||event.target.closest('.first-guide-note'))return;
 if(gameState.onboarding.guide==='moveFurniture'&&event.target.closest('.placed-item.item-box'))return;
 if(['quantity','purchase'].includes(gameState.onboarding.guide)&&event.target.closest('.store-quantity button'))return;
 if(gameState.onboarding.guide==='placeFurniture'&&event.target.closest('[data-room-world]')){
  event.preventDefault();event.stopImmediatePropagation();
  if(event.type==='click'){const r=app.querySelector('[data-room-world]').getBoundingClientRect(),b=roomPlacementBounds(r.height),x=event.clientX-r.left,y=event.clientY-r.top;if(y>=b.floorTop&&y<=b.floorBottom&&x>=12&&x<=r.width-12)dispatch({type:'FIRST_PLACE_FURNITURE',x:Math.max(4,Math.min(85,x/r.width*100)),y:y/r.height*100});}
  return;
 }
 const selector=typeof spec.target==='function'?spec.target():spec.target;
 const allowed=gameState.onboarding.guide==='clinicScroll'?'.town-map-scroll':selector;
 if(!spec.next&&!spec.finish&&event.target.closest(allowed))return;
 event.preventDefault();event.stopImmediatePropagation();
}
// Gate before any app-level capture handlers can start an unrelated interaction.
window.addEventListener('pointerdown',gateFirstInput,true);
window.addEventListener('click',gateFirstInput,true);
window.addEventListener('keydown',gateFirstInput,true);
const firstGate=renderStageGate;
renderStageGate=function(state){if(getCat(state).status!=='candidate')return `<div class="modal-layer"><section class="modal-card"><h2>いまいるネコを大切に</h2><p>複数のネコを同時に迎えると、感染症や相性の問題、お世話の負担が増えます。いまいる子を見送ってから、次の保護へ進みましょう。</p><button data-action="close-modal">もどる</button></section></div>`;return firstGate(state);};
if(checkMode&&checkScenario==='naming'){gameState={...gameState,cats:gameState.cats.map(c=>({...c,status:'intake',name:'',named:false})),campaign:{...gameState.campaign,phase:'intake',nameDraft:''},ui:{...gameState.ui,firstName:true}};}

