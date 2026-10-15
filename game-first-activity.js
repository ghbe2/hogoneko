'use strict';
const STARTER_CONTENTS={food_dry:12,mouse:1,clean_paper:24,bowl:1,water:1,litter:1,box:1};
const FIRST_FURNITURE=['bowl','water','litter','box'];
SHOP_CATALOG.push({id:'starter_set',shop:'petshop',category:'tools',label:'初心者セット',price:10,quantity:1,unit:'セット',emoji:''});
bookIcons.starter_set=`<svg viewBox="0 0 100 90"><path d="M14 28h72v48H14Z" fill="#b98b59"/><path d="M14 28L25 14h52l9 14-36 11Z" fill="#ddbe87"/><path d="M50 39v37" stroke="#91744e" stroke-width="2"/><path d="M30 47h40v20H30Z" fill="#f8eed5"/><path d="M42 58l-1-8 6 3 7-3 1 8q-6 8-13 0" fill="#7c926c"/></svg>`;
const firstBenefit=productBenefit;
productBenefit=id=>id==='starter_set'?'ごはん12食・おもちゃ・おそうじペーパー24回分と、ごはん皿・水入れ・トイレ・段ボール。':firstBenefit(id);
const firstActive=s=>s.onboarding?.flowVersion===1&&s.onboarding.status==='active';
const guideTo=(s,guide)=>({...s,onboarding:{...s.onboarding,guide}});
const hasFirstFurniture=s=>FIRST_FURNITURE.every(id=>getPlaced(getRoom(s)).some(p=>p.itemId===id));
const firstComfort=getRoomComfortBreakdown;
getRoomComfortBreakdown=function(s){const r=firstComfort(s);return firstActive(s)&&s.campaign.phase==='intake'?{...r,canExit:hasFirstFurniture(s),missingEssential:FIRST_FURNITURE.filter(id=>!getPlaced(getRoom(s)).some(p=>p.itemId===id))}:r;};
const firstReducer=reduceGameState;
reduceGameState=function(state,action){
 const first=firstActive(state),g=state.onboarding.guide,c=state.campaign,cat=getCat(state);
 if(action.type==='START_INTAKE'&&state.onboarding.flowVersion===1)return state;
 if(action.type==='FINISH_EXAM'&&c.firstExamAt&&Date.now()-c.firstExamAt<3000)return state;
 if(action.type==='FIRST_GUIDE_NEXT'){
  const spec=FIRST_GUIDES[g];if(!first||!spec?.next)return state;
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
  if(state.coins<12)return {...state,ui:{...state.ui,modal:'wallet'}};
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
  const named={...state,cats:state.cats.map(n=>n.id===cat.id?{...n,name,named:true}:n),campaign:{...c,firstCalledAt:Date.now()},ui:{...state.ui,firstName:false}};
  return firstReducer(named,{type:'CALL_INTAKE_CAT'});
 }
 if(action.type==='ACCEPT_CAT'&&first){return state.onboarding.farewellSeen?state:guideTo({...state,onboarding:{...state.onboarding,farewellSeen:true}},'farewell');}
 if(action.type==='FIRST_FINISH'&&first&&g==='farewell')return firstReducer(guideTo(state,null),{type:'ACCEPT_CAT'});
 if(action.type==='PICK_FURNITURE'&&first&&c.phase==='intake'){
  if(!owned(state,action.itemId))return state;
  return guideTo({...state,ui:{...state.ui,layoutTrayOpen:false,pendingFurniture:action.itemId}},'placeFurniture');
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
 if(action.type==='START_GAME'&&state.onboarding.status==='new'){
  const inventory=Object.fromEntries(Object.keys(next.inventory).map(id=>[id,0]));inventory.food_dry=1;inventory.starter_food=99;
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
 if(action.type==='STORE_DETAIL'&&action.id==='starter_set')next=guideTo(next,'quantity');
 if(action.type==='STORE_ADD'&&next.ui.storeCartOpen)next=guideTo(next,'purchase');
 if(action.type==='BACK_TO_TOWN'&&state.ui.storeThanks)next=guideTo(next,'homeBuilding');
 if(action.type==='TOGGLE_LAYOUT'&&next.ui.layoutMode)next=guideTo(next,'addFurniture');
 if(action.type==='TOGGLE_LAYOUT_TRAY'&&next.ui.layoutTrayOpen)next=guideTo(next,'chooseFurniture');
 return next;
};
// Carousel selection is already persisted by the field; only advance after the gesture ends.
app.addEventListener('scrollend',e=>{if(e.target.matches('.bait-carousel')&&firstActive(gameState)&&gameState.onboarding.guide==='bait'&&gameState.campaign.fieldFood==='food_dry'){gameState=guideTo(gameState,'trap');saveGameState(gameState);render(gameState);}},true);

const firstTown=renderTown;
renderTown=function(state){const t=document.createElement('template');t.innerHTML=firstTown(state);if(getCat(state).status==='intake')t.content.querySelector('.town-destination.home')?.removeAttribute('disabled');return t.innerHTML;};
const firstShop=renderMapShop;
renderMapShop=function(state){
 if(state.campaign.shopId==='clinic'&&getCat(state).status==='captured')return receptionShell(state,'clinic','こんにちは。\nまずは体調を見てみましょう。',`<div class="clinic-commands"><button data-first="exam"><strong>初診 <span>›</span></strong><small>保護したネコの検査・ワクチン</small></button><button data-clinic="examine" disabled><strong>健康チェック</strong><small>病気やケガを確認する</small></button><button data-action="go-surgery" disabled><strong>避妊手術</strong><small>TNRに向けた準備</small></button></div>`,'');
 const html=firstShop(state);
 if(state.campaign.shopId==='clinic'&&state.campaign.clinicReception&&!state.campaign.clinicExamined){const t=document.createElement('template');t.innerHTML=html;const commands=t.content.querySelector('.clinic-commands');commands?.insertAdjacentHTML('afterbegin','<button data-first="exam" disabled><strong>初診</strong><small>保護した直後の検査・ワクチン</small></button>');return t.innerHTML;}
 return html;
};
const firstPose=scenePose;
scenePose=svg=>svg.closest('.first-exam-cat')?['sleep','neutral']:firstPose(svg);
const firstClinic=renderClinic;
function firstExamArt(){const t=document.createElement('template');t.innerHTML=receptionArt('clinic');const staff=t.content.querySelector('.reception-staff');return `<svg viewBox="0 0 450 300" preserveAspectRatio="xMidYMax meet" aria-hidden="true"><path fill="#d7ddcc" d="M0 0h450v300H0Z"/><path fill="#b5c9bf" stroke="#f5efd9" stroke-width="6" d="M25 50h130v130H25Z"/><path stroke="#f5efd9" stroke-width="5" d="M90 50v130M25 115h130"/>${staff.outerHTML}</svg>`;}
renderClinic=function(state,cat){
 if(cat.status!=='captured')return firstClinic(state,cat);
 if(state.campaign.clinicStep==='exam')return renderCampaignShell(state,'動物病院',`<section class="first-exam"><div class="first-doctor">${firstExamArt()}</div><div class="first-exam-bed"></div><div class="first-exam-cat">${renderCatArt(cat).replace('200 55 320 320','190 245 310 160')}</div></section>`,'');
 const condition=cat.rescueProfile?.condition;
 return renderCampaignShell(state,'動物病院',`<section class="first-chart"><header><small>初診カルテ</small><h1>診察結果</h1></header><div class="first-chart-cat">${renderCatArt(cat)}</div><strong class="first-diagnosis">${condition?'必要な手当てをしました。':'異常はありません。'}</strong><dl class="first-chart-stats"><div><dt>毛柄</dt><dd>${cat.coatLabel||'—'}</dd></div><div><dt>体重</dt><dd>${cat.body.weight}g</dd></div><div><dt>性別</dt><dd>${cat.sex==='female'?'メス':'オス'}</dd></div></dl><section class="first-receipt"><strong>診療明細</strong><span>血液検査・ウイルス検査・ワクチン</span><b>12 コイン</b></section></section>`,`<button class="campaign-button" data-first="pay">12コインを払って、病院を出る</button>`);
};
const firstIntake=renderIntake;
renderIntake=function(state,cat){const t=document.createElement('template');t.innerHTML=firstIntake(state,cat);const call=t.content.querySelector('.intake-footer-call');if(call&&!cat.named){call.textContent='名前を決めて、呼ぶ';call.disabled=firstActive(state)&&!hasFirstFurniture(state);}return t.innerHTML;};

const FIRST_GUIDES={
 fieldHello:{target:'.encounter-trap',copy:'ネコの気配がありますね。保護器を置いて捕獲をしてみましょう。',next:'bait'},
 bait:{target:'.bait-carousel',copy:'保護器に餌を入れておびき寄せます。私が用意した「いつものカリカリ」を選んでください。',hint:'餌を横にスワイプ'},
 trap:{target:'.encounter-trap',copy:'餌を選んだので、保護器をネコがいそうなところに置いてみましょう。',hint:'保護器を上へ運ぶ'},
 trapReady:{target:'.illustrated-trap',copy:'保護器が揺れています！ネコが入ったようです。見に行ってみましょう。',hint:'保護器をタップ'},
 captured:{target:'.capture-message',copy:'保護器にネコが入りました。',next:'toClinic'},
 toClinic:{target:'[data-action="go-clinic"]',copy:'おうちに連れて帰る前に、健康状態をチェックしましょう。'},
 clinicScroll:{target:'.first-down-hint',copy:'動物病院へ行きましょう。街まで戻ります。',hint:'下にスワイプ'},
 clinicBuilding:{target:'.town-destination.clinic',copy:'動物病院はこちらです。'},
 clinicHello:{target:'.reception-heading',copy:'動物病院では、保護したネコの体調を調べたり、必要な手術ができますよ。',next:'healthCommand'},
 healthCommand:{target:'[data-clinic="examine"]',copy:'飼育中に体調が気になったら受診しましょう。',next:'surgeryCommand'},
 surgeryCommand:{target:'[data-action="go-surgery"]',copy:'落ち着いて十分大きくなったら避妊手術をしましょう。これも保護猫活動の目的の一つです。',next:'firstCommand'},
 firstCommand:{target:'[data-first="exam"]',copy:'今回は初診です。体調や様子をチェックしてもらいましょう。'},
 healthy:{target:'.first-diagnosis',copy:'健康な子でしたね。',next:'stats'},
 stats:{target:'.first-chart-stats',copy:'性別や体重なども分かりました。',next:'receipt'},
 receipt:{target:'.first-receipt',copy:'初診ではこのような検査をします。医療費を払って、連れて帰りましょう。',next:'pay'},
 pay:{target:'[data-first="pay"]',copy:'医療費は12コインです。病院を出て、迎える準備をしましょう。'},
 shopBuilding:{target:'.town-destination.petshop',copy:'ネコを飼育するために必要なものを買いに行きましょう。'},
 shopHello:{target:'.store-clerk-head',copy:'いろいろありますね。街唯一のペットショップで、すべてが揃います。',next:'tools'},
 tools:{target:'[data-tab="tools"]',copy:'最初は初心者用のセットを買いましょう。「どうぐ」にあります。'},
 starter:{target:'[data-item="starter_set"]',copy:'餌とおもちゃ、掃除道具、それにお部屋の基本的な家具が揃います。'},
 quantity:{target:'.store-detail .store-quantity',copy:'個数を選びます。今回は１セットで大丈夫です。',next:'addCart'},
 addCart:{target:'[data-store="add"]',copy:'カートに入れてください。'},
 purchase:{target:'[data-store="checkout"]',copy:'金額を確認して購入しましょう。初心者セットは10コインです。'},
 homeBuilding:{target:'.town-destination.home',copy:'これでネコの飼育を始められます。おうちにいきましょう。'},
 homeHello:{target:'.room-carrier',copy:'おじゃまします。',next:'roomExplain'},
 roomExplain:{target:'.room-carrier',copy:'まずはお部屋を整えましょう。ネコは気に入ったお部屋じゃないと、かごから出てきてくれません。',next:'layout'},
 layout:{target:'[data-action="toggle-layout"]',copy:'初心者セットに家具が入っています。「模様替え」を開きましょう。'},
 addFurniture:{target:'[data-action="toggle-layout-tray"]',copy:'置く家具を選びます。「家具を追加」を押してください。'},
 chooseFurniture:{target:()=>`[data-action="pick-furniture"][data-item="${FIRST_FURNITURE.find(id=>!getPlaced(getRoom(gameState)).some(p=>p.itemId===id))||'box'}"]`,copy:()=>`次は${getItem(FIRST_FURNITURE.find(id=>!getPlaced(getRoom(gameState)).some(p=>p.itemId===id))||'box').label}を置きましょう。`},
 placeFurniture:{target:'.room-world > .floor',copy:'好きなところに設置できます。光っている床をタップしてください。',hint:'床をタップ'},
 addMore:{target:'[data-action="toggle-layout-tray"]',copy:'水入れ、トイレ、段ボールも順番に置いてあげましょう。'},
 roomReady:{target:'.intake-footer-call',copy:'準備が整いました。あ！まだ名前を決めていませんでしたね。なんて呼ぶか決まっていますか？',next:'name'},
 name:{target:'.intake-footer-call',copy:'名前を決めて、呼んでみましょう。'},
 farewell:{target:'.intake-emerging-cat',copy:()=>`ふふ、${getCallName(getCat(gameState))}との生活、がんばってくださいね！`,finish:true}
};

const firstTownTutorial=currentTownTutorial;
currentTownTutorial=s=>firstActive(s)&&s.onboarding.guide?null:firstTownTutorial(s);
let firstFrame,firstTimer,shopExitTimer,firstMapGuide;
function fitFirstPortrait(svg){
 const inverse=svg.getCTM()?.inverse();if(!inverse)return;const points=[];
 // Measure in SVG coordinates: scene entry transforms must not shrink the portrait.
 svg.querySelectorAll('path,ellipse,circle,polygon').forEach(n=>{if(n.closest('defs,clipPath,mask'))return;for(let p=n;p&&p!==svg;p=p.parentElement){const s=getComputedStyle(p);if(s.display==='none'||s.visibility==='hidden'||Number(s.opacity)===0)return;}const r=n.getBBox(),ctm=n.getCTM();if(!ctm||(!r.width&&!r.height))return;const matrix=inverse.multiply(ctm);for(const [x,y]of [[r.x,r.y],[r.x+r.width,r.y],[r.x,r.y+r.height],[r.x+r.width,r.y+r.height]])points.push(new DOMPoint(x,y).matrixTransform(matrix));});
 if(!points.length)return;const x=Math.min(...points.map(p=>p.x)),y=Math.min(...points.map(p=>p.y)),w=Math.max(...points.map(p=>p.x))-x,h=Math.max(...points.map(p=>p.y))-y;svg.setAttribute('viewBox',`${x-5} ${y-5} ${w+10} ${h+10}`);svg.setAttribute('preserveAspectRatio','xMidYMax meet');
}
const firstRender=render;
render=function(state){
 cancelAnimationFrame(firstFrame);clearTimeout(firstTimer);clearTimeout(shopExitTimer);firstRender(state);
 const bait=app.querySelector('.bait-carousel');if(bait&&!bait.parentElement.querySelector('.bait-direction')){bait.parentElement.insertAdjacentHTML('beforeend','<span class="bait-direction is-left" aria-hidden="true"><i></i><i></i><i></i></span><span class="bait-direction is-right" aria-hidden="true"><i></i><i></i><i></i></span>');}
 if(firstActive(state)&&state.campaign.phase==='intake'&&state.campaign.intakeCalled&&!state.onboarding.farewellSeen)firstTimer=setTimeout(()=>dispatch({type:'ACCEPT_CAT'}),Math.max(0,1400-(Date.now()-(state.campaign.firstCalledAt||Date.now()))));
 const emerging=app.querySelector('.intake-emerging-cat');if(emerging&&state.campaign.firstCalledAt)emerging.getAnimations().forEach(a=>{a.currentTime=Math.min(1250,Date.now()-state.campaign.firstCalledAt)});
 app.querySelectorAll('.first-chart-cat .game-cat-svg,.intake-emerging-cat .game-cat-svg').forEach(fitFirstPortrait);
 if(state.campaign.phase==='clinic'&&getCat(state).status==='captured'&&state.campaign.clinicStep==='exam')firstTimer=setTimeout(()=>dispatch({type:'FINISH_EXAM'}),Math.max(0,3000-(Date.now()-(state.campaign.firstExamAt||Date.now()))));
 if(state.ui.storeThanks&&state.campaign.phase==='shop')shopExitTimer=setTimeout(()=>dispatch({type:'BACK_TO_TOWN'}),Math.max(0,(state.ui.storeLeaveAt||Date.now()+3000)-Date.now()));
 if(state.ui.firstName){const panel=document.createElement('div');panel.className='first-name modal-layer';panel.innerHTML=`<section><div class="first-name-cat">${renderCatArt(getCat(state))}</div><h2>この子を、なんて呼ぼう</h2><input maxlength="8" aria-label="ネコの名前" placeholder="名前を入力"><button data-first="name">名前を呼ぶ</button></section>`;panel.querySelector('input').value=state.campaign.nameDraft||'';app.append(panel);mountGameCats();return;}
 if(!firstActive(state)||titleScreenOpen)return;
 if(state.onboarding.guide==='clinicScroll'){const hint=document.createElement('div');hint.className='first-down-hint';hint.innerHTML='<span class="town-swipe-arrows"><i></i><i></i><i></i></span>';app.append(hint);}
 const spec=FIRST_GUIDES[state.onboarding.guide];if(!spec)return;
 const selector=typeof spec.target==='function'?spec.target():spec.target,target=app.querySelector(selector)||app.querySelector('.stage');if(!target)return;
 const layer=document.createElement('section');layer.className='first-guide';layer.innerHTML=`<div class="first-guide-ring"></div><aside class="first-guide-note"><header><span class="first-senior">${seniorArt()}</span><strong>せんぱい</strong></header><p></p>${spec.next||spec.finish?`<button data-first="${spec.finish?'finish':'next'}">${spec.finish?'生活をはじめる':'つぎへ →'}</button>`:`<small>${spec.hint||'光っているところをタップ'}</small>`}</aside>`;layer.querySelector('p').textContent=typeof spec.copy==='function'?spec.copy():spec.copy;app.append(layer);
 const scroller=app.querySelector('.town-map-scroll');if(state.onboarding.guide==='clinicScroll'&&scroller&&firstMapGuide!=='clinicScroll')scroller.scrollTop=scroller.clientHeight*1.5;firstMapGuide=state.onboarding.guide;
 const place=()=>{if(!layer.isConnected)return;const a=app.getBoundingClientRect();let r=target.getBoundingClientRect();if(state.onboarding.guide==='placeFurniture'){const w=app.querySelector('[data-room-world]').getBoundingClientRect(),b=roomPlacementBounds(w.height);r={left:w.left+12,top:w.top+b.floorTop,width:w.width-24,height:b.floorBottom-b.floorTop};}const note=layer.querySelector('aside'),ring=layer.querySelector('.first-guide-ring');Object.assign(ring.style,{left:r.left-a.left-5+'px',top:r.top-a.top-5+'px',width:r.width+10+'px',height:r.height+10+'px'});note.style.top=(r.top+r.height/2>a.top+a.height/2)?'10px':'auto';note.style.bottom=(r.top+r.height/2>a.top+a.height/2)?'auto':'10px';if(state.onboarding.guide==='clinicScroll'&&scroller&&scroller.scrollTop>=scroller.clientHeight*1.99){dispatch({type:'FIRST_SCROLL_DONE'});return;}firstFrame=requestAnimationFrame(place);};place();
};
app.addEventListener('click',event=>{
 const b=event.target.closest('[data-first]');if(b){const map={next:'FIRST_GUIDE_NEXT',finish:'FIRST_FINISH',exam:'FIRST_EXAM',pay:'PAY_FIRST_EXAM',name:'FIRST_NAME_CALL'};dispatch({type:map[b.dataset.first],name:app.querySelector('.first-name input')?.value});return;}
});
app.addEventListener('input',event=>{if(event.target.matches('.first-name input')){gameState={...gameState,campaign:{...gameState.campaign,nameDraft:event.target.value}};saveGameState(gameState);}});
function gateFirstInput(event){
 if(!firstActive(gameState)||titleScreenOpen||gameState.ui.firstName)return;
 const spec=FIRST_GUIDES[gameState.onboarding.guide];if(!spec||event.target.closest('.first-guide-note'))return;
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
app.addEventListener('pointerdown',gateFirstInput,true);
app.addEventListener('click',gateFirstInput,true);
const firstGate=renderStageGate;
renderStageGate=function(state){if(getCat(state).status!=='candidate')return `<div class="modal-layer"><section class="modal-card"><h2>いまいるネコを大切に</h2><p>複数のネコを同時に迎えると、感染症や相性の問題、お世話の負担が増えます。いまいる子を見送ってから、次の保護へ進みましょう。</p><button data-action="close-modal">もどる</button></section></div>`;return firstGate(state);};
if(checkMode&&checkScenario==='naming'){gameState={...gameState,cats:gameState.cats.map(c=>({...c,status:'intake',name:'',named:false})),campaign:{...gameState.campaign,phase:'intake',nameDraft:''},ui:{...gameState.ui,firstName:true}};}
