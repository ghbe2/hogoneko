'use strict';
// Release-oriented prototype: persistent SVG phenotype and one authoritative shop catalogue.
const SHOP_CATALOG = [
  {id:'food_dry',shop:'super',category:'food',label:'いつものカリカリ',emoji:'◉',price:4,quantity:6,unit:'皿分'},
  {id:'food_wet',shop:'super',category:'food',label:'ウェットフード',emoji:'🥫',price:5,quantity:6,unit:'皿分'},
  {id:'food_fish',shop:'super',category:'food',label:'お魚ごはん',emoji:'🐟',price:6,quantity:6,unit:'皿分'},
  {id:'food_chicken',shop:'super',category:'food',label:'チキンごはん',emoji:'🍗',price:5,quantity:6,unit:'皿分'},
  {id:'food_soup',shop:'super',category:'food',label:'香るスープ',emoji:'🍲',price:6,quantity:6,unit:'皿分'},
  {id:'clean_paper',shop:'super',category:'care',label:'おそうじペーパー',emoji:'🧻',price:3,quantity:24,unit:'回'},
  {id:'clean_wipe',shop:'super',category:'care',label:'ウェットシート',emoji:'🧼',price:4,quantity:18,unit:'回'},
  {id:'clean_spray',shop:'super',category:'care',label:'消臭クリーナー',emoji:'🫧',price:5,quantity:12,unit:'回'},
  {id:'groom_comb',shop:'petshop',category:'care',label:'コーム',emoji:'🪮',price:4,quantity:12,unit:'回'},
  {id:'groom_wipe',shop:'petshop',category:'care',label:'猫用ウェット',emoji:'🧴',price:3,quantity:12,unit:'回'},
  ...[
    ['mouse','ネズミ','🐭',5],['feather','羽根','🪶',4],['ball','ボール','⚪',6],
    ['ribbon','ひらひらリボン','🎀',6],['bug','虫のじゃらし','🦋',6],['scent_pouch','香り袋','🌱',6],['peek_toy','かくれネズミ','🕳️',7],
  ].map(([id,label,emoji,price])=>({id,label,emoji,price,shop:'petshop',category:'play',quantity:1,unit:'個'})),
  ...[
    ['box','段ボール','📦',3],['blanket','毛布','🧶',5],['scratch','爪とぎ','🪵',5],
    ['plant','観葉植物','🌿',6],['tower','キャットタワー','🪜',12],['shelf','窓下の棚','🪵',10],
    ['doll','ぬいぐるみ','🧸',6],['tunnel','くぐりトンネル','🌀',8],['sunmat','ひなたマット','☀️',6],
    ['hammock','壁のハンモック','🛏️',12],
  ].map(([id,label,emoji,price])=>({id,label,emoji,price,shop:'petshop',category:'furniture',quantity:1,unit:'個'})),
];
const RELEASE_ECONOMY = {start:50,ad:50,clinic:12,graduation:18};
CONFIG.economy.startCoins=50;CONFIG.economy.adRewardCoins=50;CONFIG.economy.purchasePacks=[];
CONFIG.intake.clinic.baseCost=7;CONFIG.intake.clinic.vaccine=5;
CONFIG.care.clinic.cost=12;
CONFIG.intake.clinic.conditions.forEach((condition,i)=>condition.cost=[0,4,12,20][i]);
CONFIG.economy.assoc={rental:{cost:5,days:7,tags:'any'},loanMax:50};
CONFIG.stage1.campaign.clinicCost=RELEASE_ECONOMY.clinic;
CONFIG.items.push(
  {id:'ribbon',label:'ひらひらリボン',kind:'hand',affinityType:'chase',durability:16,body:{}},
  {id:'bug',label:'虫のじゃらし',kind:'hand',affinityType:'prey',durability:14,body:{}},
  {id:'scent_pouch',label:'香り袋',kind:'hand',affinityType:'scent',durability:14,body:{}},
  {id:'peek_toy',label:'かくれネズミ',kind:'hand',affinityType:'ambush',durability:18,body:{}},
  {id:'tunnel',label:'くぐりトンネル',kind:'placed',zone:'floor',affinityType:'hide',durability:20,body:{}},
  {id:'sunmat',label:'ひなたマット',kind:'placed',zone:'floor',affinityType:'sun',durability:18,body:{}},
  {id:'hammock',label:'壁のハンモック',kind:'placed',zone:'wall',affinityType:'high',durability:24,body:{}},
);
CONFIG.stage1.handItems.push('ribbon','bug','scent_pouch','peek_toy');
CONFIG.stage1.placedItems.push('doll','tunnel','sunmat','hammock');
Object.assign(CONFIG.stage1.defaultLayout,{doll:{x:35,y:74,zone:'floor'},tunnel:{x:53,y:70,zone:'floor'},sunmat:{x:62,y:83,zone:'floor'},hammock:{x:32,y:39,zone:'wall'}});
CONFIG.stage1.foods.push({id:'food_chicken',label:'チキンごはん',emoji:'🍗',affinityType:'food'},{id:'food_soup',label:'香るスープ',emoji:'🍲',affinityType:'scent'});
CONFIG.stage1.roamPoints.push({id:'hammock',x:36,y:36,scale:.55,distance:'far',surface:'hammock',requiresItem:'hammock'});
for(const product of SHOP_CATALOG){
  const item=getItem(product.id);if(item)item.price=product.price;
  TOOL_META[product.id]={...TOOL_META[product.id],emoji:product.emoji};
}
const TOY_EMOJI=Object.fromEntries(SHOP_CATALOG.filter(p=>p.category==='play').map(p=>[p.id,p.emoji]));
const owned=(state,id)=>Number(state.inventory[id])>0;
const productById=id=>SHOP_CATALOG.find(p=>p.id===id);
function stableCatSeed(id){let value=2166136261;for(const char of String(id))value=Math.imul(value^char.charCodeAt(0),16777619);return value>>>0;}
function phenotypeFor(cat){
  if(cat.phenotype)return {...cat.phenotype,age:cat.age,earCut:cat.status==='tnr'?'left':cat.phenotype.earCut};
  const dna=CatSVG.sampleDNA(stableCatSeed(cat.id));
  return {...dna,age:cat.age||'adult',earCut:cat.status==='tnr'?'left':'none',mood:'neutral'};
}
function withPhenotype(cat,random=false){
  const dna=random?{...CatSVG.sampleDNA(crypto.getRandomValues(new Uint32Array(1))[0]),earCut:'none',mood:'neutral'}:phenotypeFor(cat);
  // The renderer's demo randomly cuts ears; an uncaptured game cat must not inherit that.
  const age=random?(Math.random()<CONFIG.seasons[gameState.season].kittenRate?'kitten':'adult'):cat.age;
  dna.age=age;
  const meta=CatSVG.coats[dna.bodyCoat];
  return {...cat,phenotype:dna,age,coatLabel:meta.label,pattern:({tabby:'kiji',tortie:'sabi',calico:'mike',tux:'hachiware',black:'kuro',white:'shiro',cream:'cha'})[meta.family],eyeColor:dna.eyeColor,
    ...(random?{sex:['calico','tortie'].includes(meta.family)?'female':Math.random()<.5?'female':'male',estimatedAgeMonths:age==='kitten'?4:24,body:{...cat.body,weight:age==='kitten'?680:3100}}:{})};
}
function migrateReleaseState(state){
  if(state.flags.economyV017)return state;
  let prior=null;try{prior=JSON.parse(localStorage.getItem(SAVE_KEY))?.state;}catch{}
  const inventory={...state.inventory};
  // Existing testers keep their possessions; only new games get the reduced kit.
  if(prior){for(const id of ['box','blanket','scratch','tower','plant','shelf','bowl','litter','water'])inventory[id]=Math.max(1,Number(inventory[id])||0);}
  for(const p of getPlaced(getRoom(state)))inventory[p.itemId]=Math.max(1,Number(inventory[p.itemId])||0);
  return {...state,inventory,coins:prior&&!prior.flags?.economyV017?Math.max(0,Math.round(state.coins/36)):state.coins,
    flags:{...state.flags,economyV017:true},economy:{spent:0,adClaims:0,ledger:[],migration:!!prior},
    cats:state.cats.map(cat=>cat.status==='candidate'?{...cat,phenotype:null}:withPhenotype(cat))};
}
gameState=migrateReleaseState(gameState);
const normalizeBeforeV017=normalizeLoadedState;
normalizeLoadedState=function(state){const next=normalizeBeforeV017(state);return {...next,ui:{...next.ui,adStartedAt:null,adToken:null,shopNotice:null}};};
function spendCoins(state,amount,label){return {...state,coins:state.coins-amount,economy:{...state.economy,spent:(state.economy?.spent||0)+amount,ledger:[...(state.economy?.ledger||[]),{label,amount,day:getCat(state).body.days+1}].slice(-100)}};}
const reduceBeforeV017=reduceGameState;
reduceGameState=function(state,action){
  if(action.type==='ROAM_CAT'&&state.ui.careAnimation)return state;
  if(action.type==='TOUCH_NOW'){
    if(state.campaign.phase!=='room'||getCat(state).status!=='raising'||state.ui.layoutMode||state.ui.modal||state.ui.careAnimation)return state;
    if(state.ui.holdingCat)return reduceBeforeV017(state,{type:'RELEASE_CAT'});
    const mode=state.ui.touchMode||'pet',tool=TOUCH_TOOLS.find(t=>t.id===mode);
    if(!tool)return state;
    const anchor=action.point||getCatPoint(state);
    if(tool.stock){
      const next=reduceBeforeV017({...state,ui:{...state.ui,interactionMode:null}}, {type:'TAP_CAT'});
      return next.ui.careAnimation?{...next,ui:{...next.ui,careAnimation:{...next.ui.careAnimation,...anchor,anchor}}}:next;
    }
    return {...state,ui:{...state.ui,careAnimation:{id:Date.now()+Math.random(),operation:'touch',mode,emoji:tool.emoji,...anchor,anchor},reaction:null}};
  }
  if(action.type==='FINISH_CARE'&&state.ui.careAnimation?.operation==='touch'){
    const animation=state.ui.careAnimation;if(animation.id!==action.id)return state;
    return reduceBeforeV017({...state,ui:{...state.ui,careAnimation:null,interactionMode:animation.mode}}, {type:'TAP_CAT'});
  }
  if(action.type==='OPEN_SUPPLIES')return {...state,ui:{...state.ui,modal:'supplies',shopTab:action.tab||'furniture',shopNotice:null}};
  if(action.type==='SHOP_TAB')return {...state,ui:{...state.ui,shopTab:action.tab,shopNotice:null}};
  if(action.type==='OPEN_WALLET')return {...state,ui:{...state.ui,walletReturn:state.ui.modal,modal:'wallet'}};
  if(action.type==='CLOSE_WALLET')return {...state,ui:{...state.ui,modal:state.ui.walletReturn||null,walletReturn:null,adStartedAt:null,adToken:null}};
  if(action.type==='START_REWARD_AD'){
    if(state.ui.adToken||state.ui.modal!=='wallet')return state;
    return {...state,ui:{...state.ui,adToken:action.token,adStartedAt:Date.now(),adNotice:null}};
  }
  if(action.type==='COMPLETE_REWARD_AD'){
    if(state.ui.modal!=='wallet'||!state.ui.adToken||state.ui.adToken!==action.token||Date.now()-state.ui.adStartedAt<3000)return state;
    return {...state,coins:state.coins+50,economy:{...state.economy,adClaims:(state.economy?.adClaims||0)+1},ui:{...state.ui,adToken:null,adStartedAt:null,adNotice:'50コイン受け取りました'}};
  }
  if(action.type==='CANCEL_REWARD_AD')return {...state,ui:{...state.ui,adToken:null,adStartedAt:null,adNotice:'中止しました。コインは増えていません'}};
  if(action.type==='BUY_SHOP_ITEM'){
    const p=productById(action.itemId);
    if(!p||state.coins<p.price)return state;
    const item=getItem(p.id),furniture=item?.kind==='placed';
    if(furniture&&owned(state,p.id)&&getDurability(state,p.id)>0)return state;
    const charged=spendCoins(state,p.price,p.label);
    return {...charged,inventory:{...state.inventory,[p.id]:furniture?1:(Number(state.inventory[p.id])||0)+p.quantity},
      durability:item?.durability&&(!owned(state,p.id)||getDurability(state,p.id)<=0)?{...state.durability,[p.id]:item.durability}:state.durability,
      cats:furniture&&getBrokenItemId(getCat(state))===p.id?state.cats.map(cat=>({...cat,body:{...cat.body,broken:null}})):state.cats,
      ui:{...state.ui,shopNotice:`${p.label}を${p.quantity}${p.unit}購入しました`}};
  }
  if(['TOGGLE_PLACED_ITEM','DROP_LAYOUT_ITEM'].includes(action.type)&&!owned(state,action.itemId))return state;
  if(action.type==='SEND_EVENT'){
    if(state.campaign.phase!=='graduation'||!isGraduationReady(state))return state;
    if(state.coins<18)return {...state,ui:{...state.ui,modal:'wallet'}};
    let next=reduceBeforeV017(spendCoins(state,18,'手術・卒業ケア'),action);
    const cat=getCat(next),phenotype=phenotypeFor(cat);
    return {...next,cats:[{...cat,phenotype}],album:next.album.map((entry,i)=>i===next.album.length-1?{...entry,phenotype,age:cat.age,sex:cat.sex,coatLabel:cat.coatLabel}:entry)};
  }
  if(action.type==='START_INTAKE'&&state.coins<12)return {...state,ui:{...state.ui,modal:'wallet'}};
  let next=reduceBeforeV017(state,action);
  if(next===state)return state;
  if(action.type==='OPEN_TRAP'&&state.campaign.phase==='field'&&next.campaign.phase==='trapInspect')next={...next,cats:[withPhenotype(getCat(next),true)]};
  if(action.type==='NEXT_RESCUE')next={...next,cats:[{...getCat(next),phenotype:null}]};
  if(action.type==='START_INTAKE'&&next.campaign.phase==='intake'){
    const charged=spendCoins(state,12,'初診・ワクチン');
    next={...next,economy:charged.economy,cats:[{...getCat(next),body:{...getCat(next).body,weight:getCat(state).body.weight}}]};
  }
  return next;
};

// Shop catalogue / ownership UI. All prices are looked up again in the reducer.
function shopProducts(state,category,shop){
  return SHOP_CATALOG.filter(p=>(!category||p.category===category)&&(!shop||p.shop===shop)).map(p=>{
    const item=getItem(p.id),furniture=item?.kind==='placed',have=owned(state,p.id),good=have&&getDurability(state,p.id)>0;
    const count=Number(state.inventory[p.id])||0,blocked=state.coins<p.price||furniture&&good;
    const type=item?.affinityType||getFood(p.id)?.affinityType;
    return `<button class="shop-product ${furniture&&good?'owned':''}" data-action="buy-shop-item" data-item="${p.id}" ${blocked?'disabled':''}><span>${p.emoji}</span><strong>${p.label}</strong><small>${p.quantity}${p.unit}${item?.durability?' · 耐久'+item.durability:''}${type?' · '+TYPE_LABELS[type]:''}</small><b>${furniture&&good?'所持済み':`● ${p.price} コイン`}</b><small>${furniture?(have?(good?'部屋・押し入れにあります':'こわれたものを買い替え'):'未所持'):`所持 ${count}${p.unit}`}</small></button>`;
  }).join('');
}
function shopTabs(state){return `<nav class="release-shop-tabs">${[['furniture','家具'],['play','玩具'],['food','ごはん'],['care','ケア']].map(([id,label])=>`<button data-action="shop-tab" data-tab="${id}" aria-pressed="${(state.ui.shopTab||'furniture')===id}">${label}</button>`).join('')}</nav>`;}
function renderSupplies(state){return `<div class="release-overlay" role="dialog" aria-modal="true" aria-label="ショップ"><section class="release-sheet"><header><small>部屋に戻ると、買ったものが使えます</small><h2>買いそろえる</h2><button data-action="open-wallet">● ${state.coins} ＋</button></header>${shopTabs(state)}<p class="shop-notice" role="status">${state.ui.shopNotice||'気になるものを少しずつ。家具は繰り返し使えます。'}</p><div class="release-product-scroll"><div class="shop-products">${shopProducts(state,state.ui.shopTab||'furniture')}</div></div><button class="campaign-button secondary" data-action="close-modal">戻る</button></section></div>`;}
renderMapShop=function(state){
  const id=state.campaign.shopId,clinic=id==='clinic',name=id==='super'?'スーパー':clinic?'動物病院':'ペットショップ';
  return renderCampaignShell(state,name,`<section class="shop-sheet"><div class="release-shop-heading"><h1>${name}</h1><button data-action="open-wallet">● ${state.coins} ＋</button></div><p class="shop-notice" role="status">${state.ui.shopNotice||'買ったものは、かばん・押し入れへ。'}</p>${clinic?'<div class="clinic-price-list"><p>初診・ワクチン　<strong>12 コイン</strong></p><p>手術・卒業ケア　<strong>18 コイン</strong></p><small>保護・卒業の流れで利用します。ゲーム内の仮価格です。</small></div>':`<div class="shop-products">${shopProducts(state,null,id)}</div>`}</section>`,`<button class="campaign-button secondary" data-action="back-to-town">地図へ戻る</button>`);
};
function renderWallet(state){
  const busy=Boolean(state.ui.adToken);
  return `<div class="release-overlay" role="dialog" aria-modal="true" aria-label="コイン"><section class="release-sheet wallet-sheet"><header><small>保護活動を応援</small><h2>コイン</h2></header><div class="coin-balance">● <strong>${state.coins}</strong><small>コイン</small></div><p>1匹の保護から卒業まで、<br>50〜100コインが目安。</p><div class="ad-preview ${busy?'playing':''}"><span>🐾</span><strong>${busy?'応援広告を再生中…':'小さな応援が、次の保護へ。'}</strong><small>広告のダミー · 通信・課金はありません</small>${busy?'<i class="ad-progress"></i>':''}</div><p class="shop-notice" role="status">${state.ui.adNotice||'家具は次の子にも使えます。'}</p>${busy?'<button class="campaign-button secondary" data-action="cancel-reward-ad">中止する</button>':'<button class="campaign-button" data-action="reward-ad">広告を見る（ダミー）＋50</button>'}<button class="campaign-button secondary" data-action="close-wallet">戻る</button></section></div>`;
}
const paletteBeforeV017=renderLayoutPalette;
renderLayoutPalette=function(state){
  const ids=CONFIG.stage1.placedItems;CONFIG.stage1.placedItems=ids.filter(id=>owned(state,id));
  try{return paletteBeforeV017(state).replace('</aside>','<button class="palette-shop" data-action="open-supplies" data-tab="furniture">＋ 買う</button></aside>');}finally{CONFIG.stage1.placedItems=ids;}
};
const inventoryBeforeV017=renderInventory;
renderInventory=function(state){
  const ids=CONFIG.stage1.handItems;CONFIG.stage1.handItems=ids.filter(id=>owned(state,id));
  try{
    let html=inventoryBeforeV017(state);
    html=html.replace(/(<span class="big-emoji">)undefined(<\/span><strong>)([^<]+)/g,(_,a,b,label)=>a+(SHOP_CATALOG.find(p=>p.label===label)?.emoji||'🧸')+b+label);
    return html.replace(/<\/section>\s*<\/div>\s*$/,'<button class="bag-shop" data-action="open-supplies" data-tab="play">＋ ショップで買い足す</button></section></div>');
  }finally{CONFIG.stage1.handItems=ids;}
};
renderCommandDock=function(state){
  const hand=getItem(state.ui.equippedHand),food=getFood(state.ui.equippedFood),cleaner=getCleaner(state.ui.equippedCleaner);
  const touch=TOUCH_TOOLS.find(t=>t.id===state.ui.touchMode)||TOUCH_TOOLS[0];
  const slot=(tab,label,emoji,name,detail,command)=>`<button class="command-slot main-command" data-action="open-slot-menu" data-tab="${tab}" data-command="${command}" data-slot-label="${label}" aria-label="${label}・${name}。タップで選ぶ、ドラッグで使う"><span class="command-emoji">${emoji}</span><strong>${name}</strong><small>${detail}</small></button>`;
  return `<nav class="command-dock tiered-dock side-dock" aria-label="部屋で使うもの"><div class="main-command-row" role="group" aria-label="メイン操作">${slot('play','あそぶ',TOY_EMOJI[hand?.id]||'＋',hand?.label||'玩具',hand?getDurability(state,hand.id):'','cat')}${slot('food','ごはん',food.emoji,food.label,food.water?'∞':`×${state.inventory[food.id]||0}`,'food')}${slot('clean','そうじ',cleaner?.emoji||'＋',cleaner?.label||'道具',`×${state.inventory[cleaner?.id]||0}`,'clean')}</div><div class="sub-command-row" role="group" aria-label="サブ操作"><button class="command-slot sub-command" data-action="call-cat" aria-label="よぶ。長押しで呼び方を変える"><span class="command-emoji">📣</span><strong>よぶ</strong></button><button class="command-slot sub-command" data-action="touch-now" data-tab="touch" aria-label="${state.ui.holdingCat?'下ろす':`さわる・${touch.label}`}。タップで実行、長押しで変更" ${state.ui.careAnimation?'disabled':''}><span class="command-emoji">${state.ui.holdingCat?'🤲':touch.emoji}</span><strong>${state.ui.holdingCat?'おろす':'さわる'}</strong></button><span class="touch-switch-hint">長押しで変更</span></div></nav>`;
};
const pointBeforeV019=getCatPoint;
getCatPoint=state=>state.ui.careAnimation?.anchor||pointBeforeV019(state);
const walkBeforeV019=animateCatWalk;
animateCatWalk=function(from,to){
  // Touching stops the cat where it was shown; do not start a zero-distance walk
  // from subpixel rounding or resume its previous destination during the stroke.
  if(gameState.ui.careAnimation?.anchor)return;
  return walkBeforeV019(from,to);
};
function getVisibleTouchPoint(){
  const point=getCatPoint(gameState),element=app.querySelector('.cat-object');
  if(!element)return point;
  const bounds=element.parentElement.getBoundingClientRect(),css=getComputedStyle(element),transform=new DOMMatrixReadOnly(css.transform);
  return {...point,x:parseFloat(css.left)/bounds.width*100,y:parseFloat(css.top)/bounds.height*100,scale:Math.hypot(transform.a,transform.b)};
}
const careBeforeV019=renderCareAnimation;
renderCareAnimation=function(animation){
  if(animation.operation!=='touch')return careBeforeV019(animation);
  return `<div class="care-animation touch-${animation.mode}" style="left:${animation.x}%;top:${animation.y}%" role="status" aria-label="${animation.mode==='pickup'?'抱き上げる':'撫でる'}"><span class="care-hand">${animation.emoji}</span></div>`;
};
renderPlayToy=itemId=>`<div class="play-toy" data-play-toy aria-hidden="true">${TOY_EMOJI[itemId]||'🧸'}</div>`;
const placedBeforeV017=renderPlacedItem;
renderPlacedItem=function(placed,state,clue){
  if(!['doll','tunnel','sunmat','hammock'].includes(placed.itemId))return placedBeforeV017(placed,state,clue);
  // Retain the same damage, cleanup, clue and drag targets as existing furniture.
  return placedBeforeV017(placed,state,clue).replace('class="placed-item ', 'class="placed-item release-furniture ').replace(/(aria-label="[^"]*">)/,'$1<i></i><b></b>');
};
const clinicBeforeV017=renderClinic;
renderClinic=(state,cat)=>clinicBeforeV017(state,cat).replace('<strong>400</strong>','<strong>7</strong>').replace('<strong>300</strong>','<strong>5</strong>').replace('<strong>700</strong>','<strong>12 コイン</strong>');
const graduationBeforeV017=renderGraduation;
renderGraduation=(state,cat)=>graduationBeforeV017(state,cat).replace('譲渡会へ送り出す</button>','手術・卒業ケア 18コインで送り出す</button>');
isGraduationReady=function(state){const cat=getCat(state);return cat.body.weight>=(cat.age==='kitten'?CONFIG.cat.weightGoal.kitten:CONFIG.stage1.campaign.bodyGoal)&&!cat.body.sick&&(cat.age!=='kitten'||cat.body.days>=5);};
const guideBeforeV017=getScreenGuide;
getScreenGuide=function(state){
  if(state.campaign.phase==='intake')return {title:'この子が落ち着く部屋を探そう',detail:'押し入れの「＋ 買う」から家具を買い足せます。置いて様子を見て、名前を呼ぼう。ごはん皿・水入れ・トイレは好みに関係なく必要です。'};
  return guideBeforeV017(state);
};

// A single phenotype is stored on the cat, not sampled when its SVG is rendered.
renderCatArt=function(cat){const dna=phenotypeFor(cat);return `<svg class="game-cat-svg" viewBox="200 55 320 320" preserveAspectRatio="xMidYMax meet" data-cat-id="${String(cat.id).replace(/[^a-zA-Z0-9_-]/g,'')}" data-dna="${encodeURIComponent(JSON.stringify(dna))}" aria-hidden="true"></svg>`;};
const svgRigs=new Map();
function mountGameCats(){
  for(const [svg] of svgRigs)if(!svg.isConnected)svgRigs.delete(svg);
  app.querySelectorAll('.game-cat-svg').forEach(svg=>{
    if(svgRigs.has(svg))return;
    const dna=JSON.parse(decodeURIComponent(svg.dataset.dna));
    const rig=CatSVG.buildCat(svg,'game',dna,375,1);svg.querySelector('.floor')?.remove();
    CatSVG.applyPose(rig,CatSVG.poseModel('sit',0),0,'sit');
    svgRigs.set(svg,{rig,pose:'sit',since:performance.now(),previous:null,changed:0});
  });
}
function scenePose(svg){
  const holder=svg.closest('.cat-object');
  if(holder){
    if(holder.classList.contains('jumping'))return ['jump','neutral'];
    if(holder.classList.contains('walking'))return ['walk','neutral'];
    if(holder.classList.contains('toy-reject'))return ['sit','angry'];
    if(holder.classList.contains('toy-avoid'))return ['sit','wary'];
    if(holder.classList.contains('toy-eager'))return ['punch','happy'];
    if(holder.classList.contains('toy-alert'))return ['punch','happy'];
    if(holder.classList.contains('nibbling')&&gameState.ui.mealAt>Date.now()-3500)return ['eat','neutral'];
    if(holder.classList.contains('purring')&&gameState.ui.purrUntil>Date.now())return [getCat(gameState).heart>=90?'knead':'sit','happy'];
    if(gameState.ui.catFocus?.operation==='play')return ['punch','happy'];
    return [getCat(gameState).heart>=70&&Math.floor(Date.now()/12000)%5===0?'sleep':'sit',getCat(gameState).heart<70?'wary':'neutral'];
  }
  const capture=svg.closest('.capture-inspect');
  if(capture){const temperament=getCapturedPose(getCat(gameState));return [temperament.id==='eating'?'eat':temperament.id==='restless'?'punch':'sit',temperament.id==='restless'?'angry':'wary'];}
  return ['sit','neutral'];
}
let svgLast=0;
function animateGameCats(now){
  if(!document.hidden&&now-svgLast>=1000/24){
    svgLast=now;
    for(const [svg,entry] of svgRigs){
      if(!svg.isConnected){svgRigs.delete(svg);continue;}
      let [pose,mood]=scenePose(svg),t=(now-entry.since)/1000;
      if(pose!==entry.pose){entry.previous=CatSVG.poseModel(entry.pose,t);entry.pose=pose;entry.since=now;entry.changed=now;t=0;}
      entry.rig.d.mood=mood;
      // World movement owns the jump arc; the SVG only bends its limbs.
      const poseTime=pose==='jump'?.3+Math.min(.7,t/CONFIG.stage1.jumpMs*1000*.7):pose==='punch'?t*(svg.closest('.toy-eager')?1.4:.85):t;
      let model=CatSVG.poseModel(pose,poseTime);
      if(entry.previous&&pose!=='jump'&&now-entry.changed<180)model=CatSVG.mixModel(entry.previous,model,(now-entry.changed)/180);
      if(pose==='jump')model.lift=0;
      CatSVG.applyPose(entry.rig,model,t,pose);svg.dataset.pose=pose;
    }
  }
  requestAnimationFrame(animateGameCats);
}
const renderBeforeV017=render;
render=function(state){
  renderBeforeV017(state);
  const wallet=app.querySelector('.hud-side>span,.campaign-wallet');
  if(wallet){
    wallet.innerHTML=(wallet.classList.contains('campaign-wallet')?`${DAY_LABELS[state.week.dayOfWeek]}曜日　`:'')+`<button class="wallet-open" data-action="open-wallet" aria-label="${state.coins}コイン。広告でコインを受け取る">● ${state.coins} <b>＋</b></button>`;
  }
  if(state.ui.modal==='supplies')app.insertAdjacentHTML('beforeend',renderSupplies(state));
  if(state.ui.modal==='wallet')app.insertAdjacentHTML('beforeend',renderWallet(state));
  // Keep the exit outside the scrollable inventory, including an empty bag.
  app.querySelectorAll('.menu-sheet .sheet-head').forEach(header=>{
    if(header.querySelector('[data-action="close-modal"]'))return;
    header.classList.add('closable-sheet-head');
    header.insertAdjacentHTML('beforeend','<button type="button" class="sheet-close" data-action="close-modal" aria-label="とじる。選択を変えずに戻る">とじる</button>');
  });
  if(titleScreenOpen){
    app.querySelector('.title-actions')?.insertAdjacentHTML('beforeend','<button class="new-release-game" data-action="restart-release">初期セットから遊び直す</button>');
  }
  // Previously returned cats keep their own appearance, even after another rescue.
  const lastTnr=state.album.filter(c=>c.outcome==='tnr'&&c.phenotype).at(-1);
  if(lastTnr)app.querySelectorAll('.field-tnr-cat').forEach(n=>{n.innerHTML=renderCatArt({...lastTnr,id:lastTnr.catId,status:'tnr'});});
  mountGameCats();
};
app.addEventListener('click',event=>{
  if(Date.now()<suppressClickUntil)return;
  const target=event.target.closest('[data-action]');if(!target||target.disabled)return;
  const action=target.dataset.action;
  if(action==='open-supplies')dispatch({type:'OPEN_SUPPLIES',tab:target.dataset.tab});
  if(action==='shop-tab')dispatch({type:'SHOP_TAB',tab:target.dataset.tab});
  if(action==='open-wallet')dispatch({type:'OPEN_WALLET'});
  if(action==='close-wallet')dispatch({type:'CLOSE_WALLET'});
  if(action==='cancel-reward-ad')dispatch({type:'CANCEL_REWARD_AD'});
  if(action==='reward-ad'){
    const token=crypto.randomUUID();dispatch({type:'START_REWARD_AD',token});
    setTimeout(()=>dispatch({type:'COMPLETE_REWARD_AD',token}),3200);
  }
  if(action==='restart-release'&&window.confirm('今の記録をバックアップして、50コインと初期セットから遊び直しますか？')){
    try{localStorage.setItem(SAVE_KEY+'_before_release_restart',localStorage.getItem(SAVE_KEY));}catch{}
    resetGameSave();
  }
});
const releaseStyle=document.createElement('style');
releaseStyle.textContent=`
.game-cat-svg{display:block;width:100%;height:100%;overflow:visible;pointer-events:none;transform-origin:50% 100%}
.cat-object .game-cat-svg{transform:scale(1.3)}
.cat-object.walking .game-cat-svg,.cat-object.jumping .game-cat-svg{transform:scale(calc(var(--cat-facing,1)*1.3),1.3)}
.capture-cat .game-cat-svg{transform:scale(1.6)}
.command-dock.tiered-dock{display:grid;grid-template-columns:minmax(0,1fr) 76px;align-items:center;gap:12px;width:calc(100% - 24px);max-width:350px;bottom:18px}
.main-command-row{display:flex;gap:6px;justify-content:space-between}.sub-command-row{position:relative;display:flex;flex-direction:column;gap:8px;align-items:center}
.tiered-dock .main-command{width:clamp(54px,17vw,68px);height:clamp(54px,17vw,68px);min-width:54px}.tiered-dock .main-command .command-emoji{font-size:30px}.tiered-dock .main-command strong{font-size:8px}.tiered-dock .main-command::after{font-size:10px;padding:3px 9px;bottom:-10px}
.tiered-dock .sub-command{display:flex;justify-content:center;gap:3px;width:76px;min-width:76px;height:40px;border-radius:24px;padding:4px 5px;background:rgba(255,250,244,.94);box-shadow:0 3px 8px #533a5220;cursor:pointer}
.tiered-dock .sub-command .command-emoji{font-size:18px;flex-shrink:0}.tiered-dock .sub-command strong{width:auto;font-size:10px;flex-shrink:0}.tiered-dock .sub-command::after{display:none}.tiered-dock .sub-command:disabled{opacity:.55;cursor:default}
.touch-switch-hint{position:absolute;top:calc(100% + 3px);color:#816658;font-size:7px;white-space:nowrap;pointer-events:none}
.care-animation.touch-pet{transform:translate(-50%,-110%)}.care-animation.touch-pet .care-hand{animation:touch-pet-stroke .4s ease-in-out infinite alternate;font-size:34px}.care-animation.touch-pickup .care-hand{animation:touch-lift .8s ease-in-out both}
@keyframes touch-pet-stroke{from{transform:translate(-10px,-7px) rotate(-16deg)}to{transform:translate(12px,2px) rotate(12deg)}}@keyframes touch-lift{from{transform:translateY(10px)}to{transform:translateY(-26px)}}
.closable-sheet-head{position:relative;padding-right:78px;flex:0 0 auto}.sheet-close{position:absolute;top:12px;right:10px;min-width:60px;min-height:40px;border:1px solid #e0c8bf;border-radius:13px;background:#fff;color:#785b57;font-size:12px;cursor:pointer;touch-action:manipulation}.inventory-menu-sheet .inventory-tabs{grid-template-columns:repeat(4,minmax(0,1fr))}
button,[role="button"]{touch-action:manipulation}
.cat-object.nibbling{animation:none}.game-cat-svg .part-outline{display:none}
.wallet-open,.release-shop-heading button,.release-sheet header button{border:0;border-radius:20px;padding:7px 10px;background:#faedcc;color:#795b29;font:inherit;font-size:11px;white-space:nowrap}
.wallet-open b{margin-left:4px}.release-overlay{position:absolute;inset:0;z-index:300;display:flex;align-items:center;justify-content:center;padding:16px;background:#69554866;backdrop-filter:blur(4px)}
#app{position:relative}.release-sheet{width:100%;max-height:100%;display:flex;flex-direction:column;gap:10px;background:#fffaf4;border-radius:23px;padding:18px;box-shadow:0 15px 45px #503b3929;min-height:0}
.release-sheet header{position:relative;padding-right:65px;flex:none}.release-sheet header h2{margin:5px 0;font-size:21px}.release-sheet header small{font-size:9px;color:#968781}.release-sheet header button{position:absolute;right:0;top:18px}
.release-shop-tabs{display:flex;gap:5px;flex:none}.release-shop-tabs button{flex:1;border:1px solid #e5d8d0;background:#fff;border-radius:12px;padding:9px 0;font-size:11px}.release-shop-tabs [aria-pressed=true]{background:#f9dce3;border-color:#d77990}
.release-product-scroll{overflow-y:auto;min-height:0;overscroll-behavior:contain;touch-action:pan-y}.shop-product{padding:10px 4px;min-height:116px}.shop-product b{font-size:11px;color:#aa6951}.shop-product.owned{opacity:.65;background:#edf2e9}.shop-product:disabled:not(.owned){opacity:.55}.shop-notice{min-height:24px;margin:0;font-size:10px;color:#887571;line-height:1.5;flex:none}
.release-sheet>.campaign-button{min-height:42px;padding:10px;flex:none;font-size:13px}.release-shop-heading{display:flex;justify-content:space-between;align-items:center}.release-shop-heading h1{font-size:23px}.clinic-price-list{font-size:13px;line-height:2}.clinic-price-list small{font-size:10px}
.wallet-sheet{text-align:center;gap:10px}.wallet-sheet header{text-align:left;padding-right:0}.coin-balance{color:#bf9041}.coin-balance strong{font-size:48px}.coin-balance small{margin-left:7px}.wallet-sheet>p{font-size:12px;line-height:1.8;margin:0}.ad-preview{display:grid;gap:9px;place-items:center;background:#e4eee4;padding:20px 8px;border-radius:18px;position:relative;overflow:hidden}.ad-preview>span{font-size:34px}.ad-preview>strong{font-size:12px}.ad-preview small{font-size:9px;color:#6b7c6d}.ad-progress{position:absolute;bottom:0;left:0;height:5px;background:#a2bf9d;animation:ad-fill 3.2s linear forwards}@keyframes ad-fill{from{width:0}to{width:100%}}
.palette-shop,.bag-shop{border:1px solid #d5baa5;background:#fbefdc;color:#826149;border-radius:10px;font-size:10px;padding:8px;flex:none}.palette-shop{margin:4px}.bag-shop{display:block;margin:8px}.new-release-game{border:0;background:none;font-size:10px;color:#967a74;padding:8px}
.release-furniture{width:70px;height:65px;position:absolute}.release-furniture.worn{opacity:.5;filter:grayscale(.6)}.item-tunnel{height:42px;border-radius:24px;background:repeating-linear-gradient(90deg,#cfb48c 0 12px,#ac9277 12px 15px);box-shadow:0 4px 0 #b09378}.item-tunnel i{position:absolute;left:-3px;top:0;width:31px;height:42px;border:5px solid #b6a08a;border-radius:50%;background:#6c5d55}.item-sunmat{height:25px;width:85px;border:4px solid #dfc294;border-radius:50%;background:#f1dcb8}.item-hammock{height:32px;width:78px;border-bottom:14px solid #c48c81;border-radius:0 0 50% 50%;background:#e8c3ac}.item-hammock:before,.item-hammock:after{content:'';position:absolute;top:0;width:7px;height:38px;background:#a98b6f;left:0}.item-hammock:after{left:auto;right:0}.item-doll{width:45px;height:44px;background:#c6ad8b;border-radius:45%}.item-doll:before{content:'';position:absolute;left:0;top:-21px;width:44px;height:36px;border-radius:50%;background:#c6ad8b;box-shadow:-10px -6px 0 -7px #a58b69,10px -6px 0 -7px #a58b69}.item-doll i{position:absolute;top:-6px;left:13px;width:4px;height:4px;border-radius:50%;background:#6f5b46;box-shadow:15px 0 #6f5b46}.item-doll b{position:absolute;top:13px;left:12px;width:24px;height:23px;border-radius:50%;background:#eee2cf}
@media(max-height:680px){.release-sheet{padding:13px;gap:7px}.wallet-sheet .ad-preview{padding:12px}.coin-balance strong{font-size:36px}}
`;
document.head.append(releaseStyle);
saveGameState(gameState);render(gameState);scheduleRoam();
requestAnimationFrame(animateGameCats);
window.setInterval(triggerAutoEvent,CONFIG.stage1.autoEventMs);
