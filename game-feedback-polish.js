'use strict';
function rescueReaction(cat){const n=(cat.types||[]).join('|');return /play|hunt|chase/.test(n)?{pose:'alert',mood:'angry',text:'耳を動かし、落ち着かない様子で周りを見ています。'}:/sun|sleep|relax/.test(n)?{pose:'rest',mood:'neutral',text:'落ち着いて、うとうとしています。'}:{pose:'cower',mood:'wary',text:'少し怯えて、身を小さくしています。'};}
function personalityPose(cat){const r=rescueReaction(cat);return [r.pose,r.mood];}
const feedbackPose=scenePose;
function introNeighborMotion(index,seconds){
 const cycle=index?29:22,t=((seconds%cycle)+cycle)%cycle;
 if(!index){if(t<7)return {x:t/7*18,pose:'walk',face:-1};if(t<12)return {x:18,pose:'sit',face:-1};if(t<19)return {x:(19-t)/7*18,pose:'walk',face:1};return {x:0,pose:'sit',face:1};}
 if(t<9)return {x:0,pose:'sit',face:1};if(t<14)return {x:-(t-9)/5*14,pose:'walk',face:1};if(t<23)return {x:-14,pose:'sleep',face:1};if(t<28)return {x:-(28-t)/5*14,pose:'walk',face:-1};return {x:0,pose:'sit',face:-1};
}
function introMotionFor(svg){return introNeighborMotion(Number(svg.closest('.intro-neighbor').dataset.neighbor),matchMedia('(prefers-reduced-motion: reduce)').matches?0:(Date.now()-Number(svg.closest('.introduction-picture').dataset.startedAt))/1000);}
scenePose=svg=>svg.classList.contains('intro-neighbor-cat')?[introMotionFor(svg).pose,'neutral']:svg.closest('.first-exam-cat,.capture-portrait')?personalityPose(getCat(gameState)):feedbackPose(svg);
// Keep eye geometry from the exact rendered cat, including its head transform.
function actualEyes(svg){const clone=svg.cloneNode(true);clone.classList.remove('game-cat-svg');clone.removeAttribute('data-cat-id');clone.querySelectorAll('[data-part]').forEach(n=>{if(!['travel','age','headRig','face'].includes(n.dataset.part))n.remove()});const face=clone.querySelector('[data-part="face"]');if(face)for(const n of [...face.children])if(!['defs','g'].includes(n.tagName.toLowerCase())&&!['#a9c06a','#72b9c8','#e7c855'].includes(n.getAttribute('fill')))n.remove();const prefix='eyes-'+Math.random().toString(36).slice(2);const html=clone.innerHTML.replace(/id="([^"]+)"/g,`id="${prefix}-$1"`).replace(/url\(#([^\)]+)\)/g,`url(#${prefix}-$1)`);clone.innerHTML=html;return clone;}
const feedbackReducer=reduceGameState;
reduceGameState=function(state,action){
 state=normalizeStarterCart(state);
 if(action.type==='START_GAME')actionRevealStarts.clear();
 if(action.type==='STORE_DRAFT_COUNT'&&state.ui.storeDetail==='starter_set')return state;
 if(action.type==='STORE_ADD'&&state.ui.storeDetail==='starter_set'&&state.flags.starterBought)return state;
 if(action.type==='STORE_QUANTITY'&&action.id==='starter_set')return state;
 if(action.type==='STORE_ADD'&&state.ui.storeDetail==='starter_set')state={...state,ui:{...state.ui,storeDraftCount:1,shopCart:{...storeCart(state),starter_set:0}}};
 if(action.type==='DROP_LAYOUT_ITEM'&&action.store&&['bowl','water','litter'].includes(action.itemId))return state;
 const next=feedbackReducer(state,action);
 if(action.type==='START_GAME'&&state.onboarding.status==='new')return {...next,onboarding:{...next.onboarding,introStartedAt:Date.now()}};
 return next;
};
let introSpeechFrame=0;
let activityRevealFrame=0;
const actionRevealStarts=new Map();
function syncActivityAffordances(state){
 cancelAnimationFrame(activityRevealFrame);
 const cat=getCat(state),phase=state.campaign.phase,guide=state.onboarding.guide,first=firstActive(state);
 const staged=app.querySelector(phase==='trapInspect'?'[data-action="go-clinic"]':phase==='intake'&&!cat.named?'.intake-footer-call':'.no-staged-action');
 if(staged){
  const key=cat.id+':'+phase+':'+guide,allowed=first?(phase==='trapInspect'?guide==='toClinic':guide==='name'):true;
  staged.classList.add('staged-action');
  const tick=()=>{if(!staged.isConnected)return;const speechReady=!app.querySelector('[data-reading="true"]');
   const ready=allowed&&speechReady&&(first||Date.now()-(state.campaign.captureStartedAt||0)>4000);
   if(ready&&!actionRevealStarts.has(key))actionRevealStarts.set(key,Date.now());
   staged.setAttribute('aria-hidden',String(!ready));staged.disabled=!ready;
   if(ready)staged.style.animationDelay=-Math.max(0,Date.now()-actionRevealStarts.get(key))+'ms';
   activityRevealFrame=requestAnimationFrame(tick);
  };tick();
 }
 if(phase==='room'&&state.onboarding.appIntro==='prompt'&&!state.ui.modal){
  const target=app.querySelector('[data-action="open-notebook"]');if(!target)return;
  const a=app.getBoundingClientRect(),r=target.getBoundingClientRect(),layer=document.createElement('section');layer.className='app-launch-guide';
  layer.innerHTML='<span class="first-guide-ring"></span><p>アプリで、体調とこれからの予定を確認しましょう。</p>'+guideHand();app.append(layer);
  const size=Math.max(r.width,r.height)*1.2;
  Object.assign(layer.querySelector('.first-guide-ring').style,{left:r.x-a.x+(r.width-size)/2+'px',top:r.y-a.y+(r.height-size)/2+'px',width:size+'px',height:size+'px'});
  Object.assign(layer.querySelector('.guide-gesture').style,{left:r.x-a.x+r.width/2+'px',top:r.y-a.y+r.height/2+'px'});
 }
}
for(const kind of ['pointerdown','click'])window.addEventListener(kind,event=>{if(gameState.onboarding.appIntro==='prompt'&&gameState.campaign.phase==='room'&&!event.target.closest('[data-action="open-notebook"]')){event.preventDefault();event.stopImmediatePropagation();}},true);
const feedbackRender=render;
render=function(state){
 const normalized=normalizeStarterCart(state);if(normalized!==state){state=normalized;gameState=state;}
 const oldPicture=app.querySelector('.introduction-picture');
 const oldRigs=oldPicture?[...svgRigs].filter(([svg])=>oldPicture.contains(svg)):[];
 const oldReactionRigs=[...svgRigs].filter(([svg])=>svg.isConnected&&svg.closest('.capture-portrait,.first-exam-cat'));
 feedbackRender(state);
 for(const [svg,entry] of oldReactionRigs){const role=svg.closest('.capture-portrait')?'.capture-portrait':'.first-exam-cat',fresh=app.querySelector(role+' .game-cat-svg');if(fresh&&fresh.dataset.catId===svg.dataset.catId&&fresh.dataset.dna===svg.dataset.dna){svgRigs.delete(fresh);fresh.replaceWith(svg);svgRigs.set(svg,entry);}}
 cancelAnimationFrame(introSpeechFrame);
 const cat=getCat(state),guide=state.onboarding.guide;
 syncActivityAffordances(state);
 app.querySelectorAll('.store-tab-caption').forEach(n=>{n.style.opacity='1';n.style.visibility='visible'});
 if(state.ui.storeDetail==='starter_set')app.querySelector('.store-detail .store-quantity')?.remove();
 const checkout=app.querySelector('[data-store="checkout"]');if(checkout)checkout.textContent=`コイン${storeTotal(state)}枚で購入する`;
 const naming=app.querySelector('.first-name');if(naming){naming.querySelector('button').textContent='決定';naming.querySelectorAll('.game-cat-svg').forEach(fitFirstPortrait);}
 app.querySelectorAll('.first-exam-cat .game-cat-svg,.capture-portrait .game-cat-svg').forEach(svg=>{if(svg.dataset.reactionFitted)return;const entry=svgRigs.get(svg);if(!entry)return;const [pose,mood]=personalityPose(cat),boxes=[];entry.rig.d.mood=mood;for(let t=0;t<=8;t+=1){CatSVG.applyPose(entry.rig,CatSVG.poseModel(pose,t),t,pose);fitFirstPortrait(svg);const v=svg.viewBox.baseVal;boxes.push({x:v.x,y:v.y,right:v.x+v.width});}const x=Math.min(...boxes.map(v=>v.x)),y=Math.min(...boxes.map(v=>v.y));svg.setAttribute('viewBox',`${x} ${y} ${Math.max(...boxes.map(v=>v.right))-x} ${entry.rig.ground+4-y}`);const model=CatSVG.poseModel(pose,0);CatSVG.applyPose(entry.rig,model,0,pose);entry.pose=pose;entry.previous=null;entry.lastModel=model;svg.dataset.reactionFitted='true';});
 const intakeCall=app.querySelector('.intake-footer-call');if(intakeCall&&!cat.named)intakeCall.textContent='名前を考える';
 const furnitureGrid=app.querySelector('.furniture-grid');if(furnitureGrid){for(const id of ['litter','water','bowl']){const button=furnitureGrid.querySelector(`[data-item="${id}"]`);if(button)furnitureGrid.prepend(button);}}
 const clinic=app.querySelector('.clinic-commands');if(clinic)clinic.querySelectorAll('button').forEach((b,i)=>{if(!b.querySelector('.clinic-icon'))b.insertAdjacentHTML('afterbegin',`<span class="clinic-icon" aria-hidden="true">${['▤','♡','✂'][i]}</span>`)});
 const cage=app.querySelector('.room-carrier');if(cage&&!state.campaign.intakeCalled)cage.innerHTML=encounterTrapArt();
 const portrait=app.querySelector('.capture-portrait .game-cat-svg'),eyes=app.querySelector('.capture-first-eyes');
 if(portrait&&eyes){eyes.replaceChildren(actualEyes(portrait));app.querySelector('.capture-message')?.remove();const journey=app.querySelector('.capture-journey');const note=document.createElement('p');note.className='capture-temper';note.textContent=rescueReaction(cat).text;journey.append(note);}
 const intro=app.querySelector('.introduction-scene');if(intro){
  let picture=intro.querySelector('.introduction-picture');const dialogue=intro.querySelector('.introduction-dialogue'),senior=intro.querySelector('.introduction-senior');senior.querySelector('svg').setAttribute('viewBox','45 5 135 190');
  const startedAt=state.onboarding.introStartedAt||0;
  if(oldPicture&&oldPicture.dataset.startedAt===String(startedAt)){picture.replaceWith(oldPicture);picture=oldPicture;oldRigs.forEach(([svg,entry])=>svgRigs.set(svg,entry));}
  picture.dataset.startedAt=startedAt;
  // Use the game's cat renderer, with coats stable across pages and redraws.
  if(!picture.querySelector('.intro-living-cat')){
  for(const i of [0,1]){
   const id=`intro-neighbor-${state.onboarding.introStartedAt||cat.id}-${i}`,dna={...CatSVG.sampleDNA(stableCatSeed(id)),age:'adult',earCut:'none',mood:'neutral'};
   const holder=document.createElement('div');holder.className='intro-neighbor';holder.dataset.neighbor=i;holder.innerHTML=renderCatArt({...cat,id,age:'adult',status:'captured',surgery:{status:'none'},phenotype:dna});picture.append(holder);
   const svg=holder.querySelector('svg');svg.classList.add('intro-neighbor-cat');svg.setAttribute('viewBox','140 20 480 390');
  }
  const catBox=document.createElement('div');catBox.className='intro-living-cat';catBox.innerHTML=renderCatArt(cat);picture.append(catBox);mountGameCats();catBox.querySelectorAll('.game-cat-svg').forEach(fitFirstPortrait);
  }
  const catBox=picture.querySelector('.intro-living-cat');
  const elapsed=Date.now()-(state.onboarding.introStartedAt||0);
  const text=INTRODUCTION_PAGES[state.onboarding.storyIndex]?.[1]||'',speechKey='intro:'+state.onboarding.storyIndex;
  if(!guideSpeechCache.has(speechKey))guideSpeechCache.set(speechKey,performance.now()+Math.max(0,2600-elapsed));
  const speak=()=>{if(!intro.isConnected)return;const count=Math.max(0,Math.min(text.length,Math.floor((performance.now()-guideSpeechCache.get(speechKey))/18))),next=intro.querySelector('.introduction-next');dialogue.querySelector('p').textContent=text.slice(0,count);next.disabled=count<text.length;next.classList.toggle('guide-next-ready',count===text.length);const map=picture.querySelector('.introduction-landscape').getScreenCTM(),bounds=picture.getBoundingClientRect();picture.querySelectorAll('.intro-neighbor-cat').forEach(svg=>{const m=introMotionFor(svg),i=Number(svg.parentElement.dataset.neighbor),point=new DOMPoint(i?335:105,i?235:248).matrixTransform(map),scale=map.a;Object.assign(svg.parentElement.style,{left:(point.x-bounds.left-24*scale)+'px',top:(point.y-bounds.top-52*scale)+'px',width:48*scale+'px',height:52*scale+'px',transform:`translateX(${m.x*scale}px)`});svg.style.transform=`scaleX(${m.face})`;});introSpeechFrame=requestAnimationFrame(speak)};speak();
  if(elapsed<2600&&state.onboarding.storyIndex===0){intro.classList.add('intro-reveal');const veil=document.createElement('div');veil.className='intro-dark';const source=catBox.querySelector('svg'),eye=actualEyes(source),r=source.getBoundingClientRect(),a=intro.getBoundingClientRect();Object.assign(eye.style,{left:r.left-a.left+'px',top:r.top-a.top+'px',width:r.width+'px',height:r.height+'px',transform:'none'});veil.append(eye);intro.append(veil);veil.animate([{opacity:1,offset:0},{opacity:1,offset:.65},{opacity:0,offset:1}],{duration:2600-elapsed,fill:'forwards'}).finished.then(()=>{veil.remove();intro.classList.remove('intro-reveal')});}
 }
};
