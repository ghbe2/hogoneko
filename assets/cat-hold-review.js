/* Isolated interaction study: no production save or renderer changes. */
'use strict';
const $=id=>document.getElementById(id),room=$('room'),animal=$('animal');
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x)};
let rig,seed=2718,phase='idle',elapsed=0,clock=0,last=0,draft=null,px=.5,py=.78,tx=.5,ty=.78,blend=0,landBlend=0,landX=.5,landY=.78,escapeFrom=.5,escapeTo=.5,forced=false;
// Affinity moves one step toward acceptance at each trust tier. No endurance timers.
function rule(){const base=+$('affinity').value,h=+$('heart').value,tier=h>=90?2:h>=70?1:0,a=Math.max(0,base-tier);return {base,a,h,tier,limit:a===4?0:Infinity,away:a>=2,tense:a>=2};}
function note(s){$('status').textContent=s;}
function setPhase(p){phase=p;elapsed=0;document.querySelector('.instruction').style.visibility=p==='idle'?'visible':'hidden';document.querySelectorAll('[data-step]').forEach(n=>n.classList.toggle('active',n.dataset.step===(p==='lift'?'lift':p==='hold'?'hold':['land','escape'].includes(p)?'land':'')));}
function releasePointer(){const old=draft;draft=null;if(old&&animal.hasPointerCapture(old.id))animal.releasePointerCapture(old.id);}
function land(force=false){if(!['lift','hold'].includes(phase))return;forced=force;landBlend=blend;landX=px;landY=py;releasePointer();setPhase('land');note(force?'降りたがったので、床へ。':'そっと床に降ろします。');}
function reset(){releasePointer();px=tx=.5;py=ty=.78;blend=0;setPhase('idle');note('ネコに触れてみてください。');describe();}
function describe(){const r=rule();$('heart-value').value=r.h;$('plan').textContent=['くつろぎながら前足を舐める → 降りてもそばにいる','大人しく抱かれる → 降りてもそばにいる','後ろ足をけりけりするが降りない → 降ろすと離れる','持ち上げ終わった瞬間に降りる → 離れる','持ち上がる前に拒否 → 離れる'][r.a];}
function mount(){const dna={...CatSVG.sampleDNA(seed),head:'oval',body:'round',eyes:'round',ears:'tall',tail:'long',age:'adult'};rig=CatSVG.buildCat($('cat'),'hold-cat',dna,390,1);rig.depthManual=true;$('cat').querySelector('.floor')?.remove();}
animal.addEventListener('pointerdown',e=>{if(!e.isPrimary||!['idle','pet'].includes(phase))return;draft={id:e.pointerId,x:e.clientX,y:e.clientY,px,py};animal.setPointerCapture(e.pointerId);});
animal.addEventListener('pointermove',e=>{if(!draft||draft.id!==e.pointerId)return;const dx=e.clientX-draft.x,dy=e.clientY-draft.y;if(!['lift','hold'].includes(phase)&&Math.hypot(dx,dy)>10){if(rule().limit===0){releasePointer();setPhase('reject');note('身を低くして、抱っこを断りました。');return;}setPhase('lift');note('胸とお尻を支えて、持ち上げます。');}if(['lift','hold'].includes(phase)){const r=room.getBoundingClientRect();tx=clamp(draft.px+dx/r.width,.23,.77);ty=clamp(draft.py+dy/r.height-.16,.48,.66);e.preventDefault();}});
animal.addEventListener('pointerup',e=>{if(!draft||draft.id!==e.pointerId)return;if(['lift','hold'].includes(phase))land();else{releasePointer();setPhase('pet');note('なでなで。');}});
function cancel(){if(['lift','hold'].includes(phase))land();else releasePointer();}
animal.addEventListener('pointercancel',cancel);animal.addEventListener('lostpointercapture',()=>{if(draft)cancel()});window.addEventListener('blur',cancel);document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel()});
$('affinity').onchange=reset;$('heart').oninput=reset;document.querySelectorAll('[data-heart]').forEach(b=>b.onclick=()=>{$('heart').value=b.dataset.heart;reset()});$('reset').onclick=reset;$('coat').onclick=()=>{reset();seed=crypto.getRandomValues(new Uint32Array(1))[0];mount()};
function frame(now){const dt=Math.min(.1,(now-last)/1000||0);last=now;clock+=dt;elapsed+=dt;const r=rule();
 if(phase==='lift'||phase==='hold'){blend=Math.min(1,blend+dt/.22);px+=(tx-px)*(1-Math.exp(-dt*16));py+=(ty-py)*(1-Math.exp(-dt*16));if(phase==='lift'&&elapsed>.22){setPhase('hold');note(r.a===2?'後ろ足をけりけり。抱っこは続いています。':r.tense?'耳を横に向け、少し緊張しています。':r.a===0?'前足を舐めながら、くつろいでいます。':r.a===1?'前足の力を抜き、ゆっくり目を細めています。':'落ち着いて、抱かれています。');}if(phase==='hold'&&r.a===3)land(true);}
 if(phase==='reject'&&elapsed>.25){escapeFrom=px;escapeTo=clamp(px+(px>.5?-.25:.25),.23,.77);setPhase('escape');}
 if(phase==='land'){const u=smooth(elapsed/.55);px=landX;py=landY+(.78-landY)*u;blend=landBlend*(1-u);if(u===1){if(r.away){escapeFrom=px;escapeTo=clamp(px+(px>.5?-.25:.25),.23,.77);setPhase('escape');note(r.a===4?'降りると、距離を取りました。':'降りて、少し離れました。');}else{setPhase('idle');note(forced?'足をついて、ひと休み。':'降りても、そばにいます。');}}}
 if(phase==='escape'){px=escapeFrom+(escapeTo-escapeFrom)*smooth(elapsed/1.2);if(elapsed>=1.2)setPhase('idle');}
 if(phase==='pet'&&elapsed>1.4)setPhase('idle');let pose=phase==='escape'?'walk':phase==='reject'?'cower':'sit';let m=CatLifeMotion.model(pose,clock);if(blend>0)m=CatSVG.mixModel(m,CatHoldMotion.model(clock,r,elapsed,phase),smooth(blend));if(phase==='pet'){m.hr=Math.sin(elapsed*4)*7;m.sleep=.8;}
 rig.d.mood=phase==='reject'?'wary':blend>.2?(r.tense?'wary':r.a<2?'happy':'neutral'):'neutral';rig.reviewDirection=escapeTo>escapeFrom?'right':'left';CatSVG.applyPose(rig,m,clock,pose);CatHoldMotion.decorate(rig,r,blend,clock,elapsed,phase);
 animal.style.left=px*100+'%';animal.style.top=py*100+'%';$('shadow').style.left=px*100+'%';$('shadow').style.opacity=1-blend*.6;animal.dataset.phase=phase;animal.dataset.blend=blend.toFixed(3);requestAnimationFrame(frame);}
mount();describe();requestAnimationFrame(frame);
