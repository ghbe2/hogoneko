'use strict';
// Art integration only: existing save IDs, reducers and affinity rules remain authoritative.
const SB=window.StorybookArt,bookIcons={},bookItems=[];
CONFIG.town.areas.find(a=>a.id==='a1').label='空き地';CONFIG.town.areas.find(a=>a.id==='a3').label='商店街の裏路地';
if(!CONFIG.town.areas.some(a=>a.id==='a4'))CONFIG.town.areas.push({id:'a4',label:'山',totalCats:20,unlockAfter:'a3',spawn:{common:.5,uncommon:.35,rare:.15}});
const bookURI=svg=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
const bookImage=(svg,cls='book-icon')=>`<img class="${cls}" src="${bookURI(svg)}" alt="" draggable="false">`;
const handIDs={mouse:'mouse',feather:'feather',ball:'ball',ribbon:'ribbon',tailwand:'peek_toy',fish:'scent_pouch'};
const placedIDs={tower:'tower',tunnel:'tunnel',scratch:'scratch'};
for(const [kind,entries] of [['hand',SB.hand],['placed',SB.placed]])for(const entry of entries){
 const id=(kind==='hand'?handIDs:placedIDs)[entry.art]||`${kind==='hand'?'toy':'decor'}_${entry.type}`;
 const zone=entry.placement?.startsWith('壁')?'wall':'floor';
 const prior=getItem(id),price=prior?.price||(kind==='hand'?6:zone==='wall'?10:8);
 const item={id,label:entry.name,kind,affinityType:entry.type,durability:prior?.durability||(kind==='hand'?16:24),body:{},price,...(kind==='placed'?{zone}:{})};
 if(prior)Object.assign(prior,item);else CONFIG.items.push(item);
 bookItems.push(item);bookIcons[id]=entry.svg;
 const list=kind==='hand'?CONFIG.stage1.handItems:CONFIG.stage1.placedItems;if(!list.includes(id))list.push(id);
 if(kind==='placed'&&!CONFIG.stage1.defaultLayout[id])CONFIG.stage1.defaultLayout[id]={x:43,y:zone==='wall'?32:68,zone};
 const product={id,label:item.label,emoji:bookImage(entry.svg),price,shop:'petshop',category:kind==='hand'?'play':'furniture',quantity:1,unit:'個'};
 const existing=productById(id);if(existing)Object.assign(existing,product);else SHOP_CATALOG.push(product);
 TOOL_META[id]={...TOOL_META[id],emoji:product.emoji,label:item.label,kind:kind==='hand'?'玩具':'部屋'};
 if(kind==='hand')TOY_EMOJI[id]=product.emoji;
}
// Old possessions are not removed or converted into different IDs.
const bookSVG=body=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 220">${body}</svg>`;
function bowlSVG(water=false,level=100){
 const amount=typeof level==="boolean"?(level?100:0):Math.max(0,Math.min(100,Number(level)||0));
 const body=water?'<path d="M63 82L72 171Q125 205 181 171L190 82Z" fill="#668eaa"/><ellipse cx="126" cy="82" rx="64" ry="25" fill="#f7f2df"/><ellipse cx="126" cy="85" rx="53" ry="18" fill="#455f6c"/>':'<path d="M22 123L42 157Q125 185 211 157L230 123Z" fill="#bd7658"/><ellipse cx="126" cy="123" rx="104" ry="30" fill="#f7e8c9"/><ellipse cx="126" cy="124" rx="89" ry="22" fill="#99704e"/>';
 let contents="";
 if(water&&amount){const y=100-amount*.14;contents=`<ellipse cx="126" cy="${y}" rx="51" ry="${9+amount*.07}" fill="#82c5d6"/><path d="M94 ${y}q15-8 28-3m10 6q15 4 25-4" fill="none" stroke="#edfcff" stroke-width="4" stroke-linecap="round"/>`;}
 if(!water)for(let i=0;i<Math.ceil(amount/6);i++){const x=59+(i%6)*26,y=114+Math.floor(i/6)*10;contents+=`<ellipse cx="${x}" cy="${y}" rx="8" ry="5" fill="${i%2?"#765033":"#b58a4f"}" transform="rotate(${i%3*25} ${x} ${y})"/>`;}
 return bookSVG(body+contents).replace('0 0 250 220',water?'45 52 165 155':'12 86 230 105');
}
Object.assign(bookIcons,{
 bowl:bowlSVG(),water:bowlSVG(true),
 litter:bookSVG('<path d="M27 77L179 63 225 102 207 174 55 191 22 147Z" fill="#82927b"/><path d="M27 77L179 63 225 102 63 125Z" fill="#e0d7bc"/><path d="M46 84L174 75 203 100 66 115Z" fill="#b7a789"/><path d="M63 125L225 102 218 124 73 147 55 132Z" fill="#a8b39a"/><path d="M80 88l5 2m18-6 4 3m20-5 6 2m20 0 4 4m-70 12 6 2m18-7 5 3m23-4 5 2m24-6 4 3" stroke="#e5d9b7" stroke-width="5" stroke-linecap="round"/><path d="M55 136Q80 167 106 143L107 161Q75 181 55 156Z" fill="#f1e5c8"/>'),
 box:bookSVG('<path d="M33 69L175 60 186 175 44 185Z" fill="#b5824e"/><path d="M175 60L216 89 220 171 186 175Z" fill="#aa8056"/><path d="M32 71L seventy 40 206 56 175 64Z" fill="#d6bb89"/><path d="M79 122Q111 86 145 119L153 171 80 177Z" fill="#343d35"/>'.replace('seventy','70')),
 blanket:bookSVG('<path d="M33 91Q132 53 202 89L221 162Q123 194 40 162Z" fill="#c88467"/><path d="M59 93Q127 68 181 94L199 147Q126 171 62 147Z" fill="#d6bb89"/>'),
 shelf:bookSVG('<path d="M33 91L202  eighty 225 105  fifty 132Z" fill="#b5824e"/><path d="M fifty 124L225 101 225 117  fifty 141Z" fill="#765639"/><path d="M76 137L82 182 94 182 94 135M190 123L181 175 195 176 207 120Z" fill="#765639"/>'.replaceAll('eighty','80').replaceAll('fifty','50')),
 plant:bookSVG('<path d="M120 140Q103 84 144 32M120 100Q67 97 79 57Q117  fifty 120 100M132  seventy Q146 21 181 41Q184 75 132  seventy" fill="#6d8063" stroke="#6d8063" stroke-width="5"/><path d="M seventy 129Q122 118 174 129L160 185Q123 204 85 186Z" fill="#ba765e"/>'.replaceAll('fifty','50').replaceAll('seventy','70'))
});
bookIcons.doll=SB.placed.find(t=>t.type==='friend').svg;bookIcons.sunmat=SB.placed.find(t=>t.type==='sun').svg;bookIcons.hammock=bookIcons.shelf;bookIcons.bug=bookIcons.feather;
for(const [id,svg] of Object.entries(bookIcons)){if(TOOL_META[id])TOOL_META[id].emoji=bookImage(svg);const p=productById(id);if(p)p.emoji=bookImage(svg);if(getItem(id)?.kind==='hand')TOY_EMOJI[id]=bookImage(svg);}
const bookScene=(id,state)=>SB.scenes[`${id}_${state.season}`]||SB.scenes[`${id}_spring`];
function bookTime(state){const hour=new Date().getHours();return hour<6||hour>=19?'night':hour<11?'morning':hour<15?'day':'evening';}
function bookBackground(node,svg){if(node&&svg){node.style.backgroundImage=`url("${bookURI(svg)}")`;node.classList.add('book-background');}}
const bookCrop=(svg,box)=>svg.replace(/viewBox="[^"]+"/,`viewBox="${box}"`);
const placedBeforeBook=renderPlacedItem;
renderPlacedItem=function(placed,state,clue){
 let html=placedBeforeBook(placed,state,clue),svg=bookIcons[placed.itemId];if(!svg)return html;
 const id=placed.itemId,body=getCat(state).body;
 if(id==='bowl')svg=bowlSVG(false,body.foodLevel);if(id==='water')svg=bowlSVG(true,body.waterLevel);
 const t=document.createElement('template');t.innerHTML=html;const el=t.content.querySelector('.placed-item');if(!el)return html;
 el.classList.add('book-furniture');el.style.width=(id==='tower'?90:id==='shelf'||id==='decor_sun'?100:84)+'px';el.style.height=(id==='tower'?150:id==='shelf'||id==='decor_sun'?65:id==='bowl'||id==='water'?45:id==='litter'?65:84)+'px';
 el.insertAdjacentHTML('afterbegin',bookImage(svg,'book-furniture-art'));
 if(id==='litter'&&body.litter)el.insertAdjacentHTML('beforeend','<span class="book-litter-mark">● ●</span>');
 return t.innerHTML;
};
renderFixedWindow=()=>'';
renderPlayToy=id=>`<div class="play-toy" data-play-toy aria-hidden="true">${bookIcons[id]?bookImage(bookIcons[id]):'●'}</div>`;
const oldBookRoam=getAvailableRoamPoints;
getAvailableRoamPoints=function(state){
 const points=oldBookRoam(state),room=getPlaced(getRoom(state));
 const bounds=document.querySelector('[data-room-world]')?.getBoundingClientRect(),w=bounds?.width||375,h=bounds?.height||560;
 for(const p of points){const placed=room.find(x=>x.itemId===p.requiresItem);if(!placed)continue;
  const dims={tower:[90,31],box:[84,19],shelf:[100,29],hammock:[84,38]}[p.requiresItem];if(dims){p.x=placed.x+dims[0]/2/w*100;p.y=placed.y+(dims[1]-67*p.scale)/h*100;}}
 const sun=room.find(p=>p.itemId==='decor_sun');if(sun&&getDurability(state,'decor_sun')>0)points.push({id:'decor_sun',requiresItem:'decor_sun',index:CONFIG.stage1.roamPoints.length+1,x:sun.x+50/w*100,y:sun.y+(29-67*.55)/h*100,scale:.55,distance:'far',surface:'decor_sun'});
 return points;
};
const townBeforeBook=renderTown;
renderTown=function(state){
 const t=document.createElement('template');t.innerHTML=townBeforeBook(state);const map=t.content.querySelector('.town-full-map');
 map.innerHTML=`<button class="book-map-hotspot home" data-action="go-home" ${getCat(state).status==='raising'?'':'disabled'}><strong>おうち</strong></button><button class="book-map-hotspot field" data-action="go-rescue" ${getCat(state).status==='raising'?'disabled':''}><strong>空き地</strong><small>保護する</small></button><div class="book-map-hotspot park"><strong>公園</strong><small>未解放</small></div><div class="book-map-hotspot alley"><strong>商店街の裏路地</strong><small>未解放</small></div><div class="book-map-hotspot mountain"><strong>山</strong><small>未解放</small></div>${[['super','スーパー'],['petshop','ペットショップ'],['clinic','動物病院']].map(([id,name])=>`<button class="book-map-hotspot ${id}" data-action="open-map-shop" data-shop="${id}"><strong>${name}</strong></button>`).join('')}`;
 bookBackground(map,bookScene('map',state));return t.innerHTML;
};
const fieldBeforeBook=renderField;
renderField=state=>fieldBeforeBook(state).replaceAll('住宅街','空き地');
const bookRenderBefore=render;
render=function(state){
 bookRenderBefore(state);app.classList.add('storybook');
 // Replace icons in existing controls without replacing their event targets.
 app.querySelectorAll('[data-item]').forEach(el=>{const svg=bookIcons[el.dataset.item];if(!svg)return;const icon=el.querySelector('.emoji,.big-emoji,.shop-product>span:first-child');if(icon)icon.innerHTML=bookImage(svg);});
 const world=app.querySelector('[data-room-world]');if(world){world.classList.add('book-room');bookBackground(world,SB.rooms[`${state.season}_${bookTime(state)}`]||SB.rooms.spring_day);}
 bookBackground(app.querySelector('.title-screen'),bookScene('opening',state)?.replace('<svg ','<svg preserveAspectRatio="xMidYMid slice" '));
 const area={a1:'field',a2:'park',a3:'alley',a4:'mountain'}[state.campaign.area]||'field';
 bookBackground(app.querySelector('.field-scene'),bookScene(area,state));bookBackground(app.querySelector('.capture-inspect'),bookScene(area,state));
 for(const selector of ['.exam-room','.naming-portrait','.diagnosis-visual'])bookBackground(app.querySelector(selector),bookScene('clinic',state));
 bookBackground(app.querySelector('.graduation-stage'),bookScene('adoption',state));
 const shop=app.querySelector('.shop-sheet');if(shop){const id=state.campaign.shopId||'super';const hero=document.createElement('div');hero.className='book-shop-scene';hero.setAttribute('aria-label',id==='super'?'店員とレジのあるスーパー':id==='clinic'?'動物病院':'店員の肩に鳥がいるペットショップ');bookBackground(hero,bookCrop(bookScene(id==='clinic'?'clinic':id,state),'0 45 450 510'));shop.prepend(hero);}
 app.querySelectorAll('.campaign-place .place-chip,.screen-guide').forEach(n=>{const walker=document.createTreeWalker(n,NodeFilter.SHOW_TEXT);while(walker.nextNode())walker.currentNode.textContent=walker.currentNode.textContent.replaceAll('住宅街','空き地');});
};
const style=document.createElement('style');style.textContent=`
.storybook{--pink:#b77d63;--pink-dark:#94664f;--ink:#343d35;--paper:#f6edda;--line:#d8d6c4}
.book-background{background-size:100% 100%!important;background-position:center!important;background-repeat:no-repeat!important}
.book-icon{width:100%;height:100%;max-width:58px;max-height:58px;object-fit:contain;pointer-events:none;vertical-align:middle}
.command-emoji .book-icon{width:42px;height:42px}.play-toy .book-icon{width:64px;height:64px;max-width:none;max-height:none}.layout-palette-item .emoji .book-icon{width:36px;height:31px}.big-emoji .book-icon{height:48px;width:58px}.shop-product>span:first-child{height:58px;display:block}
.book-room>.wall,.book-room>.floor,.book-room>.curtain{display:none!important}.book-room{background-color:#eee6d1}
.book-furniture{background:none!important;border:0!important;border-radius:0!important;box-shadow:none!important;overflow:visible!important;transform:none!important}
.book-furniture:before,.book-furniture:after,.book-furniture>:not(.book-furniture-art):not(.damage-visual):not(.book-litter-mark){display:none!important}.book-furniture-art{width:100%;height:100%;object-fit:fill;pointer-events:none}.book-furniture.wear-2 .book-furniture-art{opacity:.8;filter:saturate(.65)}.book-furniture.wear-3 .book-furniture-art,.book-furniture.broken .book-furniture-art{opacity:.6;filter:saturate(.35)}.book-litter-mark{position:absolute;left:32%;top:34%;color:#765639;font-size:12px;pointer-events:none}
.book-map-hotspot{position:absolute;border:0;border-radius:8px;background:#f6eddaeb;padding:4px 6px;color:#343d35;font-size:10px;text-align:center;min-height:36px;min-width:58px;transform:translate(-50%,-50%)}.book-map-hotspot strong{font-size:11px}.book-map-hotspot small{display:block;font-size:8px;color:#7d806e}.book-map-hotspot.home{left:21%;top:86%}.book-map-hotspot.field{left:55%;top:66%}.book-map-hotspot.park{left:62%;top:29%}.book-map-hotspot.alley{left:24%;top:43%}.book-map-hotspot.mountain{left:25%;top:17%}.book-map-hotspot.super{left:14%;top:65%}.book-map-hotspot.petshop{left:52%;top:48%}.book-map-hotspot.clinic{left:74%;top:91%}.book-map-hotspot:disabled{opacity:.6}.town-full-map:before,.town-full-map:after{display:none!important}
.storybook .field-scene{min-height:310px;height:52dvh;border-radius:0}.storybook .field-scene:before,.storybook .field-scene:after,.storybook .field-bush{display:none!important}.storybook .field-eyes,.storybook .field-tail{right:18%;top:54%}.storybook .trap-status{top:9%;bottom:auto;pointer-events:none}
.storybook .title-screen{position:relative;padding-top:30px}.storybook .title-screen .intro-illustration{position:absolute;left:16%;top:46%;width:58%;height:35%;background:none;box-shadow:none}.storybook .title-screen .intro-illustration:before,.storybook .title-screen .intro-illustration:after{display:none}.storybook .title-actions{margin-top:auto;position:relative;z-index:2;width:100%}.storybook .title-screen h1{margin:8px 0}.storybook .title-screen p{font-size:12px}
.storybook .exam-room,.storybook .naming-portrait,.storybook .diagnosis-visual{border-radius:0;box-shadow:none}.storybook .exam-room{height:370px;width:100%}.storybook .exam-room:before,.storybook .exam-table{display:none}.storybook .exam-cat{position:absolute;left:21%;top:13%;width: sixty%;height:43%;transform:none}.storybook .naming-portrait{width:100%;height:350px;position:relative}.storybook .naming-portrait>.game-cat-svg,.storybook .diagnosis-visual>.game-cat-svg{position:absolute;left:19%;top:12%;width:62%!important;height:43%!important}.storybook .diagnosis-visual{position:relative;height:260px}.storybook .exam-status{z-index:2}.storybook .vet-hand{z-index:3}.storybook .naming-scene{width:100%;gap:8px}.storybook .naming-question h1{font-size:20px}
.book-shop-scene{height:auto;aspect-ratio:450/510;width:100%;flex-shrink:0}.storybook .shop-sheet{padding-top:0}.storybook .shop-products{padding-bottom:12px}.storybook .release-shop-heading{margin-top:8px}.storybook .graduation-stage:before{display:none}.storybook .graduation-cat{left:38%;top:30%;width:28%;height:25%;transform:none}
.storybook .clinic-sequence{display:block;padding:0;width:100%}.storybook .exam-room{height:auto;aspect-ratio:450/760;max-height:none;width:100%}.storybook .naming-portrait{height:auto;aspect-ratio:450/600;width:100%;background-size:cover!important}.storybook .diagnosis-visual{height:auto;aspect-ratio:450/600;background-size:cover!important}
`.replace('sixty%','60%');document.head.append(style);

