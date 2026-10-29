'use strict';
// Shared guide presentation. Progress stays in the reducers; redraws do not restart speech.
const guideSpeechCache=new Map();
const guideFocusSeen=new Set();
const guideTextPages=new Map();
function splitGuideText(text,limit=44){
 const pages=[];let rest=text;
 while(rest.length>limit){const part=rest.slice(0,limit),punct=Math.max(part.lastIndexOf('。'),part.lastIndexOf('！'),part.lastIndexOf('？'),part.lastIndexOf('、'));const end=punct>=12?punct+1:limit;pages.push(rest.slice(0,end));rest=rest.slice(end);}
 if(rest||!pages.length)pages.push(rest);return pages;
}
let guidePresentationFrame=0;
function guideHand(kind='tap'){
 if(kind==='move-furniture')return `<span class="guide-gesture" data-kind="move-furniture" aria-hidden="true"><svg viewBox="0 0 64 80"><g class="guide-hand"><path d="M17 40V28q0-5 5-5t5 5v-8q0-5 5-5t5 5v2q2-5 6-3 3 1 3 6v2q4-3 7 1 2 2 2 7v15q0 13-12 17H29q-6-3-9-9L11 45q-3-5 1-8 3-2 5 3Z" fill="#fff8e9" stroke="#584137" stroke-width="3" stroke-linejoin="round"/><path d="M27 28v12m10-18v17m9-12v13M17 40l8 9" fill="none" stroke="#584137" stroke-width="2" stroke-linecap="round"/></g></svg></span>`;
 const tap=kind==='tap',vertical=['drag','swipe-down'].includes(kind),effect=tap?'M28 3V10M44 13L38 16M12 13L18 16':vertical?'M28 3V48':'M5 20H51';
 return `<span class="guide-gesture" data-kind="${kind}" aria-hidden="true"><svg viewBox="0 0 64 80"><g class="guide-trace ${tap?'tap-rays':''}" fill="none" stroke-linecap="round"><path d="${effect}" stroke="#fffdf3" stroke-width="7"/><path d="${effect}" stroke="#584137" stroke-width="3"/></g><g class="guide-hand"><path d="M22 46V27q0-7 6-7t6 7v15q3-5 7-1 4-2 7 2 5 0 5 6v11q0 12-12 12H32q-5 0-8-5L13 49q-3-5 2-7 3-1 7 4Z" fill="#fff8e9" stroke="#584137" stroke-width="3" stroke-linejoin="round"/></g></svg></span>`;
}
// The same speaker, companion, typography and controls are used outside the tutorial too.
function seniorDialogueContents(copy,controls){
 const portrait=seniorArt().replace('viewBox="0 0 220 270"','viewBox="45 5 135 190"');
 return `<span class="first-senior">${portrait}</span><strong class="senior-dialogue-name">保護主のせんぱい</strong><p>${copy}</p><nav>${controls}</nav>`;
}
function guidePresentation(state){
 cancelAnimationFrame(guidePresentationFrame);
 const layer=app.querySelector('section.first-guide,section.tutorial-focus');if(!layer)return;
 const first=layer.classList.contains('first-guide');
 layer.dataset.context=state.campaign.phase;
 layer.dataset.facility=state.campaign.shopId||'';
 const key=first?state.onboarding.guide:state.onboarding.townStep;
 const spec=(first?FIRST_GUIDES:TOWN_TUTORIAL)[key];if(!spec)return;
 const note=layer.querySelector('aside'),ring=layer.querySelector('.first-guide-ring,.tutorial-ring');
 const text=note.querySelector('p').textContent,controls=[...note.querySelectorAll('button')];
 note.innerHTML=seniorDialogueContents(text,'');note.querySelector('nav').append(...controls);
 const p=note.querySelector('p');
 note.classList.add('shared-guide-note');
 const speaker=note.querySelector('header strong,aside>strong');if(speaker){speaker.textContent='保護主のせんぱい';speaker.classList.add('senior-dialogue-name');}
 const advance=note.querySelector('button');if(advance)advance.textContent=advance.textContent.replace(/\s*[→›]\s*$/,'');
 const hint=note.querySelector('small,aside>span:not(.first-senior)');if(hint)hint.textContent='';
 const id=(first?'first:':'town:')+key+':'+text;
 if(!guideSpeechCache.has(id))guideSpeechCache.set(id,performance.now());
 const pages=splitGuideText(text);
 let page=Math.min(guideTextPages.get(id)||0,pages.length-1),start=guideSpeechCache.get(id),chars=Array.from(pages[page]),next=note.querySelector('button');
 const savedControls=[...note.querySelector('nav').childNodes];
 function setTextPage(){
  const nav=note.querySelector('nav');nav.replaceChildren();
  if(page<pages.length-1){const b=document.createElement('button');b.textContent='つぎへ';b.dataset.copyPage='';nav.append(b);}
  else nav.append(...savedControls);
  next=nav.querySelector('button');chars=Array.from(pages[page]);
 }
 setTextPage();
 layer.dataset.copyPending=String(page<pages.length-1);
 layer.addEventListener('click',e=>{if(!e.target.closest('[data-copy-page]'))return;e.preventDefault();e.stopImmediatePropagation();page++;guideTextPages.set(id,page);start=performance.now();setTextPage();layer.dataset.copyPending=String(page<pages.length-1);},true);
 const cue=['swipe','clinicScroll'].includes(key)?'swipe-down':key==='bait'?(encounterFoods(state).length===1?'tap':'swipe'):key==='moveFurniture'?'move-furniture':key==='trap'?'drag':['rescue','trapReady','toClinic','clinicBuilding','firstCommand','receipt','pay','shopBuilding','tools','starter','addCart','purchase','homeBuilding','layout','addFurniture','chooseFurniture','addMore','cutCardboard','name','callFirst','callAgain'].includes(key)?'tap':null;
 const noFocus=(!!cue&&! ['swipe','clinicScroll'].includes(key))||['area','fieldHello','captured','clinicHello','healthy','stats','shopHello','shopHelloDetail','homeHello','roomExplain','roomReady','farewell','lifeStarts','askSenior','goodLuck','essentials','cardboard','callWait'].includes(key);
 if(cue)layer.insertAdjacentHTML('beforeend',guideHand(cue));
 const hand=layer.querySelector('.guide-gesture');
 ring.hidden=noFocus;
 const selector=typeof spec.target==='function'?spec.target():spec.target;
 const target=app.querySelector(selector);
 if(state.ui.layoutTrayOpen&&target?.closest('.furniture-grid'))target.scrollIntoView({block:'nearest'});
 const tick=()=>{
  if(!layer.isConnected)return;
  const count=Math.min(chars.length,Math.floor((performance.now()-start)/18));
  p.textContent=chars.slice(0,count).join('');
  const ready=count===chars.length,lastPage=page===pages.length-1;layer.dataset.reading=String(!ready);
  if(next){next.disabled=!ready;next.classList.toggle('guide-next-ready',ready);}
  ring.style.visibility=ready&&lastPage&&!noFocus?'visible':'hidden';
  if(ready&&!noFocus&&target){
   const a=app.getBoundingClientRect(),r=target.getBoundingClientRect();
   const wide=key==='goal'||r.width>r.height*1.7;
   const w=Math.min(a.width-4,key==='goal'?Math.min(r.width-20,160):wide?r.width*1.2:Math.max(r.width,r.height)*1.2),h=key==='goal'?Math.max(24,r.height-12):wide?r.height*1.2:w;
   Object.assign(ring.style,{left:Math.max(2,Math.min(a.width-w-2,r.left-a.left+(r.width-w)/2))+'px',top:Math.max(2,Math.min(a.height-h-2,r.top-a.top+(r.height-h)/2))+'px',width:w+'px',height:h+'px',borderRadius:wide?'20px':'50%'});
   if(!guideFocusSeen.has(id)){guideFocusSeen.add(id);if(!matchMedia('(prefers-reduced-motion: reduce)').matches)ring.animate([{transform:'scale(1.65)',opacity:0},{transform:'scale(1)',opacity:1}],{duration:420,easing:'ease-out'});}
  }
  const a=app.getBoundingClientRect(),r=target?.getBoundingClientRect();
  if(hand&&cue==='move-furniture')hand.style.setProperty('--move-direction',r&&r.left+r.width/2>a.left+a.width/2?-1:1);
  if(hand){hand.hidden=!ready||!lastPage||!r||target.disabled||getComputedStyle(target).visibility==='hidden';if(r)Object.assign(hand.style,{left:Math.max(cue==='swipe'?34:4,Math.min(a.width-(cue==='swipe'?82:52),(cue==='tap'?(r.width>100?r.right-28:r.left+r.width*.82):r.left+r.width*.5)-21-a.left))+'px',top:Math.max(cue==='drag'?44:4,Math.min(a.height-66,r.top+r.height*.5-15-a.top))+'px'});}
  if(hand&&cue==='move-furniture'&&app.querySelector('.layout-drag-preview'))hand.hidden=true;
  note.style.top=r&&r.top+r.height/2>a.top+a.height/2?'12px':'auto';note.style.bottom=note.style.top==='auto'?'12px':'auto';
  if(['field','trapInspect','clinic'].includes(state.campaign.phase)){note.style.top='18px';note.style.bottom='auto';}
  if(state.campaign.phase==='shop'){note.style.top='12px';note.style.bottom='auto';}
  if(['swipe','clinicScroll'].includes(key)){note.style.top='92px';note.style.bottom='auto';if(hand){hand.style.left=(a.width*.72)+'px';hand.style.top=(a.height*.66)+'px';hand.dataset.kind=key==='swipe'?'swipe-down':'swipe-up';}}
  if(state.campaign.phase==='intake'){note.style.top=INTAKE_GUIDE_TOP+'px';note.style.bottom='auto';}
  guidePresentationFrame=requestAnimationFrame(tick);
 };tick();
}
const guidePresentationRender=render;
let previousSceneKey=null;
function navigationSceneKey(state){const c=state.campaign;return [titleScreenOpen?'title':c.phase,c.phase==='shop'?c.shopId:'',c.phase==='clinic'?c.clinicStep:'',c.phase==='result'&&c.tnrRelease?'release':''].join(':');}
render=function(state){
 const key=navigationSceneKey(state),fallback=previousSceneKey!==null&&previousSceneKey!==key&&!guideNavigationBusy&&!matchMedia('(prefers-reduced-motion: reduce)').matches;
 const snapshot=fallback?app.cloneNode(true):null;previousSceneKey=key;
 guidePresentationRender(state);guidePresentation(state);
 if(snapshot){
  snapshot.removeAttribute('id');snapshot.removeAttribute('aria-live');snapshot.className='navigation-snapshot';snapshot.setAttribute('aria-hidden','true');snapshot.inert=true;
  const veil=document.createElement('div');veil.className='navigation-veil';app.append(snapshot,veil);guideNavigationBusy=true;
  veil.animate([{opacity:0},{opacity:1}],{duration:180,fill:'forwards'}).finished.then(()=>{snapshot.remove();return veil.animate([{opacity:1},{opacity:0}],{duration:260,fill:'forwards'}).finished;}).finally(()=>{snapshot.remove();veil.remove();guideNavigationBusy=false;});
 }
};
for(const event of ['click','pointerdown'])window.addEventListener(event,e=>{if(e.target.closest('[data-alpha-report],.alpha-report,.alpha-layer'))return;if(app.querySelector('[data-reading="true"]')||(app.querySelector('[data-copy-pending="true"]')&&!e.target.closest('[data-copy-page]'))){e.preventDefault();e.stopImmediatePropagation();}},true);
// Fade both sides of navigation, never re-enter the reducer while an exit is playing.
const guideNavigationDispatch=dispatch;
let guideNavigationBusy=false;
const fadeActions=new Set(['START_GAME','GO_HOME','OPEN_OUTING','BACK_TO_TOWN','OPEN_MAP_SHOP','OPEN_SUPPLIES','CHOOSE_AREA','GO_CLINIC','PAY_FIRST_EXAM','FIRST_EXAM','FIRST_FINISH','GO_EVENT','NEXT_RESCUE','HOME_FROM_ADOPTION','START_SURGERY','FINISH_SURGERY','FINISH_EXAM','GO_SURGERY']);
dispatch=function(action){
 if(action.type==='START_GAME'){guideSpeechCache.clear();guideFocusSeen.clear();guideTextPages.clear();}
 const storyExit=action.type==='NEXT_STORY'&&gameState.onboarding.storyIndex===INTRODUCTION_PAGES.length-1;
 if((!fadeActions.has(action.type)&&!storyExit)||matchMedia('(prefers-reduced-motion: reduce)').matches)return guideNavigationDispatch(action);
 if(guideNavigationBusy)return;
 guideNavigationBusy=true;const veil=document.createElement('div');veil.className='navigation-veil';app.append(veil);
 veil.animate([{opacity:0},{opacity:1}],{duration:180,fill:'forwards'}).finished.then(()=>{
  guideNavigationDispatch(action);app.append(veil);
  return veil.animate([{opacity:1},{opacity:0}],{duration:260,fill:'forwards'}).finished;
 }).finally(()=>{veil.remove();guideNavigationBusy=false;});
};
