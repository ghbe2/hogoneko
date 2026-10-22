'use strict';
let roomPreparationOpen=false;
const ROOM_DRAWER_BODY_WIDTH=124;
const supplySearchMemory=new Map();
// One moving drawer: its position survives room redraws, including during care updates.
let roomDrawerPosition=0,roomDrawerMotion=null,roomDrawerFrame=0;
function roomDrawerProgress(){
 if(!roomDrawerMotion)return roomDrawerPosition;
 const t=Math.min(1,(performance.now()-roomDrawerMotion.start)/roomDrawerMotion.duration);
 roomDrawerPosition=roomDrawerMotion.from+(roomDrawerMotion.to-roomDrawerMotion.from)*(1-Math.pow(1-t,3));
 if(t===1)roomDrawerMotion=null;
 return roomDrawerPosition;
}
function paintRoomDrawer(tray=app.querySelector('.room-preparation')){const position=roomDrawerProgress();if(tray)tray.style.transform=`translateX(${(position-1)*ROOM_DRAWER_BODY_WIDTH}px)`;}
function animateRoomDrawer(){
 const from=roomDrawerProgress(),to=roomPreparationOpen?1:0;
 cancelAnimationFrame(roomDrawerFrame);
 if(matchMedia('(prefers-reduced-motion: reduce)').matches){roomDrawerMotion=null;roomDrawerPosition=to;paintRoomDrawer();return;}
 roomDrawerMotion={from,to,start:performance.now(),duration:320};
 const tick=()=>{paintRoomDrawer();if(roomDrawerMotion)roomDrawerFrame=requestAnimationFrame(tick);};tick();
}
const drawerStartCommand=startCommandDrag,drawerClearCommand=clearCommandDrag;
startCommandDrag=function(draft,x,y){
 drawerStartCommand(draft,x,y);
 const tray=app.querySelector('.room-preparation');if(!tray||!roomPreparationOpen)return;
 // Keep pointer capture alive until release; only the item follows the hand.
 roomPreparationOpen=false;tray.classList.add('folded','is-carrying');const toggle=tray.querySelector('[data-room-fold]');toggle.setAttribute('aria-expanded','false');toggle.querySelector('b').textContent='›';animateRoomDrawer();
};
clearCommandDrag=function(draft,accepted){drawerClearCommand(draft,accepted);const tray=app.querySelector('.room-preparation');if(tray){tray.classList.remove('is-carrying');tray.querySelector('.room-preparation-items').inert=!roomPreparationOpen;}};
function roomActionArt(kind){const art={app:'<rect x="22" y="10" width="28" height="47" rx="6" fill="#526f63"/><rect x="25" y="15" width="22" height="34" rx="3" fill="#fffaf0"/><path d="M36 29c-8-10-16 3 0 13 16-10 8-23 0-13" fill="#c8878d"/><path d="M32 53h8" stroke="#e8eadb" stroke-width="2"/>',layout:'<path d="M17 34V24q0-5 6-5h25q6 0 6 5v10" fill="#9daa88"/><rect x="13" y="31" width="45" height="20" rx="5" fill="#829573"/><path d="M20 51v6m31-6v6M20 37h31" stroke="#6a7a5c" stroke-width="3"/>',items:'<path d="M24 24v-6q12-13 24 0v6" fill="none" stroke="#8c765b" stroke-width="4"/><path d="M18 23h36l3 32H15Z" fill="#c5a375"/><path d="M21 27h30v17H21Z" fill="#e9d7b0"/><path d="M31 32h10v8H31Z" fill="#81947c"/>'};return `<svg class="room-action-art" viewBox="0 0 72 72" aria-hidden="true"><path d="M8 25Q10 8 31 7Q57 3 64 25Q71 49 53 61Q30 72 12 55Q2 44 8 25Z" fill="#faf0d9"/><path d="M13 55q21 15 42 2" fill="none" stroke="#d6bf96" stroke-width="2"/>${art[kind]||art.items}</svg>`;}
const adoptedRoomInterfaceRender=render;
// Menus share the drawer's inventory, but food is a separate surface.
const drawerInventory=renderInventory;
renderInventory=function(state){
 const t=document.createElement('template');t.innerHTML=drawerInventory(state);const food=state.ui.inventoryTab==='food';
 t.content.querySelector('.menu-modal')?.classList.add('room-supplies-menu',food?'room-food-menu':'room-tools-menu');
 const title=t.content.querySelector('h2');if(title)title.textContent=food?'ごはん':state.ui.inventoryTab==='clean'?'掃除道具':'おもちゃ';
 const hint=t.content.querySelector('.sheet-head small');if(hint)hint.textContent=food?'選んだごはんを、お皿へドラッグ':'使う道具を選んで持ち替え';
 t.content.querySelector('.inventory-capacity b')?.remove();
 if(food)t.content.querySelector('.inventory-tabs')?.remove();else t.content.querySelectorAll('.inventory-tabs [data-tab="food"],.inventory-tabs [data-tab="touch"]').forEach(n=>n.remove());
 const shop=t.content.querySelector('.bag-shop');if(shop)shop.dataset.tab=food?'food':state.ui.inventoryTab==='clean'?'care':'play';
 const grid=t.content.querySelector('.inventory-grid');if(grid)grid.insertAdjacentHTML('beforebegin','<label class="supply-search"><span aria-hidden="true">⌕</span><input type="search" data-supply-search placeholder="名前で探す" aria-label="持ち物を名前で探す"></label>');
 return t.innerHTML;
};
const drawerTouchTools=renderTouchTools;
renderTouchTools=function(state){const t=document.createElement('template');t.innerHTML=drawerTouchTools(state);t.content.querySelector('.menu-modal')?.classList.add('room-supplies-menu');t.content.querySelector('h2').textContent='もちもの';const shop=document.createElement('button');shop.className='bag-shop';shop.dataset.action='open-supplies';shop.dataset.tab='care';shop.textContent='ショップで買い足す →';t.content.querySelector('.inventory-grid').after(shop);return t.innerHTML;};
const callPerson=roomCallingArt;
function roomCallPhrase(cat,previous){
 const name=getCallName(cat),quiet=['、こっちだよ','、ここにいるよ','、ゆっくりでいいよ','、顔を見せて','、待ってるよ'],friendly=['、おいで！','、おいでおいで','、こっちに来る？','、一緒にいよう','、ちょっとおいで','、そばにおいで'];
 const phrases=[...quiet,...(cat.heart>=30?friendly:[]),...(cat.heart>=70?['、会いたかったよ！','、こっちこっち！','、なでなでしよう']:[])].map(s=>name+s).filter(s=>s!==previous);
 return phrases[Math.floor(Math.random()*phrases.length)];
}
// Feedback belongs to the caller, never to the cat or to general tutorial taps.
const roomCallReducer=reduceGameState;
reduceGameState=function(state,action){
 const next=roomCallReducer(state,action),calling=action.type==='EXECUTE_CONTACT'&&action.contact==='call'&&state.campaign.phase==='room'&&!state.ui.modal&&!state.ui.layoutMode&&getCat(state).status==='raising',intake=action.type==='CALL_INTAKE_CAT'&&state.campaign.phase==='intake'&&getCat(state).named;
 if(next!==state&&(calling||intake)&&(calling?getCat(next).lastCalledAt!==getCat(state).lastCalledAt:next.campaign.intakeCallCount!==state.campaign.intakeCallCount||next.campaign.intakeCalled!==state.campaign.intakeCalled))return {...next,ui:{...next.ui,roomCallCue:{at:Date.now(),catId:getCat(next).id,text:roomCallPhrase(getCat(next),state.ui.roomCallCue?.text)}}};
 return next;
};
let roomCallCueTimer=0;
function showRoomCallCue(state,stage,call){
 clearTimeout(roomCallCueTimer);const cue=state.ui.roomCallCue,elapsed=Date.now()-(cue?.at||0);if(!cue||cue.catId!==getCat(state).id||elapsed<0||elapsed>=2200||state.ui.modal)return;
 const bubble=document.createElement('output');bubble.className='room-call-feedback';bubble.setAttribute('aria-live','polite');bubble.textContent=cue.text;bubble.style.animationDelay=-elapsed+'ms';stage.append(bubble);call.classList.add('is-calling');
 roomCallCueTimer=setTimeout(()=>{bubble.remove();call.classList.remove('is-calling');},2200-elapsed);
}
function roomTravelArt(home){const cat=home?residentCats(gameState)[0]:null;return roomMapArt(home)+(cat?'<span class="home-travel-cat">'+renderCatArt(cat)+'</span>':'')+'<span class="room-travel-label">'+(home?'家へ':'街へ')+'<b aria-hidden="true">↗</b></span>';}
render=function(state){
 const oldSupply=app.querySelector('.room-supplies-menu'),oldGrid=oldSupply?.querySelector('.inventory-grid');
 if(oldSupply?.dataset.tab)supplySearchMemory.set(oldSupply.dataset.tab,{query:oldSupply.querySelector('[data-supply-search]')?.value||'',scroll:oldGrid?.scrollTop||0});
 if(state.ui.modal||state.ui.layoutMode){roomPreparationOpen=false;roomDrawerMotion=null;roomDrawerPosition=0;}
 const previousDrawer=app.querySelector('.room-preparation');
 adoptedRoomInterfaceRender(state);if(titleScreenOpen)return;
 const supply=app.querySelector('.room-supplies-menu');if(supply){const key=state.ui.inventoryTab||'touch',saved=supplySearchMemory.get(key);supply.dataset.tab=key;if(saved){const input=supply.querySelector('[data-supply-search]');if(input)input.value=saved.query;supply.querySelectorAll('.grid-cell').forEach(n=>n.hidden=!n.textContent.includes(saved.query));const grid=supply.querySelector('.inventory-grid');if(grid)grid.scrollTop=saved.scroll;}}
 const phase=state.campaign.phase,room=phase==='room',intake=phase==='intake';
 if(room||intake){
  const stage=app.querySelector('.stage,.intake-layout');if(!stage)return;stage.classList.add('new-room-ui');
  const menu=app.querySelector('.bottom-menu');
  const top=document.createElement('nav');top.className='room-icon-menu';top.setAttribute('aria-label','部屋のメニュー');
  const appButton=menu?.querySelector('[data-action="open-notebook"]')||(!intake?Object.assign(document.createElement('button'),{type:'button'}):null);if(appButton)appButton.dataset.action='open-notebook';
  if(appButton&&!intake){appButton.innerHTML=roomActionArt('app')+'<span class="label">アプリ</span>';top.append(appButton);}
  const layout=app.querySelector('.bottom-menu [data-action="toggle-layout"]')||(!state.ui.layoutMode?app.querySelector('[data-action="toggle-layout"]'):null)||document.createElement('button');layout.dataset.action='toggle-layout';layout.classList.remove('layout-tray-toggle');layout.setAttribute('aria-pressed',String(!!state.ui.layoutMode));layout.innerHTML=roomActionArt('layout')+'<span class="label">模様替え</span>';top.append(layout);
  stage.append(top);if(menu)menu.remove();
  app.querySelector('.game-frame>.controls')?.remove();
  if(!state.ui.layoutMode){
   const call=app.querySelector('[data-action="call-cat"],.intake-footer-call');
   if(call&&(!intake||getCat(state).named)){call.classList.add('room-call-icon');call.innerHTML=callPerson+'<span>よぶ</span>';stage.append(call);showRoomCallCue(state,stage,call);}
   const dock=app.querySelector('.command-dock');if(dock){
    const food=dock.querySelector('[data-tab="food"]');
    dock.querySelector('.sub-command-row')?.remove();
    const tray=previousDrawer||document.createElement('section');tray.className='room-preparation'+(roomPreparationOpen?'':' folded');tray.setAttribute('aria-label','収納棚');
    if(!roomDrawerMotion||roomDrawerMotion.to!==(roomPreparationOpen?1:0)){roomDrawerMotion=null;roomDrawerPosition=roomPreparationOpen?1:0;}
    paintRoomDrawer(tray);
    const items=document.createElement('div');items.className='room-preparation-items';
    for(const kind of ['play','clean']){
     const control=dock.querySelector(`[data-tab="${kind}"]`);if(!control)continue;
     const icon=control.querySelector('.command-emoji'),well=document.createElement('span');well.className='room-tool-well';if(icon)well.append(icon);
     const label=document.createElement('strong');label.textContent=kind==='play'?'あそぶ':'そうじ';
     const stock=control.querySelector('small');control.replaceChildren(well,label);if(stock){stock.className='room-tool-stock';well.append(stock);}
     control.dataset.equipped=kind==='play'?(state.ui.equippedHand||''):(state.ui.equippedCleaner||'');
    }
    if(food){food.classList.remove('main-command');const icon=food.querySelector('.command-emoji'),selected=getFood(state.ui.equippedFood),label=document.createElement('strong'),detail=document.createElement('small'),stock=document.createElement('span');label.textContent='ごはん';detail.textContent=selected.label;stock.className='shelf-stock';stock.textContent=selected.unlimited?'∞':'×'+(state.inventory[selected.id]||0);stock.setAttribute('aria-label',selected.unlimited?'何度でも使えます':`残り${state.inventory[selected.id]||0}皿分`);food.replaceChildren(...(icon?[icon]:[]),label,detail,stock);items.append(food);}
    const selectedTouch=TOUCH_TOOLS.find(t=>t.id===state.ui.touchMode)||TOUCH_TOOLS[0];
    const belongings=document.createElement('button');belongings.dataset.action='open-slot-menu';belongings.dataset.tab='touch';belongings.className='command-slot';belongings.innerHTML=roomActionArt('items')+'<strong>もちもの</strong><small>'+selectedTouch.label+(selectedTouch.stock?' · '+(state.inventory[selectedTouch.stock]||0)+'回':'')+'</small>';items.append(belongings);items.inert=!roomPreparationOpen;
    const toggle=document.createElement('button');toggle.dataset.roomFold='';toggle.innerHTML='<span>収納棚</span><i class="drawer-pull" aria-hidden="true"></i><b aria-hidden="true">'+(roomPreparationOpen?'‹':'›')+'</b>';toggle.setAttribute('aria-label','収納棚を開閉');toggle.setAttribute('aria-expanded',String(roomPreparationOpen));tray.replaceChildren(items,toggle);stage.append(tray);
   }
  }
  const cat=getCat(state),plan=carePlan(cat);
  if(cat.body.surgeryFoodStored!==undefined)stage.querySelectorAll('.placed-item.item-bowl').forEach(n=>n.remove());
  if(room&&!state.ui.modal&&!state.ui.layoutMode&&!firstActive(state)&&(!state.onboarding.homeTour||state.onboarding.homeTour==='done')&&state.onboarding.appIntro!=='prompt'){
   const notice=careNotice(state),waiting=plan.surgeryDay&&cat.surgery?.status!=='done'&&cat.body.days+1<=plan.surgeryDay;
   if(notice||waiting){const status=document.createElement('button');status.className='room-care-status';if(notice)status.dataset.careNotice='';else status.dataset.action='open-notebook';status.textContent=notice?.type==='ready'?'2,000gに到達。アプリで手術の予定を確認':notice?.type==='surgery'?'今日は手術の日。「街へ」から動物病院へ':notice?.type==='event'?'譲渡会の日。「街へ」から保護センターへ':cat.body.surgeryFoodStored!==undefined?'手術に備えて、ごはんはお休み':`手術の予約：${plan.surgeryDay}日目`;stage.append(status);}
  }
 }
 if(['room','town','shop'].includes(phase)&&!state.ui.modal&&!state.ui.layoutMode){
  const travel=document.createElement('button');travel.className='room-travel-icon'+(room&&state.ui.careTravelPrompt?' travel-suggested':'');travel.dataset.action=phase==='town'?'go-home':phase==='room'?'open-outing':'back-town';travel.setAttribute('aria-label',phase==='town'?'家へ':'街へ');travel.innerHTML=roomTravelArt(phase==='town');app.append(travel);if(phase==='town'){mountGameCats();travel.querySelectorAll('.game-cat-svg').forEach(svg=>{fitAlbumFace(svg);svg.dataset.staticPhoto='true';});}app.querySelectorAll('.reception-exit,.store-exit').forEach(n=>n.remove());
  const cat=getCat(state),plan=carePlan(cat),day=cat.body.days+1,visit=cat.status==='raising'&&!cat.permanentResident?(cat.surgery?.status==='done'&&plan.eventDay&&day>=plan.eventDay?'plaza':cat.surgery?.status!=='done'&&plan.surgeryDay===day?'clinic':null):null;
  if(visit&&!firstActive(state)){const target=room?travel:phase==='town'?app.querySelector('.town-destination.'+visit):null;if(target){target.classList.add('care-tap-target');target.insertAdjacentHTML('beforeend',guideHand('tap'));}}
 }
};
app.addEventListener('click',e=>{const b=e.target.closest('[data-room-fold]');if(!b)return;roomPreparationOpen=!roomPreparationOpen;const tray=b.parentElement;tray.classList.toggle('folded',!roomPreparationOpen);tray.querySelector('.room-preparation-items').inert=!roomPreparationOpen;b.querySelector('b').textContent=roomPreparationOpen?'‹':'›';b.setAttribute('aria-expanded',String(roomPreparationOpen));animateRoomDrawer();});
app.addEventListener('input',e=>{if(!e.target.matches('[data-supply-search]'))return;const query=e.target.value.trim();e.target.closest('.menu-sheet').querySelectorAll('.grid-cell').forEach(n=>n.hidden=!n.textContent.includes(query));});
