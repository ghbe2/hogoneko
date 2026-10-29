'use strict';
if(gameState.ui.modal==='surgeryCheck')gameState={...gameState,ui:{...gameState.ui,modal:null}};
// Room observations are not diagnoses. A fresh examination is made at each visit.
const clinicReducer=reduceGameState;
reduceGameState=function(state,action){
 if(action.type==='OPEN_PLAZA')return {...state,campaign:{...state.campaign,phase:'shop',shopId:'plaza',shopReturnPhase:null},ui:{...state.ui,modal:null,shopCart:{},layoutMode:false}};
 if(action.type==='OPEN_SURGERY_CHECK')action={type:'OPEN_MAP_SHOP',shopId:'clinic'};
 if(action.type==='OPEN_MAP_SHOP'&&action.shopId==='clinic')return {...state,campaign:{...state.campaign,phase:'shop',shopId:'clinic',clinicReception:true,clinicExamined:false,shopReturnPhase:null},ui:{...state.ui,modal:null,layoutMode:false,shopCart:{}}};
 if(action.type==='EXAMINE_CAT'){
  if(state.campaign.phase!=='shop'||state.campaign.shopId!=='clinic'||getCat(state).status!=='raising')return state;
  return {...state,campaign:{...state.campaign,clinicExamined:true}};
 }
 if(action.type==='TREAT_CAT'&&!state.campaign.clinicExamined)return state;
 if(action.type==='CLINIC_MENU')return {...state,campaign:{...state.campaign,clinicReception:true,clinicExamined:false,medicalStage:null}};
 if(action.type==='GO_SURGERY'){
  if(state.campaign.phase!=='shop'||state.campaign.shopId!=='clinic'||getCat(state).status!=='raising'||getCat(state).surgery?.status==='in_progress')return state;
  return {...state,campaign:{...state.campaign,clinicReception:false,medicalStage:getCat(state).surgery?.status==='done'?'receipt':'consult',requiredVisit:null},ui:{...state.ui,modal:null,layoutMode:false}};
 }
 return clinicReducer(state,action);
};
const clinicShop=renderMapShop;
// The same reception layout is shared by both facilities and every visit state.
function receptionArt(kind){
 const clinic=kind==='clinic'||kind==='doctor',doctor=kind==='doctor',coat=doctor?'#f6f1e2':clinic?'#91a69a':'#839575',wall=clinic?'#d7ddcc':'#e5ddc4';
 const art=`<svg viewBox="0 0 450 300" preserveAspectRatio="${clinic?'xMidYMid meet':'xMidYMin slice'}" aria-hidden="true"><rect width="450" height="300" fill="${wall}"/><path d="M0 220H450V300H0Z" fill="#cfb58c"/>
 <rect x="24" y="29" width="150" height="158" rx="3" fill="#b4a17b"/><rect x="31" y="36" width="136" height="144" fill="#f7edd7"/>
 ${clinic?'<path d="M90 53H108V72H127V90H108V109H90V90H71V72H90Z" fill="#90a9a0"/><path d="M56 133H144M56 146H130M56 159H137" stroke="#c2c8b3" stroke-width="4" stroke-linecap="round"/>':'<rect x="38" y="43" width="122" height="130" fill="#b8ccd0"/><path d="M38 138Q78 89 111 135Q137 112 160 139V173H38Z" fill="#a3b38c"/><path d="M97 43V174M38 108H160" stroke="#f6eed9" stroke-width="7"/><path d="M195 28Q291 66 443 28" fill="none" stroke="#ac9776" stroke-width="2"/><path d="M212 33L242 40 224 59Z" fill="#c78e74"/><path d="M270 44L300 44 288 64Z" fill="#96a582"/><path d="M332 41L363 36 350 58Z" fill="#d1b57b"/>'}
 <rect x="385" y="104" width="42" height="121" fill="#b9c3aa"/><path d="M390 146H422M390 185H422" stroke="#e5e9d5" stroke-width="3"/>
 <g class="reception-staff" ${clinic?'transform="translate(-82 -58.75) scale(1.25)"':''}><path d="M272 233L279 163Q285 148 328 148Q371 151 377 173L386 234Z" fill="${coat}"/><path d="M306 147L314 175 330 148" fill="#c19376"/>
 ${doctor?'<path d="M300 152L307 184 286 168M338 152L329 184 350 169" fill="#e0e3d7"/><path d="M299 156Q290 195 308 196M339 156Q345 194 325 196" fill="none" stroke="#78958d" stroke-width="3"/><circle cx="317" cy="198" r="8" fill="#849c91"/><circle cx="317" cy="198" r="4" fill="#d9dfce"/>':clinic?'<path d="M300 151l14 24 19-24-5 38h-20Z" fill="#fff7e5"/><rect x="344" y="179" width="23" height="13" rx="2" fill="#fff7e5"/><path d="M348 184h14m-14 4h8" stroke="#60796c" stroke-width="1.5"/>':'<path d="M295 160L291 233H358L347 159 337 173 306 172Z" fill="#657d57"/><rect x="317" y="184" width="26" height="15" rx="2" fill="#f1e5cd"/><path d="M323 191H336" stroke="#9ea68b" stroke-width="2"/>'}
 <g class="reception-staff-head">${clinic?'<path d="M281 111Q272 62 316 63Q354 57 361 102L350 153 291 154Z" fill="#6c6252"/><path d="M289 100Q292 76 324 80Q352 85 348 117L342 140Q326 159 304 143Q289 136 289 100Z" fill="#cea487"/><path d="M283 109Q278 76 301 73Q318 58 342 76Q360 88 349 111L337 93 319 89 298 104 296 123Z" fill="#6c6252"/>':'<path d="M350 103Q377 80 379 114L370 152 350 139Z" fill="#ac7950"/><path d="M290 100Q286 78 320 77Q351 78 354 105L350 131Q339 153 316 149Q291 143 290 119Z" fill="#dfb596"/><path d="M286 113Q272 91 288 78Q286 64 307 64Q328 51 347 71Q367 73 360 107L345 99 337 82 325 99 312 86 300 107 294 119Z" fill="#ac7950"/><path d="M349 104L360 100" stroke="#708969" stroke-width="5"/><ellipse cx="300" cy="128" rx="6" ry="3" fill="#d69f83"/><ellipse cx="339" cy="129" rx="6" ry="3" fill="#d69f83"/>'}
 <g class="reception-staff-eyes"><path d="M303 115L310 114M329 114L336 115" fill="none" stroke="#514a3c" stroke-width="2.5" stroke-linecap="round"/></g>
 ${clinic?'<g fill="none" stroke="#8e8268" stroke-width="1.5"><rect x="298" y="107" width="17" height="15" rx="6"/><rect x="325" y="107" width="17" height="15" rx="6"/><path d="M315 113H325"/></g>':''}
 <path d="M311 133Q319 139 328 132" fill="none" stroke="#956e59" stroke-width="2" stroke-linecap="round"/></g>
 <g class="reception-staff-hand"><path d="M284 202L309 219 297 230 269 219Z" fill="${coat}"/><path d="M298 218Q308 213 318 220L329 224Q333 232 319 234L298 231Z" fill="#cea487"/></g></g>
 <path d="M192 226L450 221V239L188 245Z" fill="#98734f"/><path d="M193 241L450 235V300H193Z" fill="#c7a779"/><path d="M202 246H443" stroke="#dec49a" stroke-width="3"/>
 <path d="M231 219L267 219 274 233 226 234Z" fill="#f1e6cd"/><text x="250" y="230" text-anchor="middle" fill="#736449" font-size="10" font-family="Meiryo,sans-serif">受付</text><rect x="346" y="222" width="41" height="7" rx="1" fill="#e8dbc1"/><path d="M351 218L382 221" stroke="#738776" stroke-width="3" stroke-linecap="round"/>
 </svg>`;
 const doc=new DOMParser().parseFromString(art,'image/svg+xml'),svg=doc.documentElement,staff=svg.querySelector('.reception-staff'),head=svg.querySelector('.reception-staff-head');
 // Rear hair belongs behind the neck and uniform, never in front of the collar.
 if(clinic)staff.prepend(head.firstElementChild);
 if(doctor){
  staff.firstElementChild.remove();
  head.innerHTML='<path d="M286 98Q282 69 310 66Q343 60 353 85L350 121 342 141Q321 157 302 141L289 122Z" fill="#cda081"/><path d="M285 109L282 85Q285 66 306 63L329 62 350 75 355 92 346 108 342 84 326 78 308 84 293 80 293 111Z" fill="#7d8073"/><path d="M289 100L294 117M346 99L345 117" stroke="#ddd7c3" stroke-width="4"/><g class="reception-staff-eyes"><path d="M302 111h8m19 0h8" stroke="#514a3c" stroke-width="2.5" stroke-linecap="round"/></g><path d="M320 111l-3 12 6 1M310 134q10 5 19-1" fill="none" stroke="#8e6650" stroke-width="1.7"/><path d="M304 143l8 5 17-1 11-7" fill="none" stroke="#a09a85" stroke-width="3"/>';
 }
 if(!doctor){
  const group=doc.createElementNS('http://www.w3.org/2000/svg','g');group.setAttribute('transform','translate(0 180)');
  while(svg.firstChild)group.append(svg.firstChild);svg.append(group);
  svg.setAttribute('viewBox','0 0 450 750');svg.setAttribute('preserveAspectRatio','xMidYMax slice');
  const background=doc.createElementNS('http://www.w3.org/2000/svg','path');background.setAttribute('d','M0 0H450V750H0Z');background.setAttribute('fill',wall);svg.prepend(background);
  const floor=doc.createElementNS('http://www.w3.org/2000/svg','path');floor.setAttribute('d','M0 410H450V750H0Z');floor.setAttribute('fill','#cfb58c');group.before(floor);
 }
 return new XMLSerializer().serializeToString(svg);
}
function receptionShell(state,kind,speech,body,action){
 const title=kind==='clinic'?'動物病院':'ふれあい広場';
 return renderCampaignShell(state,title,`<div class="reception-scene is-${kind}"><div class="reception-hero" data-kind="${kind}">${receptionArt(kind)}<button class="reception-exit" data-action="back-town">← 街へ戻る</button>${firstActive(state)?'':`<p class="reception-speech">${speech}</p>`}</div><section class="community-panel reception-panel ${kind==='clinic'?'clinic-reception':''}"><header class="reception-heading"><span>受付</span><h1>${title}</h1></header><div class="reception-content">${body}</div><footer class="reception-actions">${action}</footer></section></div>`,'');
}
renderMapShop=function(state){
 const cat=getCat(state),c=state.campaign;
 if(c.shopId==='plaza'){
  const ready=cat.status==='raising'&&isGraduationReady(state)&&cat.body.days+1>=CONFIG.stage1.adoptionEventDay;
  const raising=cat.status==='raising',speech=ready?'準備が整いましたね。\n会場へご案内します。':'こんにちは。里親探しを\nお手伝いします。';
  const body=`<h2>里親募集・譲渡会</h2><p>${ready?'今日の譲渡会に参加できます。':raising?`譲渡会は保護生活${CONFIG.stage1.adoptionEventDay}日目から。<br>おうちで過ごしながら準備しましょう。`:'ネコを迎え、準備が整ったら<br>ここで新しい家族を探せます。'}</p><div class="reception-status"><span class="reception-status-dot ${ready?'is-ready':''}"></span>${ready?'受付できます':raising?'この子は、準備中です':'ネコを迎えてからご案内します'}</div>`;
  return receptionShell(state,'plaza',speech,body,`<button class="campaign-button" data-action="go-event" ${ready?'':'disabled'}>譲渡会に参加する <span aria-hidden="true">›</span></button>`);
 }
 if(c.shopId!=='clinic'||!c.clinicReception)return clinicShop(state);
 const examined=c.clinicExamined&&cat.status==='raising';
 const speech=!examined?'こんにちは。\nご用件を伺います。':cat.body.sick?'治療をして、\n少し休ませましょう。':'診察が終わりました。\nお大事にしてください。';
 const body=cat.status!=='raising'?'<h2>健康チェック・不妊去勢手術</h2><p>ネコを迎えたら、<br>こちらでご案内します。</p>':!examined?`<div class="clinic-commands"><button data-clinic="examine"><strong>健康チェック <span>›</span></strong><small>病気やケガを確認する</small></button><button data-action="go-surgery"><strong>不妊去勢手術 <span>›</span></strong><small>${cat.surgery?.status==='done'?'手術済み・記録を見る':'TNRに向けた準備・耳カット'}</small></button></div>`:`<h2>健康チェックの結果</h2><p>${cat.body.sick?'病気やケガの治療が必要です。<br>治療して休ませましょう。':'病気やケガは見られません。'}</p><div class="reception-status">体重 ${Math.round(cat.body.weight)}g</div>`;
 const actions=!examined?'':cat.body.sick?`<button class="campaign-button" data-action="treat-cat">治療をお願いする <span>${CONFIG.care.clinic.cost}コイン</span></button>`:'<button class="campaign-button" data-clinic="menu">受付にもどる <span>›</span></button>';
 return receptionShell(state,'clinic',speech,body,actions);
};
const observedPose=scenePose;
scenePose=function(svg){if(gameState.campaign.phase==='room'&&getCat(gameState).body.sick&&svg.closest('.cat-object'))return ['sit','wary'];return observedPose(svg);};
const clinicRender=render;
let receptionObserver=null,receptionResizeCleanup=null;
function fitReception(){
 receptionObserver?.disconnect();receptionResizeCleanup?.();const scene=app.querySelector('.reception-scene');if(!scene)return;
 const screen=scene.closest('.campaign-screen'),fit=()=>{if(!scene.isConnected)return;const rect=screen.getBoundingClientRect(),viewport=window.visualViewport;let bottom=Math.min(innerHeight,viewport?viewport.offsetTop+viewport.height:innerHeight);for(let parent=screen;parent;parent=parent.parentElement)if(parent===app||/(hidden|clip|auto|scroll)/.test(getComputedStyle(parent).overflowY))bottom=Math.min(bottom,parent.getBoundingClientRect().bottom);scene.style.height=Math.max(0,(bottom-rect.top)/(rect.height/screen.clientHeight||1))+'px';};
 receptionObserver=new ResizeObserver(fit);receptionObserver.observe(screen);receptionObserver.observe(app);window.addEventListener('resize',fit);window.visualViewport?.addEventListener('resize',fit);receptionResizeCleanup=()=>{window.removeEventListener('resize',fit);window.visualViewport?.removeEventListener('resize',fit)};fit();
}
render=function(state){const oldHero=app.querySelector('.reception-hero'),oldArt=oldHero?.querySelector('svg'),motion=storeCaptureMotion(oldArt);clinicRender(state);const hero=app.querySelector('.reception-hero');if(oldArt&&hero?.dataset.kind===oldHero.dataset.kind)hero.querySelector('svg').replaceWith(oldArt);storeRestoreMotion(motion);fitReception();if(state.campaign.phase==='room'){app.querySelectorAll('.home-surgery-status').forEach(n=>n.remove());if(getCat(state).body.sick&&!state.ui.modal&&!state.ui.layoutMode){const note=document.createElement('p');note.className='room-observation';note.textContent='いつもより静かにしている…';app.querySelector('.stage')?.append(note);}}};
app.addEventListener('click',e=>{if(e.target.closest('[data-clinic="examine"]'))dispatch({type:'EXAMINE_CAT'});if(e.target.closest('[data-clinic="menu"]'))dispatch({type:'CLINIC_MENU'});if(e.target.closest('[data-action="open-plaza"]'))dispatch({type:'OPEN_PLAZA'});});
const clinicStyle=document.createElement('style');clinicStyle.textContent=`
.is-clinic .reception-hero{position:absolute;inset:0;min-height:0;background:#d7ddcc}
.is-clinic .reception-hero>svg{height:100%;width:100%}
.is-clinic .reception-speech{top:max(64px,calc(50% - 60px))}
.is-clinic .reception-panel{position:absolute;left:0;right:0;bottom:0;grid-template-rows:30px auto auto;gap:10px;padding:14px}
.is-clinic .reception-actions:empty{display:none}
.is-clinic .reception-content{justify-content:flex-start;gap:12px}
.clinic-commands{display:grid;gap:3px;width:100%}.clinic-commands button{width:100%;min-height:50px;text-align:left;border:1px solid #c8cfb4;border-radius:15px;background:var(--guide-accent, #9d5341);color:var(--guide-ink, #fff8e9);padding:4px 12px}.clinic-commands strong{display:block;font-size:16px;line-height:22px}.clinic-commands strong span{float:right}.clinic-commands small{display:block;font-size:12px;line-height:16px;margin-top:0;color:#776b53}
#app .campaign-screen:has(.reception-scene){position:relative;padding:0;min-height:0}#app .campaign-scroll:has(>.reception-scene){position:absolute;inset:0;display:block;padding:0}#app .campaign-screen:has(.reception-scene)>.campaign-actions{display:none}
.reception-scene{position:absolute;left:0;right:0;top:0;height:100%;display:flex;flex-direction:column;background:#d5bd97;color:#5e523f;font-family:var(--game-font)}.reception-scene button{font-family:inherit}.reception-hero{position:relative;flex:0 0 clamp(158px,30vh,244px);min-height:0}.reception-hero>svg{display:block;width:100%;height:100%}.reception-exit{position:absolute;left:10px;top:8px;min-height:44px;border:1px solid #f6e7cb;border-radius:9px;background:#65583f;color:#fff9ed;font-size:13px;padding:8px 12px;box-shadow:0 2px 0 #4d432c}.reception-speech{position:absolute;left:12px;top:68px;width:55%;height:72px;margin:0;padding:11px 12px;white-space:pre-line;background:#fff7e5;color:#52654e;border:1px solid #c8c8a9;border-radius:17px 20px 7px 17px;font-size:13px;line-height:21px;letter-spacing:0;box-shadow:0 2px 0 #93856c20}.reception-speech:after{content:'';position:absolute;right:-12px;top:29px;width:14px;height:15px;background:#fff7e5;clip-path:polygon(0 0,100% 75%,0 100%)}
.reception-panel{box-sizing:border-box;margin:0 10px max(18px,env(safe-area-inset-bottom));padding:14px;flex:1;min-height:0;display:grid;grid-template-rows:30px minmax(0,1fr) 48px;gap:10px;border-radius:22px;background:#fff8e9;box-shadow:0 4px 0 #967d5920}.reception-heading{display:flex;align-items:center;gap:10px}.reception-heading>span{background:#e5ead9;color:#607758;border-radius:8px;padding:4px 8px;font-size:12px}.reception-heading h1{font-size:18px;line-height:26px;margin:0}.reception-content{display:flex;flex-direction:column;justify-content:center;gap:12px;min-height:0}.reception-content h2{font-size:16px;line-height:24px;margin:0;display:flex;flex-wrap:wrap;justify-content:space-between;gap:4px}.reception-content h2 small{font-size:12px;font-weight:500;color:#7c785f}.reception-content p{font-size:14px;line-height:22px;margin:0}.reception-status{font-size:13px;line-height:20px;display:flex;gap:7px;align-items:center;color:#7c755e}.reception-status-dot{width:8px;height:8px;background:#cbbb97;border-radius:50%;flex:none}.reception-status-dot.is-ready{background:#7e946b}.reception-checks{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px}.reception-checks>span{display:flex;align-items:center;justify-content:center;gap:5px;min-height:34px;font-size:12px;color:#8b7e63;background:#f0e6d1;border-radius:8px}.reception-checks>span.is-ready{background:#e3ead8;color:#607755}.reception-checks b{font-size:14px}.reception-actions{min-height:48px;display:flex;align-items:stretch}#app .reception-actions .campaign-button{width:100%;min-height:48px;padding:10px 14px;font-size:14px;display:flex;align-items:center;justify-content:space-between;gap:6px;background:var(--guide-accent, #9d5341);color:#fffaf1;border:0;border-radius:16px}#app .reception-actions .campaign-button:disabled{background:#e8dfcb;color:#8b806a;opacity:1;cursor:default}.reception-complete{display:flex;align-items:center;width:100%;margin:0;font-size:13px;line-height:20px;color:#68745b}.room-observation{position:absolute;top:23%;left:16px;right:16px;margin:0;text-align:center;font-size:13px;color:#645640;pointer-events:none}
@media(max-height:650px){.reception-hero{flex-basis:180px}.reception-panel{padding:12px;gap:8px}.reception-content{gap:7px}.reception-content h2{font-size:15px}.reception-content p{font-size:13px;line-height:20px}.reception-speech{top:64px;height:76px;padding:8px 10px;font-size:13px;line-height:20px}}
.reception-staff-head{transform-origin:320px 150px;animation:reception-nod 6.8s ease-in-out infinite}.is-plaza .reception-staff-head{animation:reception-tilt 5.9s ease-in-out infinite}.reception-staff-eyes{transform-origin:320px 115px;animation:reception-blink 4.7s infinite}.reception-staff-hand{transform-origin:282px 204px;animation:reception-hand 7.3s ease-in-out infinite}.is-plaza .reception-staff-hand{animation-duration:5.4s}
@keyframes reception-nod{0%,14%,35%,100%{transform:rotate(0)}22%,27%{transform:translateY(2px) rotate(4deg)}}@keyframes reception-tilt{0%,12%,42%,100%{transform:rotate(0)}23%,31%{transform:rotate(-5deg)}}@keyframes reception-blink{0%,24%,30%,72%,78%,100%{transform:scaleY(1)}27%,75%{transform:scaleY(.12)}}@keyframes reception-hand{0%,17%,43%,100%{transform:rotate(0)}26%,34%{transform:rotate(-8deg)}}
@media(prefers-reduced-motion:reduce){.reception-staff *{animation:none!important}}
`;document.head.append(clinicStyle);
