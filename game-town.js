'use strict';
// The map is the one intentionally scrollable scene. UI and progress remain HTML.
const AREA_COPY={a1:'街の草むらで、成猫との出会いが待っています。',a2:'街の小さな憩いの場所。子猫に出会えることも。',a3:'お店の裏にひそむ、小さな気配。ケガや病気の猫に出会うことも。',a4:'さまざまな柄や年齢の猫たちに、何度でも出会える場所。'};
let townScrollTop=null;

// Buildings keep their own viewBox. Only the ground and connecting paths fill the viewport.
const TOWN_BUILDING_ART={"petshop":["275 1665 160 150","\n<path fill=\"#f0e5c8\" d=\"M290 1719h127v88H290z\"/><path fill=\"#879d76\" d=\"M280 1723l75-53 74 53Z\"/><use href=\"#paw\" transform=\"translate(355 1701)\"/>\n<path class=\"window\" d=\"M302 1738h43v43h-43z\"/><path fill=\"#a98a61\" d=\"M366 1735h32v72h-32z\"/><path fill=\"#87856d\" d=\"M315 1775v-17l6 4 7-4 5 17Z\"/>\n\n"],"clinic":["15 1893 150 118","\n<path fill=\"#f6edd6\" d=\"M28 1916h124v88H28z\"/><rect x=\"21\" y=\"1899\" width=\"138\" height=\"21\" rx=\"3\" fill=\"#98b4ae\"/>\n<path fill=\"#729ba3\" d=\"M85 1929h12v11h11v12H97v11H85v-11H74v-12h11Z\"/>\n<path class=\"window\" d=\"M42 1966h28v27H42zM93 1967h40v37H93z\"/><path stroke=\"#f9efdb\" stroke-width=\"3\" d=\"M113 1968v36\"/>\n\n"],"event":["273 1880 160 130","\n<path fill=\"#f0e3c5\" d=\"M290 1930h126v72H290z\"/><path fill=\"#bd907b\" d=\"M278 1930l75-44 75 44Z\"/><path fill=\"#f4dfb9\" d=\"M353 1886l-23 44h46Z\"/>\n<path d=\"M294 1930v75m118-75v75\" stroke=\"#9d835f\" stroke-width=\"5\"/><rect x=\"326\" y=\"1940\" width=\"51\" height=\"47\" rx=\"3\" fill=\"#fff4d9\"/><use href=\"#paw\" transform=\"translate(351 1960)\"/>\n\n"],"home":["0 2065 250 225","\n\n<path fill=\"#f8edd2\" d=\"M66 2130l61-45 61 45v96H66Z\"/><path fill=\"none\" stroke=\"#c48968\" stroke-width=\"12\" d=\"M54 2135l73-61 73 61\"/>\n<path class=\"window\" d=\"M84 2138h32v37H84z\"/><path stroke=\"#8d724e\" stroke-width=\"5\" fill=\"none\" d=\"M82 2136h36v41H82z\"/><path stroke=\"#f6edd6\" stroke-width=\"3\" d=\"M100 2140v34m-15-18h30\"/><path fill=\"#866747\" d=\"M146 2180h30v46h-30z\"/>\n<use href=\"#tree\" transform=\"translate(32 2241)\"/><use href=\"#tree\" transform=\"translate(213 2235) scale(.9)\"/><use href=\"#bush\" transform=\"translate(69 2246)\"/>\n\n"],"house":["0 0 110 100","<path fill=\"#eadfc7\" d=\"M10 30h88v65H10z\"/><path fill=\"#899f90\" d=\"M0 34L54 0l54 34Z\"/><path class=\"window\" d=\"M20 45h23v23H20zm43 0h23v23H63z\"/><path fill=\"#a98a61\" d=\"M46 70h21v25H46z\"/>"],"tree":["-50 -110 100 120","<use href=\"#tree\"/>"],"plaza":["159 1845 128 136","<ellipse cx=\"223\" cy=\"1912\" rx=\"59\" ry=\"62\" fill=\"#e8d5ad\"/><ellipse cx=\"223\" cy=\"1912\" rx=\"43\" ry=\"46\" fill=\"none\" stroke=\"#caba95\" stroke-width=\"2\" stroke-dasharray=\"5 9\"/>\n<ellipse cx=\"223\" cy=\"1919\" rx=\"22\" ry=\"13\" fill=\"#aeb59a\"/><ellipse cx=\"223\" cy=\"1913\" rx=\"20\" ry=\"10\" fill=\"#bad4cb\"/><path fill=\"#899981\" d=\"M215 1913l2-28-5-10 12 5 9-5-3 14 5 24Z\"/>\n"],"park":["205 990 215 170","\n<g transform=\"translate(183 432) scale(.6)\">\n<ellipse cx=\"218\" cy=\"1072\" rx=\"159\" ry=\"96\" fill=\"#a2bc8c\"/>\n<ellipse cx=\"218\" cy=\"1072\" rx=\"118\" ry=\"69\" fill=\"none\" stroke=\"#e9d9ad\" stroke-width=\"22\"/>\n<path fill=\"#9cc3c3\" d=\"M166 1040Q214 1001 277 1047Q314 1081 263 1107Q198 1138 160 1097Q139 1063 166 1040Z\"/>\n<path d=\"M180 1054q23-6 41 0m19 34q22-6 39 0\" stroke=\"#c6dddd\" stroke-width=\"3\" fill=\"none\"/>\n<use href=\"#tree\" transform=\"translate(72 1046) scale(.9)\"/><use href=\"#tree\" transform=\"translate(340 1045)\"/><use href=\"#tree\" transform=\"translate(99 1163) scale(.75)\"/>\n<path d=\"M320 1127h57m-52-10h46m-41-7v38m35-38v38\" stroke=\"#937953\" stroke-width=\"6\"/>\n<use href=\"#bush\" transform=\"translate(293 1170)\"/>\n<path d=\"M55 1176H379M63 1160v26m45-26v26m45-26v26m45-26v26m45-26v26m45-26v26m45-26v26m38-26v26\" stroke=\"#8e9279\" stroke-width=\"4\"/>\n<path d=\"M125 1138l15-49h43l17 49M145 1090v29m30-29v29m-36 0h43\" fill=\"none\" stroke=\"#b28e6c\" stroke-width=\"5\"/>\n</g>\n\n"],"field":["0 1340 240 165","\n<g transform=\"translate(-10 560) scale(.6)\">\n<path fill=\"#c9bea2\" d=\"M20 1320h90v82H20zm280-10h87v88h-87z\"/><path d=\"M15 1320h99m181-10h97\" stroke=\"#a09076\" stroke-width=\"10\"/>\n<path class=\"window\" d=\"M40 1340h22v28H40zm288-10h25v30h-25z\"/>\n<path fill=\"#d7bd89\" d=\"M75 1380L322 1354L361 1501L94 1542L60 1465Z\"/>\n<path d=\"M76 1382l233-24M84 1364v48m49-55v46m49-52v45m48-51v45m50-49v44\" stroke=\"#95805b\" stroke-width=\"6\" fill=\"none\"/>\n<path d=\"M136 1460l74-8m26 42l56-5m-124 25l33-3\" stroke=\"#c4a779\" stroke-width=\"3\"/>\n<use href=\"#bush\" transform=\"translate(93 1450) scale(1.4)\"/><use href=\"#bush\" transform=\"translate(315 1500) scale(1.5)\"/><use href=\"#bush\" transform=\"translate(276 1400)\"/>\n<path fill=\"#7d8060\" d=\"M288 1492l-5-18 14 7 13-9-2 20Z\"/><circle cx=\"295\" cy=\"1486\" r=\"2\" fill=\"#e9d597\"/><circle cx=\"304\" cy=\"1485\" r=\"2\" fill=\"#e9d597\"/>\n</g>\n\n"],"alley":["10 548 230 155","\n<g transform=\"translate(-10 224) scale(.6)\">\n<path fill=\"#b4ad94\" d=\"M181 578h91v212h-91z\"/><path fill=\"#ddc7a1\" d=\"M210 578h30l32 212h-91Z\"/>\n<path fill=\"#c4b99d\" d=\"M51 564h131v189H51z\"/><path fill=\"#dcd0b0\" d=\"M272 555h125v209H272z\"/>\n<path fill=\"#958f76\" d=\"M44 553h145v19H44zM264 544h140v19H264z\"/>\n<path class=\"window\" d=\"M71 594h34v40H71zM127 594h34v40h-34zM291 580h34v43h-34zM346 580h32v43h-32zM72 666h33v37H72zM346 665h32v40h-32z\"/>\n<path d=\"M173 579v132h-23M277 574v173h27\" stroke=\"#9b957e\" stroke-width=\"6\" fill=\"none\"/>\n<rect x=\"140\" y=\"717\" width=\"34\" height=\"39\" rx=\"5\" fill=\"#8b9c81\"/><path d=\"M135 717h43\" stroke=\"#6e826d\" stroke-width=\"5\"/>\n<path fill=\"#af9064\" d=\"M279 722h36v37h-36z\"/><path stroke=\"#d8bb87\" stroke-width=\"3\" d=\"M279 722l36 37m0-37l-36 37\"/>\n<path fill=\"#77755e\" d=\"M223 757l-6-14 11 4 10-6-1 17Z\"/>\n<!-- Air conditioner and back door distinguish this from a residential entrance. -->\n<rect x=\"57\" y=\"705\" width=\"47\" height=\"28\" rx=\"3\" fill=\"#e4ddc9\" stroke=\"#a29a82\" stroke-width=\"2\"/><circle cx=\"77\" cy=\"719\" r=\"9\" fill=\"none\" stroke=\"#a29a82\" stroke-width=\"2\"/><path d=\"M109 688h33v65h-33z\" fill=\"#91866c\"/>\n</g>\n\n"],"mountain":["20 70 420 355","\n\n<path fill=\"#91a58a\" d=\"M29 320L135 120L205 241L287 88L429 320Z\"/>\n<path fill=\"#748f79\" d=\"M132 320L287 88L429 320Z\"/>\n<path fill=\"#e5e6cc\" d=\"M244 153L287 88L329 158L299 141L281 156L268 143Z\"/>\n<path fill=\"#d8dfbd\" d=\"M110 169L135 120L166 174L143 165L133 174L124 162Z\"/>\n<path d=\"M221 326l39-40-11-30 42-33-9-31\" fill=\"none\" stroke=\"#ddc79c\" stroke-width=\"13\" stroke-linecap=\"round\"/>\n<use href=\"#pine\" transform=\"translate(67 364)\"/><use href=\"#pine\" transform=\"translate(361 366) scale(1.1)\"/><use href=\"#pine\" transform=\"translate(397 402) scale(.7)\"/>\n\n\n"]};
function townBuilding(kind){
 const [box,content]=TOWN_BUILDING_ART[kind];
 const prefix='town-'+kind+'-';
 const art=('<defs>'+"\n <style>text{font-family:'Yu Gothic',sans-serif;fill:#66553f;text-anchor:middle}.name{font-size:17px;font-weight:600}.sub{font-size:12px;fill:#7f8067}.tag{fill:#fff8e8;stroke:#d8c6a2;stroke-width:1}.road{fill:none;stroke:#dfc69b;stroke-width:36;stroke-linecap:round;stroke-linejoin:round}.window{fill:#abc9c9;stroke:#f8eed6;stroke-width:4}</style>\n <g id=\"tree\"><path d=\"M0 0V-57M0-30l-15-12M0-20l16-12\" stroke=\"#8b7450\" stroke-width=\"6\" fill=\"none\" stroke-linecap=\"round\"/><path fill=\"#91a97b\" d=\"M-25-32Q-45-56-22-72Q-24-96 0-98Q30-99 28-72Q48-48 24-31Q0-21-25-32\"/><path d=\"M0-26v-43m0 19l-13-12m13 23l14-11\" stroke=\"#7a9068\" stroke-width=\"3\" fill=\"none\"/></g>\n <g id=\"pine\"><path stroke=\"#8c7954\" stroke-width=\"6\" d=\"M0 0v-58\"/><path fill=\"#7f986e\" d=\"M0-107L-27-62H-17L-36-24H36L17-62H27Z\"/></g>\n <g id=\"bush\"><ellipse rx=\"28\" ry=\"15\" fill=\"#b0bf8b\"/><circle cx=\"-10\" cy=\"-5\" r=\"4\" fill=\"#e3b5a3\"/><circle cx=\"-4\" cy=\"0\" r=\"4\" fill=\"#e3b5a3\"/></g>\n <g id=\"paw\" fill=\"#806849\"><ellipse cy=\"5\" rx=\"9\" ry=\"7\"/><ellipse cx=\"-11\" cy=\"-5\" rx=\"4\" ry=\"5\"/><ellipse cx=\"-4\" cy=\"-12\" rx=\"4\" ry=\"5\"/><ellipse cx=\"6\" cy=\"-11\" rx=\"4\" ry=\"5\"/><ellipse cx=\"13\" cy=\"-3\" rx=\"4\" ry=\"5\"/></g>\n <g id=\"label\"><rect class=\"tag\" x=\"-70\" y=\"-18\" width=\"140\" height=\"38\" rx=\"14\"/></g>\n"+'</defs>'+content).replace(/id="/g,'id="'+prefix).replace(/href="#/g,'href="#'+prefix);
 return '<svg class="town-building-art" viewBox="'+box+'" preserveAspectRatio="xMidYMid meet" aria-hidden="true">'+art+'</svg>';
}
function townGround(){return `<svg class="town-ground" viewBox="0 0 450 690" preserveAspectRatio="none" aria-hidden="true">
<path fill="#ccd1b3" d="M0 0H450V690H0Z"/>
<path fill="#c2cbaa" d="M0 0H450V95Q300 130 150 77T0 102Z"/>
<path fill="#bdcba7" d="M0 485Q95 444 192 524T450 523V690H0Z"/>
<g fill="none" stroke="#dfc69b" stroke-width="34" stroke-linecap="round" stroke-linejoin="round">
<path d="M225 -20Q172 88 220 183T225 347Q263 432 216 505T170 710"/>
<path d="M220 183L285 185M216 505L345 440M216 505L88 510M216 580L348 600"/>
</g><path d="M225 0Q201 48 205 87" fill="none" stroke="#ece0b9" stroke-width="4" stroke-dasharray="4 16" stroke-linecap="round"/>
<path fill="#e3caa0" d="M212 650L190 690H250L241 650Z"/>
</svg>
<div class="town-decor town-house-one">${townBuilding('house')}</div>
<div class="town-decor town-house-two">${townBuilding('house')}</div>
<div class="town-decor town-house-three">${townBuilding('house')}</div>
<div class="town-decor town-plaza">${townBuilding('plaza')}</div>
<div class="town-decor town-tree">${townBuilding('tree')}</div>`;}

function rescueGround(summit=false){return `<svg class="town-ground" viewBox="0 0 450 690" preserveAspectRatio="none" aria-hidden="true">
<path fill="#c2cbaa" d="M0 0H450V690H0Z"/>
<path fill="#ccd1b3" d="M0 85Q130 18 290 106T450 90V420Q300 350 130 426T0 400Z"/>
<path fill="none" stroke="#dfc69b" stroke-width="34" d="${summit?'M225 175Q225 245 225 345T225 518Q258 605 225 710':'M225 -20Q180 70 225 173T225 345T225 518Q258 605 225 710'}"/>
<path fill="none" stroke="#dfc69b" stroke-width="24" stroke-linecap="round" d="M230 179L327 208M230 522L126 554"/>
<path fill="none" stroke="#ece0b9" stroke-width="4" stroke-linecap="round" stroke-dasharray="3 21" d="${summit?'M225 575Q245 630 225 690':'M225 0Q200 70 225 145M225 575Q245 630 225 690'}"/>
</svg>`;}
const townFaceCache=new Map();
function townProgressFaces(state,id){
 const p=stageProgress(state,id),records=stageRecords(state).filter(e=>(e.area||'a1')===id);
 if(p.total===null&&!records.length)return '';
 const count=p.total??Math.min(records.length,16);
 const silhouette='<path d="M9 36L4 6 23 18 44 3 41 36Z" fill="currentColor"/>';
 return `<div class="town-cat-goal" style="--goal-columns:${Math.min(count,8)}" role="img" aria-label="${p.total===null?p.done+'匹の記録':p.total+'匹の目標、'+Math.min(p.done,p.total)+'匹達成'}">${Array.from({length:count},(_,i)=>{
  const record=records[i];
  if(record?.phenotype){
   const key=JSON.stringify(record.phenotype);
   if(!townFaceCache.has(key)){
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    const rig=CatSVG.buildCat(svg,'goal',{...CatSVG.defaults,...record.phenotype});
    svg.querySelectorAll('.part-outline').forEach(n=>n.remove());
    townFaceCache.set(key,'<svg viewBox="-85 -85 170 145" aria-hidden="true">'+svg.querySelector('defs').outerHTML+rig.nodes.headRig.outerHTML+'</svg>');
   }
   return '<span class="town-goal-face complete">'+townFaceCache.get(key)+'</span>';
  }
  return '<span class="town-goal-face '+(record?'complete legacy':'empty')+'"><svg viewBox="0 0 48 48" aria-hidden="true">'+silhouette+'</svg></span>';
 }).join('')}</div>`;
}
renderTown=function(state){
 const cat=getCat(state),visit=state.campaign.requiredVisit;
 const area=(id,cls)=>{
  const p=stageProgress(state,id),access=stageAccess(state,id);
  return `<section class="town-area-scene ${cls}">
   <div class="town-area-art">${townBuilding(cls)}</div>
   <article class="town-area ${cls}">
    <strong class="town-sign">${stageName(id)}</strong>
    <p>${AREA_COPY[id]}</p>
    ${access.unlocked?townProgressFaces(state,id):''}
    <button class="town-area-go campaign-button" data-action="choose-area" data-area="${id}" ${visit||!access.unlocked?'disabled':''}>${access.unlocked?'保護しに行く':'調査中'}</button>
   </article></section>`;
 };
 const clinicAction=visit?.kind==='clinic'?'open-required-visit':'open-map-shop';
 return `<section class="campaign-frame town-scroll-frame" aria-label="街の地図"><header class="campaign-hud"><div class="campaign-place"><span class="place-chip">街</span><strong>ホゴネコ</strong></div><span class="campaign-wallet">${DAY_LABELS[state.week.dayOfWeek]}曜日　💰 ${state.coins}</span></header><main data-featured-stop="${['a4','a3','a2','a1'].findIndex(id=>stageAccess(state,id).unlocked)*.5}" class="town-map-scroll" aria-label="街と保護エリアの地図" tabindex="0"><section class="town-map-page area-pair summit-page">${rescueGround(true)}${area('a4','mountain')}${area('a3','alley')}</section><section class="town-map-page area-pair">${rescueGround()}${area('a2','park')}${area('a1','field')}</section><section class="town-map-page town-map-world"><div class="town-map-composition">${townGround()}<button class="town-destination petshop" data-action="open-map-shop" data-shop="petshop" ${visit?'disabled':''}>${townBuilding('petshop')}<span class="town-sign">ペットショップ</span></button><button class="town-destination clinic" data-action="${clinicAction}" data-shop="clinic" ${visit?.kind==='event'?'disabled':''}>${townBuilding('clinic')}<span class="town-sign">動物病院</span></button><button class="town-destination event" data-action="${visit?.kind==='event'?'open-required-visit':'open-plaza'}">${townBuilding('event')}<span class="town-sign">ふれあい広場</span></button><button class="town-destination home" data-action="go-home" ${cat.status==='raising'&&!visit?'':'disabled'}><span class="town-home-picture">${townBuilding('home')}<span class="town-sign">おうち</span></span></button></div></section></main></section>`;
};
const townRender=render;
render=function(state){
 const old=app.querySelector('.town-map-scroll');if(old)townScrollTop=old.scrollTop;
 townRender(state);
 townArrowObserver?.disconnect();
 const scroller=app.querySelector('.town-map-scroll');if(scroller){scroller.scrollTop=state.campaign.requiredVisit?scroller.scrollHeight:townScrollTop??scroller.scrollHeight;scroller.addEventListener('scroll',()=>{townScrollTop=scroller.scrollTop;},{passive:true});setupTownScroll(scroller);setupTownArrows(scroller);}
};
let townArrowObserver;
function setupTownArrows(scroller){
 const frame=scroller.closest('.town-scroll-frame');
 const arrows=['up','down'].map(direction=>{const node=document.createElement('div');node.className='town-scroll-hint is-'+direction;node.setAttribute('aria-label',direction==='up'?'上に続く地図があります':'下に続く地図があります');node.innerHTML='<span class="town-swipe-arrows" aria-hidden="true"><i></i><i></i><i></i></span>';frame.append(node);return node;});
 const update=()=>{
  const max=Math.max(0,scroller.scrollHeight-scroller.clientHeight);arrows[0].hidden=scroller.scrollTop<=2||max<=2;arrows[1].hidden=scroller.scrollTop>=max-2||max<=2;arrows[0].style.top=scroller.offsetTop+8+'px';
  const bounds=frame.getBoundingClientRect(),buttons=[...scroller.querySelectorAll('button')].map(n=>n.getBoundingClientRect());
  for(const arrow of arrows){if(arrow.hidden)continue;const r=arrow.getBoundingClientRect();const position=[50,10,90].find(percent=>{const center=bounds.left+bounds.width*percent/100;return buttons.every(b=>r.bottom+6<=b.top||r.top-6>=b.bottom||center+20<=b.left||center-20>=b.right);});arrow.style.left=(position??50)+'%';}
 };
 scroller.addEventListener('scroll',update,{passive:true});townArrowObserver=new ResizeObserver(update);townArrowObserver.observe(scroller);for(const page of scroller.children)townArrowObserver.observe(page);update();
}
// One gesture advances one page; animation timing is independent of browser inertia.
function setupTownScroll(s){
 let busy=false,drag=null,wheelUntil=0;
 const featured=Number(s.dataset.featuredStop);
 const step=(from,direction)=>from>=1.99&&direction<0?featured:Math.max(0,Math.min(2,from+direction*.5));
 const go=(page)=>{
  if(busy)return;
  const from=s.scrollTop,to=Math.max(0,Math.min(2,page))*s.clientHeight;
  const duration=matchMedia('(prefers-reduced-motion:reduce)').matches?0:850;
  busy=true;const start=performance.now();
  const tick=now=>{
   if(!s.isConnected){busy=false;return;}
   const t=duration?Math.min(1,(now-start)/duration):1;
   const eased=t*t*(3-2*t);
   s.scrollTop=from+(to-from)*eased;
   if(t<1)requestAnimationFrame(tick);else{busy=false;townScrollTop=to;}
  };
  requestAnimationFrame(tick);
 };
 s.townGo=go;
 s.addEventListener('wheel',e=>{
  if(Math.abs(e.deltaY)<1)return;
  e.preventDefault();
  const now=performance.now(),blocked=now<wheelUntil;
  wheelUntil=now+180;
  if(busy||blocked)return;
  go(step(Math.round(s.scrollTop/s.clientHeight*2)/2,Math.sign(e.deltaY)));
 },{passive:false});
 s.addEventListener('pointerdown',e=>{
  if(e.pointerType==='mouse'||busy)return;
  drag={y:e.clientY,top:s.scrollTop,page:Math.round(s.scrollTop/s.clientHeight*2)/2,moved:false};
 });
 s.addEventListener('pointermove',e=>{
  if(!drag)return;
  const delta=drag.y-e.clientY;
  if(Math.abs(delta)>8){drag.moved=true;s.setPointerCapture(e.pointerId);}
  if(drag.moved){e.preventDefault();s.scrollTop=Math.max(0,Math.min(2*s.clientHeight,drag.top+delta*.45));}
 });
 const finish=e=>{
  if(!drag)return;
  const d=drag;drag=null;
  if(d.moved){suppressClick=true;setTimeout(()=>suppressClick=false,400);go(Math.abs(d.y-e.clientY)>35?step(d.page,Math.sign(d.y-e.clientY)):d.page);}
 };
 let suppressClick=false;
 s.addEventListener('pointerup',finish);
 s.addEventListener('pointercancel',()=>{if(drag){const page=drag.page;drag=null;go(page);}});
 s.addEventListener('click',e=>{if(suppressClick){e.preventDefault();e.stopImmediatePropagation();}},true);
 s.addEventListener('keydown',e=>{
  if(e.target!==s)return;
  const direction={ArrowUp:-1,PageUp:-1,ArrowDown:1,PageDown:1}[e.key];
  if(direction){e.preventDefault();go(step(Math.round(s.scrollTop/s.clientHeight*2)/2,direction));}
 });
}
const townStyle=document.createElement('style');townStyle.textContent=`
.town-scroll-frame{display:flex;flex-direction:column;height:100%;min-height:0;--town-paper:#fff1d4;--town-ink:#594832}.town-map-scroll{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;touch-action:none;overscroll-behavior:contain;background:#c2cbaa;scrollbar-width:none}.town-map-page{position:relative;height:100%;min-height:100%;}.town-map-composition{position:absolute;inset:0}.town-ground{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}.town-building-art{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}.town-decor{position:absolute;pointer-events:none}.town-house-one{left:4%;top:3%;width:18%;height:12%}.town-house-two{left:10%;top:20%;width:22%;height:14%}.town-house-three{left:5%;top:43%;width:18%;height:12%}.town-plaza{left:37%;top:39%;width:26%;height:20%}.town-tree{left:39%;top:77%;width:17%;height:16%}.area-pair{display:grid;grid-template-rows:1fr 1fr}.town-area-scene{position:relative;min-height:0}.town-area-art{position:absolute;left:0;top:0;width:82%;height:70%;pointer-events:none}.town-area-scene.park .town-area-art,.town-area-scene.mountain .town-area-art{left:auto;right:0}.town-area-scene.mountain .town-area-art{left:0;right:0;top:0;width:100%;height:100%}.town-area.mountain{left:3%;right:30%}.town-area{position:absolute;left:30%;right:3%;top:auto;bottom:3%;transform:none;padding:10px;border:1px solid #cbb78e;border-radius:18px;background:#fff6e5;box-shadow:0 3px 0 #907d5420;color:var(--town-ink);display:flex;flex-direction:column;gap:5px;line-height:1.4}.town-area:before{content:"";position:absolute;left:28%;top:-9px;width:16px;height:16px;background:#fff6e5;border-left:1px solid #cbb78e;border-top:1px solid #cbb78e;transform:rotate(45deg);pointer-events:none}.town-area.park,.town-area.mountain{left:3%;right:30%}.town-area.park:before,.town-area.mountain:before{left:68%}.town-area p{margin:0;font-size:13px}.town-cat-goal{display:grid;grid-template-columns:repeat(var(--goal-columns),minmax(0,24px));justify-content:center;gap:2px;align-items:center}.town-goal-face{display:block;aspect-ratio:1;color:#d6cdb7;min-width:0}.town-goal-face svg{display:block;width:100%;height:100%}.town-goal-face.legacy{color:#748d60}.town-area .town-area-go{min-height:44px;width:100%;padding:8px 4px;border:0;border-radius:22px;background:#657d57;color:#fff8e9;font-size:13px;box-shadow:0 2px 0 #4b6543;cursor:pointer}.town-area .town-area-go:disabled{background:#e8dfc9;color:#8a7b60;box-shadow:none;cursor:default}
.town-sign{display:inline-block;background:var(--town-paper);color:var(--town-ink);border:1px solid #a78b62;border-bottom:3px solid #a78b62;border-radius:3px;padding:5px 8px;box-shadow:1px 2px 0 #8e775b22;font-size:13px;letter-spacing:0;white-space:nowrap;line-height:1.4;text-shadow:none}.town-area strong{font-size:16px;align-self:flex-start;border:0;background:none;padding:0;box-shadow:none}.town-destination{position:absolute;border:0;background:none;box-shadow:none;padding:0;display:flex;align-items:flex-end;justify-content:flex-end;cursor:pointer}.town-destination .town-sign{position:absolute;right:0;bottom:-4px;transform:rotate(-2deg)}.town-destination.petshop{left:62%;top:52%;width:33%;height:20%}.town-destination.clinic{left:4%;top:65%;width:31%;height:18%}.town-destination.event{left:62%;top:77%;width:32%;height:18%}.town-destination.home{left:31%;top:10%;width:59%;height:28%}.town-home-picture{position:absolute;left:0;top:50%;width:100%;aspect-ratio:250/225;transform:translateY(-50%)}.town-destination.home .town-sign{right:13%;bottom:16%;transform:rotate(-2deg)}.town-destination:disabled{opacity:.65;cursor:default}.town-scroll-frame{position:relative}.town-scroll-hint{position:absolute;left:50%;transform:translateX(-50%);pointer-events:none;z-index:36;filter:drop-shadow(0 1px 2px #fff8e8)}.town-scroll-hint[hidden]{display:none}.town-scroll-hint.is-down{bottom:8px;transform:translateX(-50%) rotate(180deg)}.town-swipe-arrows{position:relative;display:block;width:28px;height:48px}.town-swipe-arrows i{position:absolute;left:5px;width:18px;height:18px;border-left:3px solid #698153;border-top:3px solid #698153;transform:rotate(45deg);animation:town-swipe-flow 1.6s ease-in-out infinite}.town-swipe-arrows i:nth-child(1){top:3px}.town-swipe-arrows i:nth-child(2){top:15px;animation-delay:.2s}.town-swipe-arrows i:nth-child(3){top:27px;animation-delay:.4s}@keyframes town-swipe-flow{0%,100%{opacity:.25;transform:translateY(5px) rotate(45deg)}50%{opacity:1;transform:translateY(-4px) rotate(45deg)}}@media(prefers-reduced-motion:reduce){.town-swipe-arrows i{animation:none;opacity:.8}}.town-area:focus-visible,.town-destination:focus-visible{outline:3px solid #657d57;outline-offset:4px}.town-scroll-frame .screen-guide{display:none}
`;document.head.append(townStyle);

