'use strict';
const HOUSEHOLD_SET_PRICE=10;
const HOUSEHOLD_EQUIPMENT=['bowl','water','litter'];
SHOP_CATALOG.push({id:'household_set',shop:'petshop',category:'tools',label:'2匹目の基本セット',price:10,quantity:1,unit:'セット',emoji:''});
bookIcons.household_set=bookIcons.starter_set;
const setAvailable=storeAvailable;
storeAvailable=(s,id)=>id==='household_set'?s.household?.setup==='purchase'&&!s.household.basicSetBought:setAvailable(s,id);
const setBenefit=productBenefit;
productBenefit=id=>id==='household_set'?'ごはん皿・水入れ・トイレを、もう1セット。おうちの家具から置けます。':setBenefit(id);
const setProducts=storeProducts;
storeProducts=function(s){const t=document.createElement('template');t.innerHTML=setProducts(s);t.content.querySelectorAll('.store-product').forEach(n=>{if(s.household?.setup==='purchase'?n.dataset.item!=='household_set':n.dataset.item==='household_set')n.remove()});t.content.querySelectorAll('.store-shelf').forEach(n=>{if(!n.children.length)n.remove()});return t.innerHTML;};
const HOUSEHOLD_SETUP_COPY={intro:'これからの保護猫活動では、2匹を同時にお世話することになります。水入れ、ごはん皿、トイレをもう1セット用意しましょう。この子が持ってきてくれた10コインで、基本セットを買いに行きましょう。',renovation:'お部屋を広くすることもできます。このバナーから改装できますよ。まずは、2匹目の基本セットを用意しましょう。',buy:'水入れ、ごはん皿、トイレが入った基本セットです。10コインで、2匹目のために用意しましょう。',complete:'これで、2匹目を迎える準備ができますね。おうちで基本セットを置いてあげましょう。'};
function furnitureCapacity(s){return 10+10*(s.household?.renovation||0);}
function furnitureCount(s){return getPlaced(getRoom(s)).length;}
function householdEquipmentOwner(s,second=false){const residents=residentCats(s),home=residents.find(c=>c.permanentResident)||residents[0];return second?residents.find(c=>c.id!==home?.id):home;}
for(const base of HOUSEHOLD_EQUIPMENT){const item=getItem(base),id=base+'_second';CONFIG.items.push({...item,id,label:item.label+'（2匹目用）',essential:false});CONFIG.stage1.placedItems.push(id);CONFIG.stage1.defaultLayout[id]={...CONFIG.stage1.defaultLayout[base]};bookIcons[id]=bookIcons[base];}
const equipmentHeight=furnitureHeight;furnitureHeight=id=>equipmentHeight(id.replace(/_second$/,''));
const equipmentPlaced=renderPlacedItem;
renderPlacedItem=function(p,s,...args){
 const base=p.itemId.replace(/_second$/,'');if(!HOUSEHOLD_EQUIPMENT.includes(base)||!householdEquipmentEnabled(s))return equipmentPlaced(p,s,...args);
 const owner=householdEquipmentOwner(s,p.itemId!==base),cat=owner||{...getCat(s),body:{...getCat(s).body,foodLevel:0,waterLevel:0,litter:0}};
 const t=document.createElement('template');t.innerHTML=equipmentPlaced({...p,itemId:base},{...s,cats:[cat,...s.cats.filter(c=>c.id!==cat.id)]},...args);
 const el=t.content.querySelector('.placed-item');if(!el)return t.innerHTML;
 el.dataset.hhEquipment=base;el.dataset.hhOwner=owner?.id||'';
 if(p.itemId!==base){el.classList.remove('item-'+base);el.classList.add('item-'+p.itemId);if(el.dataset.layoutItem)el.dataset.layoutItem=p.itemId;}
 if(!owner&&!s.ui.layoutMode){el.removeAttribute('data-action');el.removeAttribute('data-drop-target');}
 return t.innerHTML;
};
const equipmentComfort=getRoomComfortBreakdown;
getRoomComfortBreakdown=function(s){
 if(!householdEquipmentEnabled(s))return equipmentComfort(s);
 const second=getCat(s).id!==householdEquipmentOwner(s)?.id;
 const rooms=s.rooms.map(r=>({...r,floor:r.floor.filter(p=>!HOUSEHOLD_EQUIPMENT.includes(p.itemId.replace(/_second$/,''))||p.itemId.endsWith('_second')===second).map(p=>({...p,itemId:p.itemId.replace(/_second$/,'')}))}));
 return equipmentComfort({...s,rooms});
};
const setupReducer=reduceGameState;
reduceGameState=function(s,a){
 const step=s.household?.setup;
 if(['DROP_LAYOUT_ITEM','PICK_FURNITURE','TOGGLE_PLACED_ITEM'].includes(a.type)&&!a.store&&!getPlaced(getRoom(s)).some(p=>p.itemId===a.itemId)&&furnitureCount(s)>=furnitureCapacity(s))return {...s,ui:{...s.ui,message:`家具は${furnitureCapacity(s)}個まで置けます。しまうか、改装して場所を増やしましょう。`}};
 if(step&&step!=='done'){
  if(['CHOOSE_AREA','GO_CLINIC','GO_EVENT','BEGIN_ADOPTION','SEND_EVENT'].includes(a.type))return s;
  if(a.type==='OPEN_MAP_SHOP'&&a.shopId!=='petshop')return s;
  if(a.type==='GO_HOME'&&step!=='complete')return s;
 }
 if(a.type==='HOUSEHOLD_SETUP_NEXT'){
  const pages=splitGuideText(HOUSEHOLD_SETUP_COPY[step]||'',40),page=s.household.setupPage||0;
  if(page<pages.length-1)return {...s,household:{...s.household,setupPage:page+1}};
  s={...s,household:{...s.household,setupPage:0}};
  if(step==='intro')return {...s,household:{...s.household,setup:'shop'},campaign:{...s.campaign,phase:'town'},ui:{...s.ui,modal:null}};
  if(step==='renovation')return {...s,household:{...s.household,setup:'buy'}};
  if(step==='buy')return {...s,household:{...s.household,setup:'purchase'},ui:{...s.ui,shopTab:'tools',storeDetail:'household_set',storeDraftCount:1,shopCart:{}}};
  if(step==='complete')return {...s,household:{...s.household,setup:'done'},economy:{...s.economy,pendingFamilyLetter:Object.keys(s.economy?.familyLetters||{}).find(id=>s.economy.familyLetters[id].kind==='return'&&!s.economy.familyLetters[id].claimed)||null}};
  return s;
 }
 if(step==='purchase'){
  if(a.type==='STORE_DRAFT_COUNT'||a.type==='STORE_QUANTITY')return s;
  if(a.type==='STORE_DETAIL'&&a.id!=='household_set')return s;
  if(a.type==='STORE_CONFIRM'&&s.household.setCoinsReserved&&storeCart(s).household_set===1)return {...s,ui:{...s.ui,storeConfirm:true}};
 }
 if(a.type==='CHECKOUT_SHOP'&&step==='purchase'){
  if(s.campaign.phase!=='shop'||s.campaign.shopId!=='petshop'||s.household?.basicSetBought||storeCart(s).household_set!==1||(!s.ui.storeCartOpen&&!s.ui.storeConfirm)||(!s.household.setCoinsReserved&&s.coins<HOUSEHOLD_SET_PRICE))return s;
  const n=spendCoins(s,HOUSEHOLD_SET_PRICE,'2匹目の基本セット'),inventory={...n.inventory},durability={...n.durability};
  for(const base of HOUSEHOLD_EQUIPMENT){inventory[base+'_second']=1;durability[base+'_second']=getItem(base).durability||100;}
  return {...n,inventory,durability,ui:{...n.ui,shopCart:{},storeDetail:null,storeCartOpen:false,storeConfirm:false},household:{...n.household,basicSetBought:true,setCoinsReserved:false,setup:'complete',setupPage:0}};
 }
 const n=setupReducer(s,a);
 if(step==='shop'&&n.campaign.phase==='shop'&&n.campaign.shopId==='petshop')return {...n,household:{...n.household,setup:'renovation'}};
 return n;
};
const setupRender=render;
render=function(s){
 setupRender(s);
 if(titleScreenOpen||window.HouseholdReturn?.active)return;
 if(s.ui.layoutMode){const bar=app.querySelector('.layout-workbar');if(bar){const label=document.createElement('small');label.className='household-capacity';label.textContent=`${furnitureCount(s)} / ${furnitureCapacity(s)}`;bar.append(label);}if(furnitureCount(s)>=furnitureCapacity(s)){const library=app.querySelector('.layout-library');if(library){const note=document.createElement('p');note.className='household-capacity-notice';note.textContent=`${furnitureCapacity(s)}個まで配置しています。家具をしまうと、別の家具を置けます。改装すると20個まで置けます。`;library.querySelector('.furniture-sheet nav')?.after(note);library.querySelectorAll('[data-action="pick-furniture"]').forEach(n=>{if(!getPlaced(getRoom(s)).some(p=>p.itemId===n.dataset.item))n.disabled=true;});}}}
 const step=s.household?.setup;if(!step||step==='done')return;
 requestAnimationFrame(()=>{const banner=app.querySelector('.household-renovation-banner');if(banner)banner.inert=true;});
 if(step==='purchase'){
  app.querySelectorAll('.store-quantity button').forEach(n=>n.disabled=true);
  if(s.household.setCoinsReserved){app.querySelectorAll('[data-store="checkout"],[data-store="confirm"]').forEach(n=>n.disabled=false);const notice=app.querySelector('.store-notice');if(notice)notice.textContent='この子が持ってきた10コインで購入できます。';}
  return;
 }
 if(step==='shop'){
  app.querySelectorAll('.town-destination:not(.petshop),[data-action="choose-area"],.room-travel-icon').forEach(n=>{n.inert=true;n.setAttribute('aria-disabled','true');});
  return;
 }
 const copy=HOUSEHOLD_SETUP_COPY[step];
 if(!copy)return;
 const layer=document.createElement('section');layer.className='household-setup-layer';layer.setAttribute('role','dialog');layer.setAttribute('aria-label','2匹のお世話の準備');
 const pages=splitGuideText(copy,40),page=s.household.setupPage||0,last=page>=pages.length-1;
 const button=`<button data-household-next>${last&&step==='intro'?'お店へ':last&&step==='complete'?'わかりました':last&&step==='buy'?'商品を見る':'つぎへ'}</button>`;
 layer.innerHTML='<section class="shared-guide-note">'+seniorDialogueContents(pages[page]||pages[0],button)+'</section>';app.append(layer);
 layer.querySelector('[data-household-next]')?.addEventListener('click',()=>dispatch({type:'HOUSEHOLD_SETUP_NEXT'}));
 if(step==='renovation')requestAnimationFrame(()=>{const banner=app.querySelector('.household-renovation-banner');if(banner){banner.classList.add('household-guide-focus');const h=document.createElement('div');h.className='household-banner-hand';h.innerHTML=guideHand();banner.append(h);}});
};
const setupStyle=document.createElement('style');setupStyle.textContent='.household-setup-layer{position:absolute;inset:0;z-index:120;background:transparent;display:flex;align-items:flex-end;padding:16px;box-sizing:border-box}.household-setup-layer>.shared-guide-note{position:relative;inset:auto;width:100%;box-sizing:border-box;background:#fff8e9;border:1px solid #cbb995;border-radius:20px;color:#614e3f}.household-capacity-notice{flex:none;margin:0 0 8px;font-size:13px;line-height:1.5;color:#614e3f}.household-capacity{position:absolute;right:6px;top:-25px;background:#fff8e9;border-radius:12px;padding:3px 10px;color:#614e3f}.household-guide-focus{filter:drop-shadow(0 0 5px #fff3d3);z-index:121!important}.household-banner-hand{position:absolute;right:0;top:25px;pointer-events:none}.household-banner-hand .guide-gesture{left:-25px;top:0}';document.head.append(setupStyle);


