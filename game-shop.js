'use strict';
// Cart changes are previews. Only CHECKOUT_SHOP commits purchases.
const storeCart=state=>state.ui.shopCart||{};
const storeTotal=state=>Object.entries(storeCart(state)).reduce((sum,[id,n])=>sum+(productById(id)?.price||0)*n,0);
const storeCount=state=>Object.values(storeCart(state)).reduce((a,b)=>a+b,0);
function normalizeStarterCart(state){const cart=storeCart(state);return !state.flags.starterBought&&Object.hasOwn(cart,'starter_set')&&cart.starter_set!==1?{...state,ui:{...state.ui,shopCart:{...cart,starter_set:1}}}:state;}
const STORE_TABS=[['furniture','置くもの'],['play','おもちゃ'],['food','ごはん'],['care','そうじ'],['tools','どうぐ']];
const storeCategory=p=>['groom_comb','groom_wipe'].includes(p.id)?'tools':p.category;
const storeType=p=>p.id==='starter_set'?'はじめてのお世話':TYPE_LABELS[getItem(p.id)?.affinityType||getFood(p.id)?.affinityType]||({care:'おそうじ',tools:p.id==='groom_comb'?'毛のお手入れ':'からだ拭き'}[storeCategory(p)]||'お世話');
const cartIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 3h3l3 12h11l3-9H6M8 18h11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9" cy="21" r="1.5" fill="currentColor"/><circle cx="18" cy="21" r="1.5" fill="currentColor"/></svg>';
const storeCoin='<i class="store-coin" aria-label="コイン"></i>';
const storeTabIcon=id=>id==='care'?'<svg viewBox="0 0 80 80" aria-hidden="true"><rect x="8" y="40" width="51" height="23" rx="7" fill="#a6b18c"/><path d="M59 51H70V32H43V14" fill="none" stroke="#657758" stroke-width="4"/><rect x="36" y="5" width="14" height="24" rx="5" fill="#6b805a"/></svg>':storeArt(productById({furniture:'box',play:'feather',food:'food_dry',tools:'groom_comb'}[id])||{id:'groom_comb',emoji:''});
function storeAvailable(state,id){const p=productById(id);return !!p&&!(id==='starter_set'&&state.flags.starterBought)&&shopUnlocked(state,id)&&!(getItem(id)?.kind==='placed'&&owned(state,id)&&getDurability(state,id)>0);}
const storeReducer=reduceGameState;
reduceGameState=function(state,action){
 if(action.type==='STORE_DETAIL')return {...state,ui:{...state.ui,storeDetail:action.id,storeDraftCount:1,storeCartOpen:false,storeConfirm:false,shopNotice:null}};
 if(action.type==='STORE_DRAFT_COUNT'){const p=productById(state.ui.storeDetail);if(!p)return state;return {...state,ui:{...state.ui,storeDraftCount:Math.max(1,Math.min(getItem(p.id)?.kind==='placed'?1:99-(storeCart(state)[p.id]||0),(state.ui.storeDraftCount||1)+action.delta))}};}
 if(action.type==='STORE_ADD'){
  const id=state.ui.storeDetail;if(!storeAvailable(state,id))return state;
  const limit=getItem(id)?.kind==='placed'?1:99,count=Math.min(limit,(storeCart(state)[id]||0)+(state.ui.storeDraftCount||1));
  return {...state,ui:{...state.ui,shopCart:{...storeCart(state),[id]:count},storeDetail:null,storeDraftCount:1,storeCartOpen:true,shopNotice:'カート、イレタヨ！'}};
 }
 if(action.type==='STORE_BACK')return {...state,ui:{...state.ui,storeDetail:null,storeCartOpen:false,storeConfirm:false,shopNotice:null}};
 if(action.type==='STORE_CART')return {...state,ui:{...state.ui,storeDetail:null,storeCartOpen:true,storeConfirm:false,shopNotice:null}};
 if(action.type==='STORE_CONFIRM')return storeCount(state)&&storeTotal(state)<=state.coins?{...state,ui:{...state.ui,storeConfirm:true,shopNotice:null}}:state;
 if(action.type==='SHOP_TAB')return storeReducer({...state,ui:{...state.ui,storeDetail:null,storeCartOpen:false,storeConfirm:false}},action);
 if(action.type==='STORE_QUANTITY'||action.type==='BUY_SHOP_ITEM'){
  const id=action.id||action.itemId,p=productById(id);if(!p)return state;
  const delta=action.type==='BUY_SHOP_ITEM'?1:action.delta;if(delta>0&&!storeAvailable(state,id))return state;
  const cart={...storeCart(state)},limit=getItem(id)?.kind==='placed'?1:99,n=Math.max(0,Math.min(limit,(cart[id]||0)+delta));cart[id]=n;
  return {...state,ui:{...state.ui,shopCart:cart,storeConfirm:false,shopNotice:action.delta>0&&state.ui.storeDetail?'カートに入れたよ！':null}};
 }
 if(action.type==='CHECKOUT_SHOP'){
  if((!state.ui.storeCartOpen&&!state.ui.storeConfirm)||state.ui.storeThanks)return state;
  // Zero-count rows stay visible for easy restoration, but are not purchases.
  const entries=Object.entries(storeCart(state)).filter(([,n])=>n!==0);if(!entries.length)return state;
  if(entries.some(([id,n])=>!storeAvailable(state,id)||!Number.isInteger(n)||n<1||n>99||(getItem(id)?.kind==='placed'&&n!==1)))return {...state,ui:{...state.ui,shopNotice:'購入できない商品があります。カートから外してください。'}};
  if(storeTotal(state)>state.coins)return {...state,ui:{...state.ui,shopNotice:state.coins<0?'医療費の未払いがあります。残高が足りるまで購入できません。':'コインが足りません。数量を調整してください。'}};
  let next=state;for(const [id,n]of entries)for(let i=0;i<n;i++)next=storeReducer(next,{type:'BUY_SHOP_ITEM',itemId:id});
  return {...next,ui:{...next.ui,storePaidTotal:storeTotal(state),shopCart:{},storeDetail:null,storeCartOpen:false,storeConfirm:false,storeThanks:true,shopNotice:null}};
 }
 const next=storeReducer(state,action);
 const leftStore=state.campaign.phase==='shop'&&['petshop','super'].includes(state.campaign.shopId)&&(next.campaign.phase!=='shop'||next.campaign.shopId!==state.campaign.shopId);
 if(leftStore||['OPEN_MAP_SHOP','OPEN_SUPPLIES','BACK_TO_TOWN'].includes(action.type))return {...next,ui:{...next.ui,shopCart:{},storeDraftCount:1,storePaidTotal:null,shopNotice:null,storeDetail:null,storeCartOpen:false,storeConfirm:false,storeThanks:false}};
 return next;
};
function storeArt(p){
 const svg=bookIcons[p.id];
 // Inline SVG avoids a second image load and retains the authored artwork.
 if(svg){const t=document.createElement('template');t.innerHTML=svg;const root=t.content.querySelector('svg');if(root){root.setAttribute('aria-hidden','true');root.removeAttribute('width');root.removeAttribute('height');return root.outerHTML;}}
 return p.emoji;
}
function storeQuantity(state,p){const n=storeCart(state)[p.id]||0;if(p.id==='starter_set')return '';return `<div class="store-quantity"><button data-store="minus" data-id="${p.id}" aria-label="${p.label}を減らす" ${n?'':'disabled'}>−</button><span>${n}</span><button data-store="plus" data-id="${p.id}" aria-label="${p.label}をカートに追加" ${storeAvailable(state,p.id)&&!(getItem(p.id)?.kind==='placed'&&n)?'':'disabled'}>＋</button></div>`;}
function storeProducts(state){
 const products=SHOP_CATALOG.filter(p=>storeCategory(p)===(state.ui.shopTab||'furniture')).sort((a,b)=>Number(!shopUnlocked(state,a.id))-Number(!shopUnlocked(state,b.id)));
 let html='';for(let i=0;i<products.length;i+=2)html+=`<div class="store-shelf">${products.slice(i,i+2).map(p=>{const locked=!shopUnlocked(state,p.id),has=!storeAvailable(state,p.id)&&!locked;return `<button class="store-product ${locked?'is-locked':''}" data-store="detail" data-item="${p.id}" aria-label="${p.label}、${locked?'入荷待ち':has?'所持済み':p.price+'コイン'}、詳細を見る"><span class="store-art">${storeArt(p)}</span><span class="store-label"><strong class="store-product-name">${p.label}</strong><span class="store-price ${locked||has?'store-badge':''}">${locked?'入荷待ち':has?'所持済み':storeCoin+p.price}</span></span></button>`}).join('')}</div>`;
 return html;
}
function storeSpeech(state){
 if(state.ui.storeThanks)return 'アリガト！ マタ、キテネ！';
 if(state.ui.shopNotice)return state.ui.shopNotice;
 if(state.ui.storeConfirm)return 'コレ、カウ？ イイ？';
 if(state.ui.storeCartOpen)return 'カズ、ダイジョブ？';
 const p=productById(state.ui.storeDetail);if(p)return !storeAvailable(state,p.id)?(!shopUnlocked(state,p.id)?'マダ、マッテテ！':'ソレ、モッテル！'):({furniture:'ココ、オチツク！ ネコノ バショ！',play:'アソボ！ アソボ！',food:'イイ ニオイ！ ゴハン！',care:'キレイ、キレイ！',tools:'ヤサシク、ソーットネ！'}[storeCategory(p)]);
 return {furniture:'ネコノ バショ！ エランデ！',play:'オモチャ！ アソボ！',food:'ゴハン！ オイシイヨ！',care:'オソウジ！ ピカピカ！',tools:'オテイレ！ ヤサシクネ！'}[state.ui.shopTab||'furniture'];
}
function storeContent(state){
 const p=productById(state.ui.storeDetail);
 if(state.ui.storeConfirm)return `<header class="store-heading"><strong>最後の確認</strong></header><div class="store-confirm"><h2>${storeCount(state)}点を購入しますか？</h2><p>合計 <strong>${storeCoin} ${storeTotal(state)}</strong></p><p>購入後のコイン　${storeCoin} ${state.coins-storeTotal(state)}</p></div>`;
 if(p)return `<header class="store-heading"><strong>商品を見る</strong></header><div class="store-detail"><div class="store-detail-lead"><div class="store-art">${storeArt(p)}</div><div><h2>${p.label}</h2><p>${storeCoin} ${p.price} · ${storeType(p)}</p><p>${p.quantity}${p.unit} / 所持 ${Number(state.inventory[p.id])||0}${p.unit}</p></div></div><p>${productBenefit(p.id)}</p><div class="store-quantity"><button data-store="draft-minus" aria-label="入れる個数を減らす" ${(state.ui.storeDraftCount||1)>1?'':'disabled'}>−</button><span>${state.ui.storeDraftCount||1}</span><button data-store="draft-plus" aria-label="入れる個数を増やす" ${getItem(p.id)?.kind==='placed'||(state.ui.storeDraftCount||1)>=99-(storeCart(state)[p.id]||0)?'disabled':''}>＋</button></div></div>`;
 if(state.ui.storeCartOpen)return `<header class="store-heading"><strong>カートを確認</strong></header><div class="store-list store-cart-list">${Object.entries(storeCart(state)).map(([id,n])=>{const p=productById(id);return p?`<article><span class="store-art">${storeArt(p)}</span><div><strong>${p.label}</strong><p>${storeCoin} ${p.price*n} · ${p.quantity*n}${p.unit}</p>${storeQuantity(state,p)}</div></article>`:'';}).join('')||'<p>まだ何も入っていません。</p>'}</div>`;
 return `<nav class="release-shop-tabs" aria-label="商品カテゴリ">${STORE_TABS.map(([id,label])=>`<button data-action="shop-tab" data-tab="${id}" aria-label="${label}" title="${label}" aria-pressed="${(state.ui.shopTab||'furniture')===id}"><span class="store-tab-art">${storeTabIcon(id)}</span><span class="store-tab-caption">${label}</span></button>`).join('')}</nav><div class="store-list store-grid">${storeProducts(state)}</div>`;
}
const storeMapShop=renderMapShop;
function storeBackground(state){
 const t=document.createElement('template');t.innerHTML=bookScene('petshop',state);const svg=t.content.querySelector('svg');
 const ns='http://www.w3.org/2000/svg',group=cls=>{const g=document.createElementNS(ns,'g');g.setAttribute('class',cls);return g};
 const rabbit=svg.querySelector('ellipse[cx="113"][cy="370"]');
 if(rabbit){const g=group('store-rabbit');g.setAttribute('transform','translate(37 117) scale(.7)');g.setAttribute('aria-label','耳を動かすウサギ');g.innerHTML=`<ellipse cx="118" cy="392" rx="39" ry="4" fill="#aa9671" opacity=".22"/>
 <g class="store-rabbit-body"><path d="M88 371L78 367 74 375 80 384 91 382Z" fill="#eee4cc"/>
 <path d="M84 376L91 356 109 347 130 352 142 375 137 389 96 391 84 384Z" fill="#b7ad8f"/><path d="M91 357L106 351 117 355 108 364 91 369Z" fill="#c9c0a3"/>
 <path d="M104 370L97 380 102 390 124 390 128 386 112 383" fill="#a49b80"/><path d="M125 363L135 367 141 387 135 392 120 391 119 387 129 385Z" fill="#e6dcc2"/>
 <g class="store-rabbit-head"><g class="store-rabbit-ear"><path d="M120 341L109 313 110 297 116 294 122 302 130 337Z" fill="#b7ad8f"/><path d="M119 330L114 311 114 302 117 308 124 333Z" fill="#c99d8e"/></g>
 <path d="M130 337L132 306 138 297 143 299 145 310 139 342Z" fill="#d1c7aa"/><path d="M135 331L136 311 140 304 140 316 138 334Z" fill="#c99d8e"/>
 <path d="M113 339L129 332 145 336 151 348 160 357 151 366 131 369 117 360 111 350Z" fill="#d1c7aa"/><path d="M145 350L160 357 151 366 136 365 138 357Z" fill="#eee4cc"/>
 <g class="store-rabbit-eye"><path d="M135 344Q141 341 146 345L144 350Q138 351 135 347Z" fill="#ede5c9"/><ellipse cx="141" cy="346" rx="2.6" ry="3.5" fill="#303b33"/></g>
 <path class="store-rabbit-nose" d="M155 354L161 356 157 359Z" fill="#bd8b7d"/><path d="M156 359L154 363 150 363" fill="none" stroke="#786d5d" stroke-width="1"/><path d="M148 357L137 354M148 361L136 363" stroke="#9b9e91" stroke-width="1"/></g></g>`;
 rabbit.before(g);svg.querySelectorAll('ellipse[cx="113"][cy="370"],ellipse[cx="129"][cy="344"],ellipse[cx="123"][cy="318"],ellipse[cx="139"][cy="321"],circle[cx="138"][cy="344"]').forEach(n=>n.remove());}
 // Match the reception staff's head/torso proportions; keep the shoulders above the counter.
 const clerk=svg.querySelector('.shop-clerk');if(clerk){clerk.setAttribute('transform','translate(305 350)');clerk.innerHTML=`
 <path class="store-clerk-torso" d="M-44 86L-38 34Q-33 20-13 19L15 19Q35 21 40 34L46 86Z" fill="#9eae95"/>
 <path d="M-10 11L-10 24 1 35 12 23 12 10Z" fill="#bd916d"/>
 <path d="M-24 23L-17 43 18 43 26 24 33 86-30 86Z" fill="#667d59"/>
 <path d="M-18 58H20V77H-17Z" fill="#788c68"/><rect x="-11" y="48" width="24" height="9" rx="1" fill="#eee4c9"/><path d="M-6 52H7" stroke="#9c9d7b" stroke-width="1.5"/>
 <g class="store-clerk-head"><path d="M-26-19Q-29-42-5-45Q21-46 27-24L25-4 17 11Q3 24-13 12L-24-2Z" fill="#c59c78"/>
 <path d="M-25-6L-31-22-27-38-15-45-4-44 5-49 22-43 29-31 28-12 19-24 11-20 0-31-10-23-19-27Z" fill="#505344"/>
 <path class="store-clerk-eyes" d="M-17-8L-9-9M8-9L16-8" fill="none" stroke="#505344" stroke-width="2.3" stroke-linecap="round"/>
 <path d="M-2-6L-4 1 1 2" fill="none" stroke="#ad7e5e" stroke-width="1.3"/><path d="M-7 7Q1 13 9 6" fill="none" stroke="#765640" stroke-width="1.7" stroke-linecap="round"/></g>
 <g class="store-bird-perch"><g class="shoulder-bird">
 <path d="M38 20L52 44 46 42 43 46 32 23Z" fill="#697e55"/><path d="M27-5L40-7 48 4 46 20 38 27 28 21 24 10Z" fill="#b4bc7d"/>
 <path d="M26-7L25-17 29-23 38-25 44-18 43-8 36-1Z" fill="#e5ce84"/><path d="M29-21L28-29 33-24 36-30 38-24" fill="#d8c277"/>
 <path d="M26-14L20-10 25-6 28-9Z" fill="#b58d58"/><path d="M28-16Q31-19 34-16L33-12 29-12Z" fill="#ede6c9"/><ellipse cx="30.5" cy="-15" rx="1.5" ry="2" fill="#303b33"/>
 <path d="M35-10L40-11 42-6 38-4 34-6Z" fill="#c98e66"/>
 <path class="store-bird-wing" d="M40 1L47 6 45 24 36 16 34 5Z" fill="#7c9163"/><path d="M38 9L42 17M40 6L44 13" stroke="#a5b27d" stroke-width="1.2"/>
 </g><path d="M32 24L31 29 27 29M39 25L39 30 35 30" fill="none" stroke="#8f7954" stroke-width="1.6" stroke-linecap="round"/></g>`;
 const hand=group('store-clerk-hand');hand.innerHTML='<path d="M-25 88Q-44 87 -49 105L-30 105 -10 90" fill="#9eae95"/><path d="M-49 104Q-42 96 -31 102L-17 106Q-12 112 -22 115L-46 114Z" fill="#bd916d"/>';clerk.append(hand);}
 const register=svg.querySelector('.register');if(register){const hand=clerk?.querySelector('.store-clerk-hand');if(hand){const arm=group('store-counter-arm');arm.setAttribute('transform','translate(305 322)');arm.append(hand);register.before(arm);}register.querySelectorAll('text').forEach(n=>n.remove());const face=group('store-register-face');face.innerHTML='<circle cx="-19" cy="-44" r="5" fill="#edd083" stroke="#b48b40" stroke-width="1.5"/><text class="store-register-total" x="5" y="-40" text-anchor="middle" font-family="Meiryo,sans-serif" font-size="10" fill="#40513a">—</text><path class="store-register-receipt" d="M13 5V-11L16-9 19-11 22-9 25-11 28-9V5Z" fill="#fff3d7"/><g class="store-register-drawer"><path d="M-35 14L30 12 32 20 -36 22Z" fill="#55614e"/><path d="M-11 17L7 16" stroke="#c6d1b8" stroke-width="2"/></g>';register.append(face);}
 // The authored shop ends at y=760. Do not include empty coordinates below its floor.
 svg.setAttribute('viewBox','0 200 450 560');svg.setAttribute('preserveAspectRatio','xMidYMin slice');return svg.outerHTML;
}
renderMapShop=function(state){
 if(!['petshop','super'].includes(state.campaign.shopId))return storeMapShop(state);
 const count=storeCount(state),total=storeTotal(state),cart=state.ui.storeCartOpen,confirm=state.ui.storeConfirm,thanks=state.ui.storeThanks,p=productById(state.ui.storeDetail);
 const addDisabled=p&&(!storeAvailable(state,p.id)||(storeCart(state)[p.id]||0)>=(getItem(p.id)?.kind==='placed'?1:99));
 const exit=`<button class="store-exit" data-action="back-town">← ${['room','intake'].includes(state.campaign.shopReturnPhase)?'おうちへ戻る':'街へ戻る'}</button>`;
 const panel=thanks?'<section class="store-farewell" aria-label="お買い物を終えて街へ戻ります"></section>':`<section class="store-panel ${state.ui.storeDetail?'is-detail':''}" aria-label="お買い物">${storeContent(state)}<footer class="store-footer"><button class="store-primary" data-store="${p?'add':cart||confirm?'checkout':'cart'}" ${addDisabled||cart&&(!count||total>state.coins)?'disabled':''}>${p?(addDisabled?'追加できません':'カートに入れる · '+storeCoin+p.price*(state.ui.storeDraftCount||1)):cart||confirm?'コイン '+total+' で購入する':cartIcon+'カートを見る'+(count?'（'+count+'）':'')}</button>${p&&!confirm?'<button class="store-primary" data-store="back">カートに入れずに戻る</button>':(cart||confirm)?'<button class="store-primary" data-store="back">ショッピングを続ける</button>':''}</footer></section>`;
 return renderCampaignShell(state,'ペットショップ',`<div class="store-scene ${thanks?'is-thanks':''}"><div class="store-background" data-season="${state.season}" aria-label="店員のいるペットショップ">${storeBackground(state)}</div>${thanks?'':exit}<p class="store-bird-speech" role="status" aria-label="${storeSpeech(state)}"><span aria-hidden="true"></span></p>${panel}</div>`,'');
};
app.addEventListener('click',event=>{const b=event.target.closest('[data-store]');if(!b||b.disabled)return;const type={add:'STORE_ADD','draft-plus':'STORE_DRAFT_COUNT','draft-minus':'STORE_DRAFT_COUNT',leave:'BACK_TO_TOWN',detail:'STORE_DETAIL',back:'STORE_BACK',cart:'STORE_CART',confirm:'STORE_CONFIRM',checkout:'CHECKOUT_SHOP',plus:'STORE_QUANTITY',minus:'STORE_QUANTITY'}[b.dataset.store];if(type)dispatch({type,id:b.dataset.id||b.dataset.item,delta:['minus','draft-minus'].includes(b.dataset.store)?-1:1});});
const storeRender=render;let storeViewKey=null;
let storeBoundsObserver=null,storeViewportCleanup=null;
function fitStoreViewport(){
 storeBoundsObserver?.disconnect();storeViewportCleanup?.();
 const scene=app.querySelector('.store-scene');if(!scene)return;
 const screen=scene.closest('.campaign-screen');
 const fit=()=>{
  if(!scene.isConnected)return;
  const box=screen.getBoundingClientRect(),viewport=window.visualViewport;
  let bottom=Math.min(window.innerHeight,viewport?viewport.offsetTop+viewport.height:window.innerHeight);
  for(let parent=screen;parent;parent=parent.parentElement){
   const style=getComputedStyle(parent);
   if(parent===app||/(hidden|clip|auto|scroll)/.test(style.overflowY))bottom=Math.min(bottom,parent.getBoundingClientRect().bottom);
  }
  // Convert viewport pixels back to CSS coordinates, including scaled previews.
  const scale=box.height/screen.clientHeight||1;
  const height=Math.max(0,(bottom-box.top)/scale);scene.style.height=height+'px';
  const panel=scene.querySelector('.store-panel'),guided=typeof firstActive==='function'&&firstActive(gameState)&&!!gameState.onboarding.guide;
  // Keep the category row/cart heading below the shared conversation, not behind it.
  if(panel)panel.style.top=guided?Math.max(height*.31,(app.getBoundingClientRect().top-box.top)/scale+12+GUIDE_NOTE_HEIGHT+12)+'px':'';
 };
 storeBoundsObserver=new ResizeObserver(fit);storeBoundsObserver.observe(screen);storeBoundsObserver.observe(app);
 window.visualViewport?.addEventListener('resize',fit);window.addEventListener('resize',fit);
 storeViewportCleanup=()=>{window.visualViewport?.removeEventListener('resize',fit);window.removeEventListener('resize',fit);};
 fit();
}

let storeSpeechKey=null,storeSpeechStart=0,storeSpeechTimer=null;
function storeCaptureMotion(root){return {at:performance.now(),animations:(root?.getAnimations({subtree:true})||[]).map(a=>({target:a.effect.target,name:a.animationName,time:a.currentTime}))};}
function storeRestoreMotion(snapshot){const elapsed=performance.now()-snapshot.at;for(const saved of snapshot.animations){if(!saved.target.isConnected||saved.time===null)continue;const animation=saved.target.getAnimations().find(a=>a.animationName===saved.name);if(animation)animation.currentTime=saved.time+elapsed;}}
const storeListPositions=new Map();
function storePresentation(state,key,previousBackground){
 const scene=app.querySelector('.store-scene');if(!scene){clearInterval(storeSpeechTimer);storeSpeechTimer=null;storeSpeechKey=null;return;}
 const fresh=scene.querySelector('.store-background');
 // Retain actor nodes across periodic renders: ambient animation must not restart.
 if(previousBackground&&previousBackground.dataset.season===fresh.dataset.season)fresh.replaceWith(previousBackground);
 const total=state.ui.storeThanks?state.ui.storePaidTotal:storeTotal(state);
 const display=scene.querySelector('.store-register-total');display.textContent=total?String(total):'—';
 const background=scene.querySelector('.store-background');background.classList.toggle('store-checkout',!!state.ui.storeThanks);
 app.querySelectorAll('.store-product .store-art svg').forEach(svg=>{const b=svg.getBBox();if(b.width&&b.height){svg.setAttribute('viewBox',`${b.x-2} ${b.y-2} ${b.width+4} ${b.height+2}`);svg.setAttribute('preserveAspectRatio','xMidYMax meet')}});
 const text=storeSpeech(state),speechKey=key+':'+text;
 if(speechKey!==storeSpeechKey){storeSpeechKey=speechKey;storeSpeechStart=performance.now();}
 clearInterval(storeSpeechTimer);
 const update=()=>{const node=app.querySelector('.store-bird-speech>span');if(!node){clearInterval(storeSpeechTimer);return;}
  const length=matchMedia('(prefers-reduced-motion:reduce)').matches?text.length:Math.min(text.length,Math.floor((performance.now()-storeSpeechStart)/65));
  node.textContent=text.slice(0,length);background.classList.toggle('store-speaking',length<text.length);
  if(length===text.length){clearInterval(storeSpeechTimer);storeSpeechTimer=null;}
 };
 storeSpeechTimer=setInterval(update,40);update();
}
render=function(state){
 const previousBackground=app.querySelector('.store-background'),motion=storeCaptureMotion(previousBackground),oldList=app.querySelector('.store-list');
 if(storeViewKey&&oldList)storeListPositions.set(storeViewKey,oldList.scrollTop);
 const key=state.campaign.phase==='shop'?`${state.campaign.shopId}:${state.ui.storeDetail||''}:${!!state.ui.storeCartOpen}:${!!state.ui.storeConfirm}:${!!state.ui.storeThanks}:${state.ui.shopTab}`:null;
 storeRender(state);const list=app.querySelector('.store-list');if(list)list.scrollTop=storeListPositions.get(key)||0;
 storeViewKey=key;fitStoreViewport();storePresentation(state,key,previousBackground);storeRestoreMotion(motion);
 if(!key)storeListPositions.clear();
 if(state.ui.storeCartOpen&&storeTotal(state)>state.coins&&!app.querySelector('.store-notice')){const note=document.createElement('p');note.className='store-notice';note.textContent=state.coins<0?`医療費の未払い ${-state.coins} コイン。購入にはあと ${storeTotal(state)-state.coins} コイン必要です`:`あと ${storeTotal(state)-state.coins} コイン足りません`;app.querySelector('.store-footer')?.before(note);}
};
const storeStyle=document.createElement('style');storeStyle.textContent=`
#app .campaign-screen:has(.store-scene){position:relative;padding:0;min-height:0}#app .campaign-scroll:has(>.store-scene){position:absolute;inset:0;display:block;padding:0}#app .campaign-screen:has(.store-scene)>.campaign-actions{display:none}
.store-scene{position:absolute;left:0;right:0;top:0;isolation:isolate}.store-background{position:absolute;inset:0;z-index:-1;background:#ddc8a4}.store-background>svg{display:block;width:100%;height:100%;object-fit:cover}
.store-exit{position:absolute;left:10px;top:8px;border:1px solid #f7ead0;border-radius:9px;padding:8px 12px;min-height:44px;background:#65583f;color:#fff9ed;font-size:13px;font-weight:600;box-shadow:0 2px 0 #4d432c}
.store-bird-speech{font-family:var(--game-font);position:absolute;left:128px;right:12px;top:8px;width:auto;height:58px;margin:0;padding:9px 13px;background:#f0e1ae;border:1px solid #d5bc7c;border-radius:18px 21px 16px 7px;box-shadow:0 2px 0 #8f814a25;color:#40593b;font-size:13px;letter-spacing:.02em;line-height:19px;pointer-events:none}.store-bird-speech:after{content:'';position:absolute;right:21px;bottom:-12px;width:19px;height:14px;background:#f0e1ae;clip-path:polygon(0 0,100% 0,85% 100%)}
.store-panel{font-family:var(--game-font);position:absolute;left:8px;right:8px;bottom:max(18px,env(safe-area-inset-bottom));top:31%;display:flex;flex-direction:column;gap:8px;padding:10px 8px 8px;border:1px solid #fff7e8;border-radius:22px;background:#fff9ee;box-shadow:0 6px 22px #56483325;min-height:0}.store-panel button{font-family:inherit}.store-panel .release-shop-tabs{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));flex:none;gap:5px}.store-panel .release-shop-tabs button{height:54px;padding:4px 1px;letter-spacing:0;min-width:0;white-space:nowrap;border-radius:13px;background:#f0e5cf;color:#705c46;border:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px}.store-panel .release-shop-tabs button[aria-pressed=true]{background:#738465;color:white}.store-tab-art{display:block;width:29px;height:29px}.store-tab-art svg,.store-tab-art img{display:block;width:100%;height:100%;object-fit:contain}.store-tab-caption{font-size:10px;line-height:12px;height:12px}.release-shop-tabs button[aria-pressed=false] .store-tab-caption{visibility:hidden}
.store-list{overflow-y:auto;min-height:0;flex:1;overscroll-behavior:contain;touch-action:pan-y;scrollbar-width:thin;scrollbar-color:#c4ae89 transparent}.store-grid{display:block;padding:2px 1px 8px}.store-shelf{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;position:relative;padding-bottom:6px;margin-bottom:10px}.store-shelf:after{content:'';height:6px;position:absolute;bottom:0;left:0;right:0;background:#c6a373;border-top:2px solid #dcc096;border-radius:2px;box-shadow:0 2px 1px #95744726;pointer-events:none}.store-product{display:block;position:relative;height:114px;padding:0;border:0;border-radius:0;background:transparent;text-align:left;color:#554936}.store-product>.store-art{position:absolute;left:8px;bottom:0;width:68px;height:60px;z-index:2;transition:transform .15s}.store-product>.store-art svg{overflow:visible}.store-label{position:absolute;top:4px;left:22px;right:4px;height:92px;min-width:0;padding:8px;background:#fffdf5;border:1px solid #daccac;border-radius:14px;box-shadow:0 2px 0 #dfcfaf66;transition:background .15s,border-color .15s}.store-label:before{content:'';position:absolute;left:18px;bottom:-5px;width:8px;height:8px;background:inherit;border-right:1px solid #daccac;border-bottom:1px solid #daccac;transform:rotate(45deg)}.store-product .store-product-name{display:block;height:38px;line-height:19px;font-size:13px;font-weight:600;overflow-wrap:anywhere;letter-spacing:0}.store-price{position:absolute;right:7px;bottom:8px;display:inline-flex;align-items:center;gap:5px;padding:4px 5px;min-height:25px;border-radius:7px;background:#f3e2b9;font-size:13px;line-height:17px;font-weight:600;letter-spacing:0;white-space:nowrap}.store-badge{background:#e0e6d2;color:#586b48;font-size:11px;padding-inline:2px}.store-coin{display:inline-block;width:13px;height:13px;border:2px solid #ac7c2b;background:#efd582;border-radius:50%;vertical-align:-1px;flex:none}.store-product:hover .store-label,.store-product:focus-visible .store-label{background:#f2edd7;border-color:#91a078}.store-product:active .store-label{background:#e0e8cf}.store-product:hover>.store-art,.store-product:active>.store-art{transform:translateY(-3px)}.store-product:focus-visible{outline:2px solid #637d56;outline-offset:-2px;border-radius:12px}.store-product.is-locked .store-art{opacity:.5}.store-product.is-locked .store-badge{background:#eee5d4;color:#7b715d}
.store-art{display:flex;align-items:center;justify-content:center;width:100%;height:66px;flex-shrink:0;font-size:36px}.store-art>svg,.store-art>img{display:block;max-width:100%;width:100%;height:100%;object-fit:contain}.store-heading{display:flex;align-items:center;gap:14px;flex:none;font-size:14px}.store-heading button,.store-footer button,.store-add,.store-farewell button{min-height:44px;border:0;border-radius:24px;padding:8px 12px;background:#eee2ca;color:#68543c;font-size:13px}.store-footer{display:flex;flex-direction:column;gap:8px;flex:none}.store-panel.is-detail .store-footer{flex-direction:column}.store-panel.is-detail .store-footer .store-primary{flex:none;width:100%}.store-footer .store-primary,.store-add,.store-farewell button{flex:1;background:#657e58;color:white;display:flex;justify-content:center;align-items:center;gap:8px}.store-primary svg{width:20px;height:20px}.store-footer button:disabled,.store-add:disabled{opacity:.45}
.store-panel.is-confirm{top:auto;min-height:0}.store-detail{font-size:13px;flex:1;display:flex;flex-direction:column;justify-content:center;text-align:center;gap:8px;min-height:0}.store-detail-lead{display:flex;flex-direction:column;align-items:center;gap:10px}.store-detail-lead>.store-art{width:110px;height:100px}.store-detail .store-quantity{justify-content:center}.store-detail h2{font-size:16px;margin:0}.store-detail p{margin:7px 0;line-height:1.5}.store-add{width:100%;margin-top:10px}
.store-quantity{display:flex;align-items:center;justify-content:flex-start;gap:12px}.store-quantity button{width:44px;min-height:44px;border:1px solid #dbceb5;border-radius:50%;background:#f5ecd9;color:#655441;font-size:20px}.store-quantity span{min-width:20px;text-align:center;font-size:16px}.store-quantity button:disabled{opacity:.35}.store-cart-list article{display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid #ded2bd;font-size:13px}.store-cart-list article>.store-art{width:52px;height:52px}.store-cart-list article>div{flex:1}.store-cart-list p{margin:4px 0}.store-notice{margin:0;font-size:12px;line-height:1.5;flex:none}.store-confirm{text-align:center;padding:16px 0;font-size:14px}.store-confirm h2{font-size:18px}
.store-farewell{position:absolute;bottom:24px;left:16px;right:16px;padding:18px;border-radius:20px;background:#fff9eeed;text-align:center;font-size:14px}.store-farewell button{width:100%}
@media(min-width:360px){.store-product{height:122px}.store-product>.store-art{left:12px;width:88px;height:68px}.store-product .store-label{left:30px;height:100px}}
.store-clerk-head{transform-origin:0px 16px;animation:store-head 6s ease-in-out infinite;transform-box:view-box}.store-clerk-eyes{transform-origin:0px -8px;animation:store-blink 7.9s infinite}.shoulder-bird{transform-origin:35px 25px;animation:store-bird 6.7s ease-in-out infinite}.store-bird-wing{transform-origin:40px 2px;animation:store-wing 8.3s ease-in-out infinite}.store-rabbit-ear{transform-origin:126px 337px;animation:store-ear 5.3s ease-in-out infinite}.store-rabbit-eye{transform-origin:141px 346px;animation:store-blink 6.7s infinite}.store-rabbit-nose{transform-origin:155px 356px;animation:store-sniff 5.3s infinite}.store-rabbit-head{transform-origin:126px 360px;animation:store-rabbit-look 8.7s ease-in-out infinite}.store-speaking .store-bird-wing{animation:store-speaking .65s ease-in-out infinite}.store-clerk-hand{transform-origin:-28px 65px}.store-checkout .store-clerk-hand{animation:store-ring 1.2s ease-in-out both}.store-checkout .store-clerk-head{animation:store-thanks 1.6s ease-in-out both}.store-checkout .store-register-drawer{animation:store-drawer 1.6s ease-in-out both}.store-checkout .store-register-receipt{animation:store-receipt 1.5s ease-out both}
@keyframes store-head{0%,40%,58%,100%{transform:rotate(0)}46%,51%{transform:rotate(-3deg)}}@keyframes store-blink{0%,34%,38%,73%,77%,100%{transform:scaleY(1)}36%,75%{transform:scaleY(.12)}}@keyframes store-bird{0%,21%,37%,100%{transform:rotate(0)}26%,31%{transform:rotate(-7deg)}}@keyframes store-wing{0%,65%,81%,100%{transform:rotate(0)}70%,76%{transform:rotate(13deg)}}@keyframes store-ear{0%,30%,42%,64%,72%,100%{transform:rotate(0)}33%,38%{transform:rotate(-9deg)}67%{transform:rotate(6deg)}}@keyframes store-sniff{0%,60%,76%,100%{transform:translateY(0)}64%,71%{transform:translateY(-1px)}}@keyframes store-rabbit-look{0%,52%,72%,100%{transform:rotate(0)}58%,66%{transform:rotate(4deg)}}@keyframes store-speaking{50%{transform:rotate(-6deg)}}@keyframes store-ring{35%,65%{transform:rotate(12deg)}}@keyframes store-thanks{35%,65%{transform:translateY(3px) rotate(4deg)}}@keyframes store-drawer{30%,65%{transform:translateY(6px)}}@keyframes store-receipt{from{transform:translateY(9px)}to{transform:translateY(0)}}
@media(prefers-reduced-motion:reduce){.store-background *{animation:none!important}.store-product *{transition:none!important}.store-product:hover>.store-art,.store-product:active>.store-art{transform:none}}
@media(max-height:650px){.store-bird-speech{top:0;height:50px;padding:5px 13px}.store-bird-speech:after{right:12px}.store-detail{gap:2px}.store-detail-lead{flex-direction:row;text-align:left;gap:8px}.store-detail-lead>.store-art{width:64px;height:64px}.store-detail h2{font-size:14px}.store-detail p{margin:3px 0}}
`;document.head.append(storeStyle);
