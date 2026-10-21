'use strict';
// Shared guide presentation. Progress stays in the reducers; redraws do not restart speech.
const guideSpeechCache=new Map();
const guideFocusSeen=new Set();
let guidePresentationFrame=0;
function guideHand(kind='tap'){return `<span class="guide-gesture" data-kind="${kind}" aria-hidden="true"><svg viewBox="0 0 48 58"><path d="M15 31V9q0-7 6-7t6 7v15q3-5 7-1 4-2 7 2 5 0 5 6v11q0 12-12 12H25q-5 0-8-5L6 34q-3-5 2-7 3-1 7 4Z" fill="#fff8e9" stroke="#596f4d" stroke-width="2.5" stroke-linejoin="round"/><path d="M15 5L11 1M31 6l4-5M7 14H2" stroke="#596f4d" stroke-width="2" stroke-linecap="round"/></svg></span>`;}
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
 const note=layer.querySelector('aside'),p=note.querySelector('p'),ring=layer.querySelector('.first-guide-ring,.tutorial-ring');
 const text=p.textContent;
 if(!note.querySelector('.first-senior'))note.insertAdjacentHTML('afterbegin',`<span class="first-senior">${seniorArt()}</span>`);
 note.querySelector('.first-senior svg')?.setAttribute('viewBox','45 5 135 190');
 note.classList.add('shared-guide-note');
 const speaker=note.querySelector('header strong,aside>strong');if(speaker){speaker.textContent='保護主のせんぱい';speaker.classList.add('senior-dialogue-name');}
 const advance=note.querySelector('button');if(advance)advance.textContent=advance.textContent.replace(/\s*[→›]\s*$/,'');
 const hint=note.querySelector('small,aside>span:not(.first-senior)');if(hint)hint.textContent='';
 const id=(first?'first:':'town:')+key+':'+text;
 if(!guideSpeechCache.has(id))guideSpeechCache.set(id,performance.now());
 const start=guideSpeechCache.get(id),chars=Array.from(text),next=note.querySelector('button');
 const cue=key==='bait'?'swipe':key==='trap'?'drag':['rescue','trapReady','toClinic','clinicBuilding','firstCommand','receipt','pay','shopBuilding','tools','starter','addCart','purchase','homeBuilding','layout','addFurniture','chooseFurniture','addMore','cutCardboard','name','callFirst','callAgain'].includes(key)?'tap':null;
 const noFocus=!!cue||['area','fieldHello','captured','clinicHello','healthCommand','surgeryCommand','healthy','stats','shopHello','shopHelloDetail','homeHello','roomExplain','roomReady','farewell','lifeStarts','askSenior','goodLuck','essentials','cardboard','moveFurniture','callWait'].includes(key);
 if(cue)layer.insertAdjacentHTML('beforeend',guideHand(cue));
 const hand=layer.querySelector('.guide-gesture');
 if(noFocus)ring.hidden=true;
 const selector=typeof spec.target==='function'?spec.target():spec.target;
 const target=app.querySelector(selector);
 if(state.ui.layoutTrayOpen&&target?.closest('.furniture-grid'))target.scrollIntoView({block:'nearest'});
 const tick=()=>{
  if(!layer.isConnected)return;
  const count=Math.min(chars.length,Math.floor((performance.now()-start)/18));
  p.textContent=chars.slice(0,count).join('');
  const ready=count===chars.length;layer.dataset.reading=String(!ready);
  if(next){next.disabled=!ready;next.classList.toggle('guide-next-ready',ready);}
  ring.style.visibility=ready&&!noFocus?'visible':'hidden';
  if(ready&&!noFocus&&target){
   const a=app.getBoundingClientRect(),r=target.getBoundingClientRect();
   const wide=key==='goal'||r.width>r.height*1.7;
   const w=Math.min(a.width-4,key==='goal'?Math.min(r.width-20,160):wide?r.width*1.2:Math.max(r.width,r.height)*1.2),h=key==='goal'?Math.max(24,r.height-12):wide?r.height*1.2:w;
   Object.assign(ring.style,{left:Math.max(2,Math.min(a.width-w-2,r.left-a.left+(r.width-w)/2))+'px',top:Math.max(2,Math.min(a.height-h-2,r.top-a.top+(r.height-h)/2))+'px',width:w+'px',height:h+'px',borderRadius:wide?'20px':'50%'});
   if(!guideFocusSeen.has(id)){guideFocusSeen.add(id);if(!matchMedia('(prefers-reduced-motion: reduce)').matches)ring.animate([{transform:'scale(1.65)',opacity:0},{transform:'scale(1)',opacity:1}],{duration:420,easing:'ease-out'});}
  }
  const a=app.getBoundingClientRect(),r=target?.getBoundingClientRect();
  if(hand){hand.hidden=!ready||!r||target.disabled||getComputedStyle(target).visibility==='hidden';if(r)Object.assign(hand.style,{left:Math.max(cue==='swipe'?34:4,Math.min(a.width-(cue==='swipe'?82:52),(cue==='tap'?r.right-30:r.left+r.width*.65-15)-a.left))+'px',top:Math.max(cue==='drag'?44:4,Math.min(a.height-72,(cue==='swipe'?r.top+10:r.top+r.height*.5)-a.top))+'px'});}
  note.style.top=r&&r.top+r.height/2>a.top+a.height/2?'12px':'auto';note.style.bottom=note.style.top==='auto'?'12px':'auto';
  if(['field','trapInspect','clinic'].includes(state.campaign.phase)){note.style.top='18px';note.style.bottom='auto';}
  if(state.campaign.phase==='shop'){note.style.top='12px';note.style.bottom='auto';}
  if(state.campaign.phase==='intake'){note.style.top=INTAKE_GUIDE_TOP+'px';note.style.bottom='auto';}
  guidePresentationFrame=requestAnimationFrame(tick);
 };tick();
}
const guidePresentationRender=render;
render=function(state){guidePresentationRender(state);guidePresentation(state);};
window.addEventListener('click',e=>{if(app.querySelector('[data-reading="true"]')){e.preventDefault();e.stopImmediatePropagation();}},true);
window.addEventListener('pointerdown',e=>{if(app.querySelector('[data-reading="true"]')){e.preventDefault();e.stopImmediatePropagation();}},true);
// Fade both sides of navigation, never re-enter the reducer while an exit is playing.
const guideNavigationDispatch=dispatch;
let guideNavigationBusy=false;
const fadeActions=new Set(['START_GAME','GO_HOME','BACK_TO_TOWN','OPEN_MAP_SHOP','CHOOSE_AREA','GO_CLINIC','PAY_FIRST_EXAM','FIRST_EXAM','FIRST_FINISH','GO_EVENT','NEXT_RESCUE']);
dispatch=function(action){
 if(action.type==='START_GAME'){guideSpeechCache.clear();guideFocusSeen.clear();}
 const storyExit=action.type==='NEXT_STORY'&&gameState.onboarding.storyIndex===INTRODUCTION_PAGES.length-1;
 if((!fadeActions.has(action.type)&&!storyExit)||matchMedia('(prefers-reduced-motion: reduce)').matches)return guideNavigationDispatch(action);
 if(guideNavigationBusy)return;
 guideNavigationBusy=true;const veil=document.createElement('div');veil.className='navigation-veil';app.append(veil);
 veil.animate([{opacity:0},{opacity:1}],{duration:180,fill:'forwards'}).finished.then(()=>{
  guideNavigationDispatch(action);app.append(veil);
  return veil.animate([{opacity:1},{opacity:0}],{duration:260,fill:'forwards'}).finished;
 }).finally(()=>{veil.remove();guideNavigationBusy=false;});
};
