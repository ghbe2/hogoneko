'use strict';
// Shared production household actor runtime; review-only fixtures are isolated below.
window.HouseholdRuntime=window.HouseholdReviewRuntime=(()=>{
 const key='hogoneko_household_runtime_review_v1';
 let enabled=false,baseRender,baseDispatch,seed,points={},nodes=new Map(),rigEntries=new Map(),contexts={},busyCat=null,phoneOrigin=null;
 let actorScope=null,finishingPlay=null,lastCall=null,production=false,baseSave=null;
 function useProductionState(s){
  if(!production)return;
  const needed=!!(s.flags.returnedCat||s.household?.pendingReturn||residentCats(s).length>1);
  if(!needed&&enabled){enabled=false;points={};contexts={};nodes.clear();rigEntries.clear();phoneOrigin=null;busyCat=null;lastCall=null;}
  if(needed&&!enabled){enabled=true;points=structuredClone(s.household?.actorPoints||{});contexts=structuredClone(s.household?.actorContexts||{});for(const ctx of Object.values(contexts)){ctx.cues=[];ctx.careAnimation=null;ctx.reaction=null;ctx.holdingCat=false;}}
  app.classList.toggle('household-active',enabled);
  const ids=new Set(s.cats.map(c=>c.id));for(const id of nodes.keys())if(!ids.has(id)){nodes.delete(id);rigEntries.delete(id);delete contexts[id];delete points[id];}
 }
 const perCat=['catFocus','playRestPoint','feel','reaction','careAnimation','mealAt','purrUntil','roomCallCue','lastAffinityLog','coinDiscovery','roamIndex','usedHandItems','pickupResult','holdingCat','playMode','interactionMode'];
 function captureContext(){const ctx={};for(const k of perCat)ctx[k]=gameState.ui[k];ctx.cues=catLifeCues;return ctx;}
 function remember(){
  if(!enabled||actorScope)return;
  const id=getCat(gameState).id;contexts[id]=captureContext();
  for(const n of app.querySelectorAll('.cat-object,.household-other-cat')){
   const catId=n.querySelector('.game-cat-svg')?.dataset.catId;if(!catId)continue;
   const p=visibleRoomCatPoint(n);if(p&&Number.isFinite(p.x)&&Number.isFinite(p.y))points[catId]={...p,catId};
   nodes.set(catId,n);
   const svg=n.querySelector('.game-cat-svg'),entry=svgRigs.get(svg);if(entry)rigEntries.set(catId,entry);
  }
 }
 function store(){if(actorScope)return true;if(production){if(enabled){remember();gameState={...gameState,household:{...gameState.household,actorPoints:points,actorContexts:contexts}};}return baseSave(gameState);}if(!enabled)return true;remember();try{localStorage.setItem(key,JSON.stringify({state:gameState,points,contexts}));return true}catch{return false}}
 // Run the unchanged single-cat game against one actor. Scope lasts only for
 // this synchronous call; selected UI, input capture and other actors stay put.
 function runActor(id,work,draft){
  if(!enabled||actorScope)return work();
  const cat=gameState.cats.find(c=>c.id===id),node=nodes.get(id);if(!cat)return;
  contexts[getCat(gameState).id]=captureContext();
  const root=gameState,rootCues=catLifeCues,rootCommand=commandDraft,rootPlay=playDraft,rootCoin=coinRestPoint;
  const ctx=contexts[id]||{...captureContext(),cues:[],playRestPoint:points[id],catFocus:null,usedHandItems:{}};
  const classes=[...nodes.values()].filter(n=>n.isConnected).map(n=>[n,n.classList.contains('cat-object'),n.classList.contains('household-other-cat')]);
  const bowls=[...app.querySelectorAll('[data-hh-bowl]')].map(n=>[n,n.classList.contains('item-bowl')]);
  for(const [n]of classes){const css=getComputedStyle(n);n.style.width=css.width;n.style.height=css.height;n.classList.toggle('cat-object',n===node);n.classList.toggle('household-other-cat',n!==node);}
  for(const [n]of bowls)n.classList.toggle('item-bowl',n.dataset.hhBowl===id);
  const ui={...root.ui};for(const k of perCat)ui[k]=ctx[k]??null;ui.usedHandItems=ctx.usedHandItems||{};
  gameState={...root,cats:[cat,...root.cats.filter(c=>c.id!==id)],ui};catLifeCues=ctx.cues||[];coinRestPoint=ctx.coinRestPoint||null;
  const perActorDraft=draft||rootCommand?.householdPlays?.[id]||rootPlay?.householdPlays?.[id];
  if(perActorDraft){commandDraft=perActorDraft;playDraft=null;}
  actorScope=id;
  try{return work();}finally{
   const out=gameState,updated=captureContext();updated.coinRestPoint=coinRestPoint;contexts[id]=updated;
   const visible=node?.isConnected?visibleRoomCatPoint(node):null;if(visible)points[id]={...visible,catId:id};
   const selected=root.cats[0].id===id,restoredUI={...root.ui};if(selected)for(const k of perCat)restoredUI[k]=updated[k];
   gameState={...out,cats:root.cats.map(c=>out.cats.find(o=>o.id===c.id)||c),ui:restoredUI};
   catLifeCues=selected?updated.cues:rootCues;commandDraft=rootCommand;playDraft=rootPlay;coinRestPoint=rootCoin;actorScope=null;
   for(const [n,main,other]of classes){n.classList.toggle('cat-object',main);n.classList.toggle('household-other-cat',other);}
   for(const [n,had]of bowls)n.classList.toggle('item-bowl',had);
  }
 }
 function switchCat(id,draw=true,toolTarget=false){
  if(id===getCat(gameState).id)return true;
  if(CatRoomHold.active||(!toolTarget&&(commandDraft||playDraft))||gameState.ui.careAnimation)return false;
  const cat=gameState.cats.find(c=>c.id===id);if(!cat)return false;
  remember();const ctx=contexts[id]||{},ui={...gameState.ui};for(const k of perCat)ui[k]=ctx[k]??null;
  ui.holdingCat=false;ui.catFocus=null;ui.playRestPoint=points[id];catLifeCues=ctx.cues||[];
  // Remove the previous active node from core queries before rendering a different cat.
  const old=app.querySelector('.cat-object');if(old){const css=getComputedStyle(old);old.style.width=css.width;old.style.height=css.height;old._travelAnimation?.cancel();old.dataset.hhCat=getCat(gameState).id;old.classList.remove('cat-object');old.classList.add('household-other-cat');}
  gameState={...gameState,cats:[cat,...gameState.cats.filter(c=>c.id!==id)],ui};
  if(draw)render(gameState);else{const next=nodes.get(id);if(next){next._travelAnimation?.cancel();next.classList.remove('household-other-cat');next.classList.add('cat-object');next.dataset.action='tap-cat';}}
  store();return true;
 }
 function callChance(heart,named){const h=Math.max(0,Math.min(100,heart))/100;return named ? .35+.60*h : .35*(1-h)**2;}
 function callHousehold(){
  if(gameState.ui.modal||gameState.ui.layoutMode||CatRoomHold.active||commandDraft||playDraft)return;
  const cats=residentCats(gameState),named=cats[Math.floor(Math.random()*cats.length)];if(!named)return;
  lastCall={id:named.id,name:named.name,at:Date.now(),responses:{}};
  for(const cat of cats){
   const responds=Math.random()<callChance(cat.heart,cat.id===named.id);lastCall.responses[cat.id]=responds;
   if(responds)runActor(cat.id,()=>baseDispatch({type:'EXECUTE_CONTACT',contact:'call'}));
  }
  renderRuntime(gameState);store();
 }
 // Only spatial occupancy is new for a household. The shared game still owns
 // the movement animation, speed, jump arc and choice of behavior.
 function destination(node,from,to){
  if(!enabled||gameState.campaign.phase!=='room'||!node?.parentElement)return null;
  const id=node.querySelector('svg')?.dataset.catId,world=node.parentElement.getBoundingClientRect();
  const others=[...nodes.entries()].filter(([key,n])=>key!==id&&n.isConnected).map(([key,n])=>({point:n._householdDestination&&n._travelAnimation?.playState==='running'?n._householdDestination:visibleRoomCatPoint(n),gap:Math.max(56,(node.getBoundingClientRect().width+n.getBoundingClientRect().width)*.4)}));
  const clear=p=>others.every(o=>!o.point||Math.hypot((p.x-o.point.x)*world.width/100,(p.y-o.point.y)*world.height/100)>=o.gap);
  let result=to;
  if(!clear(to)){
   const floor=roomPlacementBounds(world.height),candidates=[];
   for(const dx of[-20,20,-30,30,0])for(const dy of[0,-7,7]){const p={...to,x:Math.max(50/world.width*100,Math.min(100-50/world.width*100,to.x+dx)),y:Math.max((floor.floorTop-28)/world.height*100,Math.min((floor.floorBottom-12)/world.height*100,to.y+dy)),surface:'floor'};if(clear(p))candidates.push(p);}
   candidates.sort((a,b)=>Math.hypot((a.x-to.x)*world.width,(a.y-to.y)*world.height)-Math.hypot((b.x-to.x)*world.width,(b.y-to.y)*world.height));
   result={...(candidates[0]||from),catId:id};
   gameState.ui={...gameState.ui,catFocus:null,playRestPoint:result};const cue=currentLifeCue();if(cue?.catId===id){cue.point=result;if(to.surface!=='floor')cue.pose='sit';}
  }
  node._householdDestination={...result};return result===to?null:result;
 }
 function renderRuntime(s){
  useProductionState(s);
  if(window.HouseholdReturn?.active)return;
  if(!enabled)return baseRender(s);
  if(actorScope){
   const node=nodes.get(actorScope),p=getCatPoint(s);
   if(node&&p){node.style.left=p.x+'%';node.style.top=p.y+'%';node.style.transform=`translate(-50%,-50%) scale(${p.scale})`;}
   return;
  }
  const picker=app.querySelector('.household-picker');
  remember();baseRender(s);
  if(picker&&s.campaign.phase==='shop'){
   app.querySelectorAll('.household-picker').forEach(n=>{if(n!==picker)n.remove()});app.append(picker);
  }
  app.querySelectorAll('.resident-selector,.resident-cat,.return-window,.renovate-home').forEach(n=>n.remove());
  const world=app.querySelector('[data-room-world]'),active=getCat(s),main=world?.querySelector('.cat-object');
  if(world&&s.campaign.phase==='room'&&active.status==='raising'){
   let goal=app.querySelector('.alpha-goal');if(!goal&&householdPlaySpaceFactor(s)<1){goal=document.createElement('div');goal.className='room-care-status alpha-goal household-space-status';app.querySelector('.stage')?.append(goal);}
   if(goal&&residentCats(s).length>1){if(!goal.classList.contains('household-space-status'))goal.prepend(document.createTextNode(active.name+'：'));if(householdPlaySpaceFactor(s)<1){const note=document.createElement('span');note.className='household-space-note';note.textContent='2匹には少し手狭です。玩具で心が育つ速さがゆっくりになっています。';goal.append(note);}}
   app.querySelectorAll('.household-pan,.pan-guide').forEach(n=>n.remove());
   if(main){main.dataset.hhCat=active.id;nodes.set(active.id,main);const p=visibleRoomCatPoint(main);if(p)points[active.id]={...p,catId:active.id};}
   for(const c of residentCats(s).filter(c=>c.id!==active.id)){
    let n=nodes.get(c.id);
    if(!n){n=document.createElement('div');n.innerHTML=renderCatArt(c);}
    if(main){const css=getComputedStyle(main);n.style.width=css.width;n.style.height=css.height;}
    n.classList.remove('cat-object');n.classList.add('household-other-cat');n.removeAttribute('data-action');n.dataset.hhCat=c.id;n.setAttribute('role','button');n.tabIndex=0;n.setAttribute('aria-label',c.name+'を撫でる・抱く');
    const p=points[c.id]||{x:72,y:73,scale:.65};if(n._travelAnimation?.playState!=='running'){n.style.left=p.x+'%';n.style.top=p.y+'%';n.style.transform='translate(-50%,-50%) scale('+p.scale+')';}world.append(n);nodes.set(c.id,n);const svg=n.querySelector('.game-cat-svg'),entry=rigEntries.get(c.id);if(entry&&entry.rig.svg===svg)svgRigs.set(svg,entry);
   }
   mountGameCats();
   const primaryCoin=app.querySelector('.discovery-pickup');if(primaryCoin)primaryCoin.dataset.hhCoin=active.id;
   for(const c of residentCats(s).filter(c=>c.id!==active.id))runActor(c.id,()=>{
    if(!discoveryScene(gameState)||currentLifeCue())return;
    const coin=document.createElement('button');coin.className='discovery-pickup';coin.dataset.hhCoin=c.id;coin.dataset.action='pick-discovery-coin';coin.innerHTML='<span class="alpha-coin">'+PAW_COIN+'</span>';coin.setAttribute('aria-label',c.name+'が遊んでいるコインを拾う');app.querySelector('.stage').append(coin);positionDiscoveryCoin();
   });
   for(const n of world.querySelectorAll('.cat-object,.household-other-cat'))n.querySelector('svg')?.removeAttribute('data-static-photo');
   // The original bowl retains its original action; another bowl uses that same
   // action after selecting its owner. No replacement feeding implementation.
   const bowl=world.querySelector('.item-bowl');if(bowl&&!s.ui.layoutMode){
    const order=[...residentCats(s)].sort((a,b)=>a.id.localeCompare(b.id));
    const x=parseFloat(bowl.style.left),y=parseFloat(bowl.style.top),height=bowl.offsetHeight,limit=roomPlacementBounds(world.clientHeight);
    order.forEach((c,i)=>{const b=c.id===active.id?bowl:bowl.cloneNode(true);b.dataset.hhBowl=c.id;b.style.left=x+'%';b.style.top=(i?Math.max(limit.floorTop,y/100*world.clientHeight-height-5)/world.clientHeight*100:y)+'%';b.style.setProperty('--portion',c.body.foodLevel/100);b.classList.toggle('filled',c.body.foodLevel>0);b.classList.toggle('empty',c.body.foodLevel<=0);b.setAttribute('aria-label',c.name+'のごはん皿');if(b!==bowl)world.append(b);});
   }
   orderDepth(world);
   for(const c of residentCats(s).filter(c=>c.id!==active.id))runActor(c.id,()=>{renderRoomFeel(gameState,app.querySelector('.stage'),nodes.get(c.id));renderDiscoveryReward(gameState,nodes.get(c.id),app.querySelector('.stage'));});
   if(lastCall&&Date.now()-lastCall.at<2200&&!s.ui.modal){app.querySelectorAll('.room-call-feedback').forEach(n=>n.remove());showRoomCallCue({...s,ui:{...s.ui,roomCallCue:{at:lastCall.at,catId:active.id}}},app.querySelector('.stage'),app.querySelector('[data-action="call-cat"]'));}
  }
  const profile=app.querySelector('.home-phone .app-profile');if(profile&&s.cats.length>1){
   const tabs=document.createElement('nav');tabs.className='household-phone-tabs';tabs.setAttribute('aria-label','表示するネコ');
   tabs.innerHTML=s.cats.slice().sort((a,b)=>a.id.localeCompare(b.id)).map(c=>'<button data-hh-phone="'+c.id+'" aria-pressed="'+(c.id===active.id)+'">'+surgeryText(c.name)+'</button>').join('');profile.querySelector('h2').replaceWith(tabs);
  }
  if(s.campaign.phase==='shop'&&s.campaign.shopId==='petshop'&&s.flags.returnedCat&&!s.household?.renovation){
   const b=document.createElement('button');b.className='renovate-home household-renovation-banner';b.innerHTML='<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M3 15 16 4l13 11M7 13v15h18V13"/><path d="M13 28V18h6v10"/></svg><span>おうちの改装</span><span aria-hidden="true">›</span>';b.onclick=renovate;app.querySelector('.store-scene:not(.is-thanks)')?.append(b);
  }
  if(s.campaign.phase==='shop'&&s.household?.renovationReceipt)showRenovationReceipt();
  if(production)window.HouseholdReturn?.mount(s);
 }
 function showRenovationReceipt(){
  if(app.querySelector('.household-renovation-receipt'))return;
  const layer=document.createElement('div');layer.className='modal-layer household-picker household-renovation-receipt';
  layer.innerHTML='<section class="menu-sheet" role="dialog" aria-modal="true" aria-labelledby="renovation-done"><h2 id="renovation-done">お部屋を広げました</h2><p>右側に、家具を置いたり遊んだりできる場所ができました。今の家具は元の場所にあります。</p><p>2匹の待つおうちへ、見にいきませんか？</p><button data-hh-home>おうちへ</button><button data-hh-continue>買い物を続ける</button></section>';
  const close=home=>{gameState={...gameState,household:{...gameState.household,renovationReceipt:false}};layer.remove();if(home)dispatch({type:'GO_HOME'});else render(gameState);store()};
  layer.querySelector('[data-hh-home]').onclick=()=>close(true);layer.querySelector('[data-hh-continue]').onclick=()=>close(false);app.append(layer);
 }
 function orderDepth(world=app.querySelector('[data-room-world]')){
  if(!world)return;[...world.querySelectorAll('.floor-placement,.cat-object,.household-other-cat')].sort((a,b)=>a.getBoundingClientRect().bottom-b.getBoundingClientRect().bottom).forEach((n,i)=>{if(!n.classList.contains('room-cat-held'))n.style.zIndex=10+i;});
 }
 function purchaseRenovation(){
  if(gameState.coins<100||gameState.household?.renovation)return;
  remember();
  const oldWidth=getWorldWidth(gameState);gameState=reduceGameState(gameState,{type:'HOUSEHOLD_RENOVATE'});
  const ratio=oldWidth/getWorldWidth(gameState),move=p=>p&&Number.isFinite(p.x)?{...p,x:p.x*ratio}:p;
  // Percentages refer to the world width. Keep existing objects at their
  // physical positions when adding floor area to the right.
  for(const id of Object.keys(points))points[id]=move(points[id]);
  for(const ctx of Object.values(contexts)){
   ctx.playRestPoint=move(ctx.playRestPoint);ctx.catFocus=move(ctx.catFocus);
   ctx.cues=(ctx.cues||[]).map(c=>({...c,point:move(c.point)}));
  }
  gameState.ui={...gameState.ui,playRestPoint:move(gameState.ui.playRestPoint),catFocus:move(gameState.ui.catFocus)};
  catLifeCues=contexts[getCat(gameState).id]?.cues||[];
  // Detached scene nodes still contain the old percentage positions. Do not
  // let a later render restore them over the converted saved coordinates.
  for(const [id,n]of nodes){n._travelAnimation?.cancel();if(points[id])n.style.left=points[id].x+'%';}
  app.querySelectorAll('.household-picker').forEach(n=>n.remove());render(gameState);store();
 }
 function renovate(){
  const l=document.createElement('div');l.className='modal-layer household-picker';l.innerHTML='<section class="menu-sheet"><h2>おうちを広くする</h2><p>2匹で暮らすには、今のお部屋は少し手狭。右側に、今の半分ほどの広さを足せます。</p><p>改装すると、玩具で心が育つ速さが元に戻ります。今の家具は、そのまま使えます。</p><p>改装費用：100コイン<br>持っているコイン：'+gameState.coins+'</p>'+(gameState.coins<100?'<p>あと'+(100-gameState.coins)+'コインで改装できます。</p>':'')+'<button data-hh-buy '+(gameState.coins<100?'disabled':'')+'>100コインで改装する</button><button data-hh-dismiss>今はやめる</button></section>';app.append(l);l.querySelector('[data-hh-dismiss]').onclick=()=>l.remove();l.querySelector('[data-hh-buy]').onclick=purchaseRenovation;
 }
 function dispatchRuntime(action){
  useProductionState(gameState);
  if(window.HouseholdReturn?.active&&action.type!=='HOUSEHOLD_RETURN')return;
  if(!enabled)return baseDispatch(action);
  if(action.type==='ROAM_CAT'&&getWorldWidth(gameState)>1)action={...action,freeWalk:Math.random()<.6};
  if(actorScope){baseDispatch(action);return;}
  if(action.type==='EXECUTE_CONTACT'&&action.contact==='call'){callHousehold();return;}
  if(action.type==='FINISH_PLAY'&&action.live&&finishingPlay){
   const children=Object.entries(finishingPlay.householdPlays),elapsed=Math.max(0,...children.map(([,d])=>d.activePlayMs||0));
   for(const [id,d]of children)runActor(id,()=>baseDispatch({...action,anchorIndex:d.liveAnchorIndex,playPoint:d.livePlayPoint,liveHeartGain:d.heartEarned,playMilliseconds:0}));
   const worn=wearToyForTime(gameState,action.itemId,elapsed);gameState={...gameState,inventory:worn.inventory,durability:worn.durability,toyWearMs:worn.toyWearMs,ui:{...gameState.ui,equippedHand:worn.inventory[action.itemId]>0?action.itemId:null}};
   renderRuntime(gameState);store();return;
  }
  if(['CLEAR_REACTION','FINISH_CARE'].includes(action.type)&&action.id){
   const field=action.type==='CLEAR_REACTION'?'reaction':'careAnimation';remember();const owner=Object.keys(contexts).find(id=>contexts[id]?.[field]?.id===action.id);
   if(owner&&owner!==getCat(gameState).id){runActor(owner,()=>baseDispatch(action));renderRuntime(gameState);store();return;}
  }
  if(action.type==='HOUSEHOLD_SELECT'){switchCat(action.id);return;}
  if(action.type==='ROAM_CAT'&&(phoneOrigin||gameState.ui.modal))return;
  if(action.type==='OPEN_OUTING'&&getCat(gameState).permanentResident){
   const rescue=residentCats(gameState).find(c=>!c.permanentResident);if(rescue)switchCat(rescue.id,false);
  }
  const before=gameState,care=before.ui.careAnimation;
  if(action.type==='FINISH_CARE'&&busyCat&&getCat(before).id!==busyCat)return;
  if(action.type==='OPEN_NOTEBOOK'){
   remember();phoneOrigin=getCat(before).id;
   for(const n of nodes.values()){const id=n.querySelector('svg')?.dataset.catId,p=points[id];n._travelAnimation?.cancel();if(p){n.style.left=p.x+'%';n.style.top=p.y+'%';}}
   gameState={...gameState,ui:{...gameState.ui,catFocus:null,playRestPoint:points[phoneOrigin]}};
  }
  baseDispatch(action);
  if(before.realClock?.processedAt&&gameState.realClock?.processedAt&&careDayKey(before.realClock.processedAt)!==careDayKey(gameState.realClock.processedAt))for(const ctx of Object.values(contexts))ctx.usedHandItems={};
  if(gameState.ui.careAnimation)busyCat=getCat(gameState).id;else busyCat=null;
  if(action.type==='FINISH_CARE'&&care?.operation==='water'){
   const water=getCat(gameState).body.waterLevel;gameState={...gameState,cats:gameState.cats.map(c=>({...c,body:{...c.body,waterLevel:water}}))};
  }
  if(action.type==='CLOSE_MODAL'&&phoneOrigin){const id=phoneOrigin;phoneOrigin=null;switchCat(id);}
  store();
 }
 function start(mode='room',cats){
  enabled=false;CatRoomHold.cancel();cancelRoomTools();nodes.clear();rigEntries.clear();contexts={};points={};busyCat=null;phoneOrigin=null;lastCall=null;
  gameState=structuredClone(seed);titleScreenOpen=false;
  gameState.cats=cats.map(c=>({...structuredClone(c),status:'raising',named:true,body:{...c.body,foodLevel:35,waterLevel:55}}));
  gameState.rooms=gameState.rooms.map(r=>({...r,cats:cats.map(c=>c.id)}));
  gameState.onboarding={...gameState.onboarding,status:'done',homeTour:'done',guide:null,appIntro:null};
  gameState.alpha={...gameState.alpha,firstCatId:'review-completed',mail:[]};gameState.flags={...gameState.flags,returnedCat:true};
  gameState.campaign={...gameState.campaign,phase:'room',requiredVisit:null};gameState.household={...gameState.household,pendingReturn:null,renovation:mode==='expanded'?1:0};
  gameState.coins=mode==='poor'?84:130;gameState.dailyDiscovery={lastDay:discoveryDay()};
  gameState.ui={...gameState.ui,modal:null,alphaNotice:null,alphaMailbox:false,layoutMode:false,careAnimation:null,holdingCat:false,catFocus:null,feel:null,reaction:null,playMode:null};
  const h=app.clientHeight||innerHeight-48,bounds=roomPlacementBounds(h),initialY=((bounds.floorTop+bounds.floorBottom)/2-12)/h*100;
  gameState.cats.forEach((c,i)=>points[c.id]={x:34+i*38,y:initialY,scale:.65,surface:'floor',distance:'near',catId:c.id});gameState.ui.playRestPoint=points[getCat(gameState).id];catLifeCues=[];
  for(const c of gameState.cats)contexts[c.id]={...structuredClone(captureContext()),playRestPoint:points[c.id],usedHandItems:{},cues:[]};
  enabled=true;app.classList.add('household-active');render=renderRuntime;dispatch=dispatchRuntime;saveGameState=store;render(gameState);store();
  scheduleRoam();
  const url=new URL(location.href);url.searchParams.set('householdLive','1');history.replaceState(null,'',url);
  if(['shop','poor'].includes(mode)){gameState.campaign={...gameState.campaign,phase:'shop',shopId:'petshop'};render(gameState);}
 }
 function attach(options={}){
  production=!!options.production;baseRender=render;baseDispatch=dispatch;baseSave=saveGameState;seed=structuredClone(gameState);
  if(production){render=renderRuntime;dispatch=dispatchRuntime;saveGameState=store;useProductionState(gameState);}
  const nativeDragStart=startGameDrag;
  startGameDrag=function(event){
   const previous=CONFIG.stage1.roomPanEnabled;
   if(enabled&&gameState.campaign.phase==='room'&&getWorldWidth(gameState)>1)CONFIG.stage1.roomPanEnabled=true;
   try{return nativeDragStart(event)}finally{CONFIG.stage1.roomPanEnabled=previous}
  };
  const nativeWindowHit=wallItemHitsWindow;
  wallItemHitsWindow=function(itemId,x,y,world){
   if(!enabled||!world)return nativeWindowHit(itemId,x,y,world);
   const factor=getWorldWidth(gameState);
   return nativeWindowHit(itemId,x*factor,y,{width:world.width/factor,height:world.height});
  };
  const nativeDaylight=daylightAt;
  daylightAt=function(...args){
   const light=nativeDaylight(...args);if(!enabled||!light)return light;
   const width=getWorldWidth(gameState);
   return {...light,x:light.x/width,polygon:light.polygon.replace(/([\d.]+)% ([\d.]+)%/g,(_,x,y)=>(Number(x)/width)+'% '+y+'%')};
  };
  const nativeObjectPoint=roomObjectCuePoint;
  roomObjectCuePoint=function(state,id,pose){
   const point=nativeObjectPoint(state,id,pose);
   if(enabled&&point&&id==='box'&&pose==='sit'){
    const box=app.querySelector('.placed-item.item-box'),world=app.querySelector('[data-room-world]');
    if(box&&world)point.y+=(box.getBoundingClientRect().height*.43-8)/world.getBoundingClientRect().height*100;
   }
   return point;
  };
  const nativeBackground=bookBackground;
  bookBackground=function(node,svg){
   // Reveal the existing wall/floor artwork to the right instead of stretching
   // the original 450-unit window across the enlarged room.
   if(enabled&&node?.matches('[data-room-world]')&&svg){const width=450*getWorldWidth(gameState);svg=svg.replace(/viewBox="[^"]+"/,'viewBox="0 0 '+width+' 760"');}
   return nativeBackground(node,svg);
  };
  const nativePlacedPoint=getPlacedPoint;getPlacedPoint=function(s,id,fallback){if(enabled&&id==='bowl'){const n=app.querySelector('[data-hh-bowl="'+getCat(s).id+'"]');if(n)return{x:parseFloat(n.style.left),y:parseFloat(n.style.top)};}return nativePlacedPoint(s,id,fallback)};
  const nativeToy=updateLiveToyPlay,nativeFollow=scheduleToyFollow,nativeClear=clearCommandDrag,nativeComplete=completeCommandDrag;
  updateLiveToyPlay=function(draft,x,y){
   if(!enabled)return nativeToy(draft,x,y);
   // A life-cue or care completion can redraw the room while the finger stays
   // down. Follow the live stage instead of measuring its detached predecessor.
   const stage=app.querySelector('.stage:has([data-room-world])');
   if(!stage||gameState.campaign.phase!=='room'||gameState.ui.modal)return;
   draft.dropElement=stage;
   if(draft.householdParent)return runActor(draft.householdId,()=>nativeToy(draft,x,y),draft);
   if(!draft.valid)return;
   draft.householdPlays ||= Object.fromEntries(residentCats(gameState).map(c=>[c.id,{...draft,householdId:c.id,householdParent:draft,followTimer:null,catAnimation:null,livePlayPoint:points[c.id],liveAnchorIndex:contexts[c.id]?.roamIndex??gameState.ui.roamIndex}]));
   for(const [id,child]of Object.entries(draft.householdPlays)){child.valid=draft.valid;child.dropElement=draft.dropElement;runActor(id,()=>nativeToy(child,x,y),child);}
  };
  scheduleToyFollow=function(draft,delay){
   if(!draft.householdParent)return nativeFollow(draft,delay);
   clearTimeout(draft.followTimer);draft.followTimer=setTimeout(()=>{const root=draft.householdParent;if(enabled&&(commandDraft===root||playDraft===root)&&root.valid)updateLiveToyPlay(draft,draft.lastClientX,draft.lastClientY)},delay);
  };
  clearCommandDrag=function(draft,accepted){for(const child of Object.values(draft.householdPlays||{}))clearTimeout(child.followTimer);return nativeClear(draft,accepted)};
  completeCommandDrag=function(draft,...args){finishingPlay=draft.householdPlays?draft:null;try{return nativeComplete(draft,...args)}finally{finishingPlay=null;for(const child of Object.values(draft.householdPlays||{}))clearTimeout(child.followTimer)}};
  const nativePhrase=roomCallPhrase;roomCallPhrase=cat=>enabled&&lastCall&&Date.now()-lastCall.at<2200?lastCall.name:nativePhrase(cat);
  window.roomActorRuntime={
   ids:()=>enabled&&gameState.campaign.phase==='room'&&!window.HouseholdReturn?.active?residentCats(gameState).filter(c=>c.status==='raising').map(c=>c.id):null,
   owns:svg=>enabled&&!!svg.closest('.cat-object,.household-other-cat'),
   run:(id,work)=>runActor(id,work),destination
  };
  window.addEventListener('pointerdown',e=>{
   if(!enabled||e.isPrimary===false)return;
   const n=e.target.closest?.('.household-other-cat');if(!n)return;
   e.preventDefault();e.stopImmediatePropagation();const id=n.dataset.hhCat;
   if(!switchCat(id))return;
   const target=app.querySelector('.cat-object');if(!target)return;
   target.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true,pointerId:e.pointerId,pointerType:e.pointerType,isPrimary:true,button:e.button,buttons:e.buttons,clientX:e.clientX,clientY:e.clientY}));
  },{capture:true,passive:false});
  window.addEventListener('click',e=>{
   const coin=e.target.closest?.('[data-hh-coin]');if(!enabled||!coin)return;
   e.preventDefault();e.stopImmediatePropagation();runActor(coin.dataset.hhCoin,()=>baseDispatch({type:'PICK_DISCOVERY_COIN'}));renderRuntime(gameState);store();
  },true);
  app.addEventListener('click',e=>{
   if(!enabled)return;const b=e.target.closest('[data-hh-phone],[data-hh-bowl],[data-action="call-cat"]');if(!b)return;
   if(b.dataset.hhPhone){e.preventDefault();e.stopImmediatePropagation();switchCat(b.dataset.hhPhone);}
   else if(b.dataset.hhBowl&&b.dataset.hhBowl!==getCat(gameState).id){e.preventDefault();e.stopImmediatePropagation();const id=b.dataset.hhBowl;if(switchCat(id))app.querySelector('[data-hh-bowl="'+id+'"]').click();}
   else if(b.dataset.action==='call-cat'&&gameState.cats.length>1){e.preventDefault();e.stopImmediatePropagation();callHousehold();}
  },true);
  window.addEventListener('beforeunload',store);
  setInterval(()=>{if(enabled&&gameState.campaign.phase==='room')orderDepth()},120);

 }
 function stop(){if(enabled){CatRoomHold.cancel();cancelRoomTools();store();}enabled=false;scheduleRoam();}
 function resume(){try{const saved=JSON.parse(localStorage.getItem(key));if(!saved?.state?.cats?.length)return false;gameState=saved.state;points=saved.points||{};contexts=saved.contexts||{};for(const ctx of Object.values(contexts)){ctx.cues=[];ctx.careAnimation=null;}gameState.ui={...gameState.ui,modal:null,careAnimation:null,holdingCat:false};enabled=true;app.classList.add('household-active');render=renderRuntime;dispatch=dispatchRuntime;saveGameState=store;catLifeCues=[];render(gameState);scheduleRoam();const url=new URL(location.href);url.searchParams.set('householdLive','1');history.replaceState(null,'',url);return true}catch(error){console.error('Household review resume',error);return false}}
 return {attach,start,stop,resume,get active(){return enabled},snapshot:()=>({state:structuredClone(gameState),points:structuredClone(points),contexts:structuredClone(contexts),lastCall:structuredClone(lastCall)})};
})();


