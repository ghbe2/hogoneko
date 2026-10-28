'use strict';
// An isolated performance study. Uses the shipping cat parts, never game saves.
const svg=document.querySelector('#cat'),stage=document.querySelector('.stage'),response=document.querySelector('#response');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let rig,seed=2718,mode='idle',paused=reduced,time=0,last=0,modeMix={wary:0,warm:0},gaze={x:0,y:0},head={x:0,y:0},pointer={x:0,y:0,until:0},callAt=-100,petAt=-100;
let nextLook=2,look={x:0,y:0},nextBlink=2.2,blinkAt=-100,blinkDuration=.34,nextEar=1.6,earAt=-100;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),ease=(a,b,rate,dt)=>a+(b-a)*(1-Math.exp(-rate*dt));
const descriptions={idle:'こちらを見たり、耳を澄ませたり。',wary:'少し距離をとって、様子をうかがっています。',warm:'目を細めて、こちらに顔を寄せています。'};
const poseLabels={sniff:'匂いを確かめる',settle:'静かに安心する',disengage:'接触を外して離れる',hunt:'玩具で遊ぶ',stalk:'低く狙う',bat:'前足で連打',pin:'両手で押さえる',sit:'すわる',walk:'あるく',dash:'走る',jump:'ジャンプ',rest:'伏せる',sleep:'眠る',cower:'身をすくめる',alert:'身構える',punch:'ネコパンチ',knead:'ふみふみ',wall:'壁をひっかく',scratch:'床をひっかく',eat:'食べる',poop:'トイレ',vomit:'吐く'};
let pose='hunt',poseTime=0,poseTransition=null,lastModel=null,original=false;
const sampleParams=new URLSearchParams(location.search);
let galleryCoatSeed=null;
if(poseLabels[sampleParams.get('pose')])pose=sampleParams.get('pose');
if(sampleParams.has('embed')){
 document.documentElement.classList.add('pose-embed');
 window.addEventListener('message',e=>{if(e.source!==parent||e.data?.type!=='cat-gallery')return;
  if(typeof e.data.paused==='boolean')paused=e.data.paused;
  if(Number.isInteger(e.data.coatSeed)&&e.data.coatSeed!==galleryCoatSeed){galleryCoatSeed=e.data.coatSeed;mount(true);}
  if(e.data.restart){time=0;poseTime=0;poseTransition=null;draw(0);}
 });
}
const poseNotes={walk:'その場で歩く動作を確認できます。',dash:'その場で走る動作を確認できます。',jump:'踏み込みから着地までを繰り返します。',sleep:'丸くなって、静かに眠っています。',rest:'体を伏せて、ひと休み。',wall:'背中を向けて、交互に爪をとぎます。'};
const currentDescription=()=>CatLifeMotion.toys.has(pose)?({stalk:'身を低くして、狙いを定めます。',bat:'前足を交互に出して、捕まえようとします。',pin:'ためて、パン。両前足で押さえ込みます。'}[CatLifeMotion.action(pose,poseTime).pose]):pose==='sit'?descriptions[mode]:(poseNotes[pose]||`${poseLabels[pose]}動きを確認できます。`);
const poseDialog=document.querySelector('#pose-dialog'),poseOpen=document.querySelector('#pose-open');
function poseTitle(){poseOpen.innerHTML=`${original?'旧版':'新版'}：${poseLabels[pose]} <span>⌄</span>`;}
document.querySelector('#original').addEventListener('change',e=>{original=e.target.checked;if(original&&CatLifeMotion.toys.has(pose))pose='walk';poseTransition=null;poseTime=0;document.querySelectorAll('button[data-pose]').forEach(n=>n.setAttribute('aria-pressed',String(n.dataset.pose===pose)));poseTitle();draw(0);});
document.querySelector('#pose-list').innerHTML=Object.entries(poseLabels).map(([id,label])=>`<button data-pose="${id}" aria-pressed="${id===pose}">${label}</button>`).join('');
poseOpen.addEventListener('click',()=>poseDialog.showModal());document.querySelector('#pose-close').addEventListener('click',()=>poseDialog.close());
document.querySelectorAll('button[data-pose]').forEach(b=>b.addEventListener('click',()=>{poseTransition=lastModel?{from:structuredClone(lastModel),elapsed:0}:null;pose=b.dataset.pose;if(CatLifeMotion.toys.has(pose)){original=false;document.querySelector('#original').checked=false;}poseTime=paused?(pose==='jump'?.55:.4):0;poseTitle();document.querySelectorAll('button[data-pose]').forEach(n=>n.setAttribute('aria-pressed',String(n===b)));poseDialog.close();if(paused)poseTransition=null;draw(0);}));
poseTitle();
function mount(first=false){
 let d=first?{...CatSVG.defaults,headCoat:'tabby_gray_0',bodyCoat:'tabby_gray_0',legCoat:'tabby_gray_0',tailCoat:'tabby_gray_0',head:'oval',eyes:'round',ears:'tall',tail:'long',body:'slim',age:'adult',muzzle:'white',seed}:CatSVG.sampleDNA(++seed);
 if(galleryCoatSeed!==null)d=CatSVG.sampleDNA(galleryCoatSeed,d,true);
 if(sampleParams.get('coat')==='calico')Object.assign(d,{headCoat:'calico',bodyCoat:'calico',legCoat:'calico',tailCoat:'calico',seed:2718});
 d.mood='neutral';rig=CatSVG.buildCat(svg,'life',d,390,1);if(sampleParams.has('head-turn'))rig.reviewHeadTurn=Number(sampleParams.get('head-turn'));rig.reviewDirection=sampleParams.get('direction');svg.querySelector('.floor').remove();
 const ns='http://www.w3.org/2000/svg',shadow=document.createElementNS(ns,'ellipse');shadow.setAttribute('data-life-shadow','');shadow.setAttribute('cx','368');shadow.setAttribute('cy','392');shadow.setAttribute('rx',d.age==='kitten'?'48':'66');shadow.setAttribute('ry','9');shadow.setAttribute('fill','#6d644b');shadow.setAttribute('opacity','.16');svg.insertBefore(shadow,rig.nodes.travel);
 const toy=document.createElementNS(ns,'g');toy.dataset.lifeToy='';toy.innerHTML='<ellipse cx="0" cy="4" rx="14" ry="4" fill="#75684a" opacity=".2"/><path d="M7 0Q30 -2 23 -11" fill="none" stroke="#8d7057" stroke-width="2"/><path d="M-12 0Q-10 -13 2 -9Q14 -4 10 2Q0 7 -12 0Z" fill="#a67c60"/><path d="M-7 -7Q-11 -17 -1 -14L2 -8Z" fill="#cfab88"/><circle cx="-8" cy="-4" r="1.5" fill="#354536"/>';svg.insertBefore(toy,rig.nodes.travel);
 draw(0);response.textContent=currentDescription();
}
function setEar(side,angle){const x=side==='L'?-30:30,s=rig.d.ears==='small'?.76:1,tf=`translate(${x} -10) rotate(${angle}) scale(${s}) translate(${-x} 10)`;rig.nodes['ear'+side].setAttribute('transform',tf);rig.nodes['inner'+side].setAttribute('transform',tf);svg.querySelector(`[data-clip-ear="${side}"]`).setAttribute('transform',tf);}
function draw(dt){
 const w=modeMix.wary=ease(modeMix.wary,mode==='wary'?1:0,3,dt),a=modeMix.warm=ease(modeMix.warm,mode==='warm'?1:0,3,dt);
 if(time>nextLook){look={x:Math.sin(time*2.71+seed)*.7,y:Math.cos(time*1.37)*.3};nextLook=time+2.4+(Math.sin(time)+1)*1.3;}
 const callAge=time-callAt,petAge=time-petAt,calling=callAge>=0&&callAge<2.8,petting=petAge>=0&&petAge<2.2;
 let target=CatLifeMotion.toys.has(pose)?{x:-.65,y:.65}:time<pointer.until?pointer:look;if(calling)target={x:0,y:-.2};
 gaze.x=ease(gaze.x,target.x,10,dt);gaze.y=ease(gaze.y,target.y,10,dt);head.x=ease(head.x,gaze.x,2.8,dt);head.y=ease(head.y,gaze.y,2.8,dt);
 if(time>nextBlink){blinkAt=time;blinkDuration=.28+a*.5;nextBlink=time+3.2+(1+Math.sin(time*3.1))*1.6;}
 if(time>nextEar){earAt=time;nextEar=time+3.5+(1+Math.cos(time*2))*2;}
 poseTime+=dt;
 const petEnvelope=petting?Math.sin(Math.PI*petAge/2.2):0,breath=Math.sin(time*(1.7+w*.55));let m=original?CatSVG.poseModel(pose,poseTime):CatLifeMotion.model(pose,poseTime);
 if(!original&&pose==='sit'){
 m.bw=1+breath*.014;m.by=-87-breath*.8+w*6;m.bh=1-w*.04;
 m.hx=head.x*(7-w*3)+petEnvelope*4;m.hy=-195+head.y*3+breath*.85+w*11-a*3;
 m.hr=head.x*5+a*4+petEnvelope*7;m.headTurn=1-Math.abs(head.x)*.055;
 m.tr=Math.sin(time*.85-.6)*(5+a*4)+w*9;m.tx=39;m.ty=-25;
 m.bend=head.x*.8;m.legs=m.legs.map(l=>l.slice()); // Ground coordinates never change.
 }else if(!original&&!['sleep','rest','wall'].includes(pose)&&!CatLifeMotion.toys.has(pose)){
  m.hx+=head.x*2;m.hr+=head.x*1.5+a*1.5;m.bw*=1+breath*.006;
 }
 // Keep a long sleeping tail resting beside the body, not below the floor/UI.
 if(!original&&pose==='sleep'){m.tx=40;m.ty=-15;}
 if(poseTransition){poseTransition.elapsed+=dt;const u=clamp(poseTransition.elapsed/.5,0,1);m=CatSVG.mixModel(poseTransition.from,m,u*u*(3-2*u));if(u===1)poseTransition=null;}
 lastModel=structuredClone(m);CatLifeMotion.reset(rig);CatSVG.applyPose(rig,m,pose==='sit'?0:poseTime,pose);
 if(original){rig.nodes.face.removeAttribute('transform');svg.querySelector('[data-life-toy]').style.display='none';svg.dataset.pose=pose;svg.dataset.time=time.toFixed(2);return;}
 const twitch=Math.sin(clamp((time-earAt)/.6,0,1)*Math.PI)*9;
 const acting=CatLifeMotion.expression(pose,poseTime);
 const listen=calling?Math.sin(clamp(callAge/.5,0,1)*Math.PI)*12:0;
 setEar('L',-w*24-acting.ear-head.x*6-twitch*.4-listen);setEar('R',w*24+acting.ear-head.x*6+twitch+listen*.3+(rig.d.ears==='tilted'?15:0));
 // Smooth eyelids/pupils reuse the exact shipping eye outlines and eye colours.
 const age=time-blinkAt,blink=age>=0&&age<blinkDuration?Math.sin(Math.PI*age/blinkDuration):0;
 const opening=Math.max(.045,(1-blink)*(1-a*.35-petEnvelope*.6)*acting.lid);
 for(const def of rig.nodes.face.querySelectorAll('defs')){
  const shape=def.nextElementSibling,iris=shape.nextElementSibling,pupil=iris.querySelector('ellipse');
  const cy=rig.d.head==='ruff'?0:-3,tf=`translate(0 ${cy}) scale(1 ${opening}) translate(0 ${-cy})`;
  shape.setAttribute('transform',tf);iris.setAttribute('transform',tf);
  pupil.setAttribute('transform',`translate(${(calling?gaze.x:acting.eye*.7+gaze.x*.3)*4} ${gaze.y*2})`);pupil.setAttribute('rx',String(3.2+w*3.2+a*1.5));
 }
 CatLifeMotion.finish(rig,m,pose,poseTime);
 svg.dataset.mode=mode;svg.dataset.pose=pose;svg.dataset.time=time.toFixed(2);
 if(!calling&&!petting&&response.textContent!==currentDescription())response.textContent=currentDescription();
}
function frame(now){const dt=last?Math.min(.05,(now-last)/1000):0;last=now;if(!paused&&!document.hidden){time+=dt;draw(dt);}requestAnimationFrame(frame);}
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.mode;document.querySelectorAll('[data-mode]').forEach(n=>n.setAttribute('aria-pressed',String(n===b)));response.textContent=descriptions[mode];if(paused){modeMix={wary:mode==='wary'?1:0,warm:mode==='warm'?1:0};draw(0);}}));
function track(e){const r=stage.getBoundingClientRect();pointer={x:clamp((e.clientX-r.left)/r.width*2-1,-1,1),y:clamp((e.clientY-r.top)/r.height*2-1,-1,1),until:time+2};}
stage.addEventListener('pointermove',track);stage.addEventListener('pointerdown',e=>{track(e);const point=new DOMPoint(e.clientX,e.clientY).matrixTransform(rig.nodes.headRig.getScreenCTM().inverse());if(Math.abs(point.x)<65&&point.y>-80&&point.y<40){petAt=time;response.textContent=mode==='wary'?'まだ緊張しています。そっと、ゆっくり。':'そっとなでると、目を細めます。';if(mode==='wary')petAt=-100;}});
document.querySelector('#call').addEventListener('click',()=>{callAt=time;earAt=time;response.textContent='声に気づいて、こちらを向きます。';});
const pause=document.querySelector('#pause');function showPause(){pause.innerHTML=paused?'動きを再開 <span>›</span>':'一時停止 <span>Ⅱ</span>';pause.setAttribute('aria-pressed',String(paused));}pause.addEventListener('click',()=>{paused=!paused;showPause();});showPause();
document.querySelector('#change').addEventListener('click',()=>mount());mount(true);requestAnimationFrame(frame);
