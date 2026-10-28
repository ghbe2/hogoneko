'use strict';
// Review the same per-action type selection used by the production game.
const TYPES={outgoing:{delay:.25,amount:1},gentle:{delay:.65,amount:.7},cautious:{delay:1.1,amount:.8}};
const COPY=['自分から近づき、前足を交互に踏み込みながら繰り返し頬と体を寄せる。','一度だけ近づいて体を寄せ、その場で穏やかに受け入れる。','顔だけ一度向ける。体も足も近づかず、そのまま見送る。','顔をそらして一歩引く。耳は横向き。','耳を伏せ、低くなって距離を取る。刺激を止めてあげる。'];
let rigs=[],time=0,last=0,paused=matchMedia('(prefers-reduced-motion:reduce)').matches,seed=2718,audio=null,sounding=null,soundCycle=-1,sources=[];
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
const field=id=>document.getElementById(id);
function reviewTypes(type){return[type,field('personality2')?.value].filter(t=>CAT_BEHAVIOR_TYPES[t]);}
function reviewDelay(type){return TYPES[type]?.delay??.35;}
function typedReactionFrame(i,t,type,op){
 const plan=catReactionPlan(reviewTypes(type),Object.keys(CAT_REACTIONS)[i],op),u=t%10;
 const pose=u<plan.delay?'sit':plan.lead&&u<plan.delay+.75?plan.lead:plan.motion;
 const local=Math.max(0,u-plan.delay-(plan.lead?.75:0)),speed=1;
 const m=CatSVG.poseModel(pose,local*speed),blend=smooth((u-plan.delay)/.5),base=CatSVG.poseModel('sit',0);
 base.reactionOffset=0;
 return{m:CatSVG.mixModel(base,m,blend),pose,mood:plan.mood,dx:0,ear:i===4?35:i===3?18:0,u,faceTurn:CatLifeMotion.expression(pose,local*speed).turn*.65,plan};
}
function stopSound(){sources.forEach(s=>{try{s.stop();}catch{}});sources=[];}
function voiceKind(i){if(CAT_BEHAVIOR_TYPES[field('personality').value])return catReactionPlan(reviewTypes(field('personality').value),Object.keys(CAT_REACTIONS)[i],field('operation').value).voice;const type=field('personality').value,op=field('operation').value;return i===0?(op==='play'?'chirp':type==='gentle'?'purr':'meow'):i===1&&type==='outgoing'?'chirp':i===4&&type==='outgoing'&&['pet','groom'].includes(op)?'hiss':'silent';}
function voice(i){const kind=voiceKind(i);field('sound-status').textContent=kind==='silent'?'この反応は無言です。':`仮音：${{meow:'ニャー',chirp:'短い声',purr:'ゴロゴロ',hiss:'シャー'}[kind]}`;if(kind==='silent'||!audio)return;stopSound();const c=audio,t=c.currentTime,d=kind==='purr'?1.3:kind==='hiss'?.42:.7,g=c.createGain();g.connect(c.destination);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.07,t+.04);g.gain.exponentialRampToValueAtTime(.0001,t+d);
 if(kind==='hiss'){const b=c.createBuffer(1,c.sampleRate*d,c.sampleRate),a=b.getChannelData(0);for(let j=0;j<a.length;j++)a[j]=(Math.random()*2-1)*.5;const s=c.createBufferSource(),f=c.createBiquadFilter();s.buffer=b;f.type='highpass';f.frequency.value=1800;s.connect(f);f.connect(g);s.start(t);s.stop(t+d);sources.push(s);}
 else{const s=c.createOscillator(),f=c.createBiquadFilter();s.type='sawtooth';s.frequency.setValueAtTime(kind==='purr'?85:kind==='chirp'?580:460,t);s.frequency.exponentialRampToValueAtTime(kind==='purr'?75:720,t+d*.35);s.frequency.exponentialRampToValueAtTime(kind==='purr'?80:330,t+d);f.type='bandpass';f.Q.value=1.8;f.frequency.setValueAtTime(kind==='purr'?170:1400,t);f.frequency.linearRampToValueAtTime(kind==='purr'?150:650,t+d);s.connect(f);f.connect(g);s.start(t);s.stop(t+d);sources.push(s);if(kind==='purr'){const l=c.createOscillator(),lg=c.createGain();l.frequency.value=25;lg.gain.value=.018;l.connect(lg);lg.connect(g.gain);l.start(t);l.stop(t+d);sources.push(l);}}
}
function reactionFrame(i,t,type,op){if(CAT_BEHAVIOR_TYPES[type])return typedReactionFrame(i,t,type,op);const p=TYPES[type],u=t%8,a=smooth((u-p.delay)/.65)*(1-smooth((u-6.5)/1.3)),step=smooth((u-p.delay)/1.1)*(1-smooth((u-6.5)/1.3));let pose='sit',mood='neutral',dx=0,ear=0;
 if(i===0){pose=op==='play'?'bat':op==='food'?'eat':'knead';mood='happy';dx=-44*p.amount*step;}
 if(i===1){mood='happy';dx=-20*step;}if(i===3){dx=23*step;ear=30;}if(i===4){pose='cower';mood=type==='outgoing'&&['pet','groom'].includes(op)&&u>p.delay+.8&&u<p.delay+1.22?'angry':'wary';dx=(type==='cautious'?62:46)*step;ear=65;}
 const target=CatSVG.poseModel(pose,t),base=CatSVG.poseModel('sit',t);
 if(i===0&&pose==='knead'){
  // Repeated soliciting contact: grounded hind feet, alternating forefeet,
  // shoulder weight shift and cheek rub. Not a whole-sprite wobble.
  const tempo=type==='gentle'?2.4:type==='cautious'?2.8:3.5;
  const beat=Math.sin((u-p.delay)*tempo);
  // Shoulder and skull share one weight shift. Yaw, not a large head roll,
  // conveys looking from side to side; no independent slow head oscillation.
  target.bx=-8+beat*7;target.br=-3+beat*2;target.bend=-2+beat*2;target.by=-87+Math.abs(beat)*2;
  target.hx=target.bx-2+beat*2;target.hy=-190+Math.abs(beat)*2;target.hr=-3+beat*2;
  target.legs[1]=[-22+beat*5,-107,-28,-Math.max(0,beat)*26];
  target.legs[3]=[15+beat*5,-105,12,-Math.max(0,-beat)*26];target.tr=-48+Math.sin(u*.8)*3;
 }
 if(i===1){const lean=smooth((u-p.delay-.7)/.65)*(1-smooth((u-3.2)/.8));target.bx=-5-lean*6;target.br=-3-lean*4;target.bend=-2;target.hr=-5-lean*7;target.hx=-7-lean*8;target.hy-=lean*4;target.tr=-25;}
 if(i<2&&op!=='play'&&op!=='food')target.sleep=u>2.8&&u<3.35?1:0;
 if(i===2){target.hr=8*Math.sin(Math.min(1,Math.max(0,(u-.5)/2))*Math.PI);target.hx=0;target.tr=0;target.bx=0;target.br=0;}
 if(i===3){target.hr=19;target.hx=13;target.tr=12+Math.sin(t*5)*6;}
 if(i===4){target.tr=8;target.tx=20;target.ty=-25;}
 // Positive AND neutral affinity must perform the action that earns progress.
 // Affinity changes eagerness, not whether eating/playing exists at all.
 const engaged=i<=2&&['play','food'].includes(op);
 const actionDelay=p.delay+(engaged?[0,.3,.65][i]:0);
 const actionTime=Math.max(0,u-actionDelay)*[1.1,.85,.65][Math.min(i,2)];
 if(engaged){pose=op==='play'?'bat':'eat';Object.assign(target,CatSVG.poseModel(pose,actionTime));dx=-[36,25,15][i]*smooth((u-actionDelay)/1.1)*(1-smooth((u-6.5)/1.3));}
 const amount=engaged?smooth((u-actionDelay)/.65)*(1-smooth((u-6.5)/1.3)):a;
 const m=CatSVG.mixModel(base,target,amount),moving=u>p.delay&&u<p.delay+1.1||u>6.5&&u<7.8;
 if(moving&&i!==2)m.legs=m.legs.map((l,j)=>[l[0],l[1],l[2],l[3]-Math.max(0,Math.sin((u-p.delay)*11+j*Math.PI))*8]);
 let faceTurn=0;
 if(i===0)faceTurn=pose==='knead'?Math.sin((u-p.delay)*(type==='gentle'?2.4:type==='cautious'?2.8:3.5))*.55*a:(-.38+Math.sin(u*1.2)*.12)*a;
 if(i===1)faceTurn=(-.26+.16*Math.sin((u-p.delay)*1.1))*a;
 if(i===2)faceTurn=.4*Math.sin(Math.PI*smooth((u-p.delay)/2.6))*a;
 if(i===3)faceTurn=.58*smooth((u-p.delay)/1.2)*a;
 if(i===4)faceTurn=(-.32+.18*Math.sin((u-p.delay)*1.5))*a;
 if(engaged)faceTurn=(-.38+Math.sin(actionTime*1.2)*.1)*amount;
 return{m,pose,mood:a>.3?mood:'neutral',dx,ear:ear*a,u,faceTurn};}
function mount(){document.querySelector('main').replaceChildren();rigs=[];const dna={...CatSVG.sampleDNA(seed),age:'adult',body:'round',eyes:'round',head:'oval',ears:'tall',tail:'long'};Object.entries(CAT_REACTIONS).forEach(([key,d],i)=>{const card=document.createElement('article');card.dataset.affinity=key;card.innerHTML=`<svg viewBox="180 80 400 400" aria-label="${d.label}の反応"></svg><div class="caption"><h2>${d.label}</h2><p class="description">${COPY[i]}</p><p class="pose"></p><button class="listen">音と動作を再生 →</button></div>`;document.querySelector('main').append(card);const svg=card.querySelector('svg'),rig=CatSVG.buildCat(svg,'review-'+i,{...dna},390,1);rig.depthManual=true;svg.querySelector('.floor')?.remove();const holder=document.createElementNS('http://www.w3.org/2000/svg','g');rig.nodes.travel.parentNode.insertBefore(holder,rig.nodes.travel);holder.append(rig.nodes.travel);rigs.push({i,rig,card,holder});card.querySelector('button').onclick=async()=>{audio||=new AudioContext();await audio.resume();sounding=i;paused=false;reset();labelPause();};});draw();}
function draw(){const type=field('personality').value,op=field('operation').value;for(const {i,rig,card,holder}of rigs){const f=reactionFrame(i,time,type,op);rig.d.mood=f.mood;rig.d.eyes=i===0&&f.mood==='happy'?'droop':'round';rig.reviewHeadTurn=f.faceTurn===null?undefined:0;CatSVG.applyPose(rig,f.m,time,f.pose);
 holder.setAttribute('transform',`translate(${f.dx} 0)`);if(f.ear)for(const side of ['L','R']){const x=side==='L'?-30:30,s=rig.d.ears==='small'?.76:1,angle=side==='L'?-f.ear:f.ear,tf=`translate(${x} -10) rotate(${angle}) scale(${s}) translate(${-x} 10)`;rig.nodes['ear'+side].setAttribute('transform',tf);rig.nodes['inner'+side].setAttribute('transform',tf);rig.svg.querySelector(`[data-clip-ear="${side}"]`).setAttribute('transform',tf);}
 CatFaceDepth.apply(rig,f.faceTurn);
 card.dataset.pose=f.pose;card.dataset.mood=f.mood;card.dataset.personality=type;if(f.plan)card.dataset.selectedType=f.plan.type;
 const engaged=i<=2&&['play','food'].includes(op);
 card.querySelector('.pose').textContent=f.u<reviewDelay(type)?'気づく前':f.u>6.5?'落ち着く':engaged?(op==='play'?'遊ぶ':'食べる'):['もっと触れてほしい','受け入れる','見送る','やめてほしい','距離を取りたい'][i];
 card.querySelector('.description').textContent=engaged?(op==='play'?['すぐに構え、前足を続けて出して遊ぶ。','近づいて構え、前足を出して遊ぶ。','少し確認してから、ゆっくり前足を出して遊ぶ。'][i]:['すぐに近づき、勢いよく食べ始める。','近づいて、落ち着いて食べ始める。','少し確認してから、ゆっくり食べ始める。'][i]):COPY[i];
 if(f.plan){const labels={sit:'確認する',knead:'甘える・ふみふみ',settle:'静かに受け入れる',sniff:'匂いを確かめる',bat:'前足で遊ぶ',pin:'狙って押さえる',hunt:'狙う・捕まえる',stalk:'低く狙う',eat:'食べる',disengage:'接触を外して離れる',cower:'低く身を守る',avoid:'顔をそらして断る'};card.querySelector('.pose').textContent=labels[f.plan.pose]||f.plan.pose;card.querySelector('.description').textContent=CAT_BEHAVIOR_TYPES[f.plan.type][0]+'の傾向：'+(f.plan.lead?labels[f.plan.lead]+' → ':'')+labels[f.plan.pose]+(['play','food'].includes(op)&&i<3?['（積極的に続ける）','（短く休みながら続ける）','（一動作ごとに様子を見る）'][i]:'');}
 }
 const cycle=Math.floor(time/8);if(!paused&&sounding!==null&&time%8>reviewDelay(type)+.8&&cycle!==soundCycle){soundCycle=cycle;voice(sounding);}}
function labelPause(){field('pause').textContent=paused?'再生 →':'一時停止 →';}function reset(){stopSound();time=0;soundCycle=-1;draw();}
field('pause').onclick=()=>{paused=!paused;if(paused)stopSound();labelPause();};field('restart').onclick=reset;field('random').onclick=()=>{seed=crypto.getRandomValues(new Uint32Array(1))[0];reset();mount();};for(const id of ['operation','personality'])field(id).onchange=reset;
field('mute').onclick=()=>{sounding=null;stopSound();field('sound-status').textContent='無音で比較中';};field('labels').onclick=()=>document.body.classList.toggle('blind');document.addEventListener('visibilitychange',()=>{if(document.hidden){paused=true;stopSound();labelPause();}});
const options=Object.entries(CAT_BEHAVIOR_TYPES).map(([id,r])=>`<option value="${id}">${r[0]}</option>`).join('');
field('personality').innerHTML=options;
field('personality').setAttribute('aria-label','猫のタイプ1');
const second=document.createElement('select');second.id='personality2';second.setAttribute('aria-label','猫のタイプ2');second.innerHTML='<option value="">2つ目なし</option>'+options;field('personality').after(second);second.onchange=reset;
mount();labelPause();requestAnimationFrame(function frame(now){if(!paused)time+=Math.min(.05,(now-(last||now))/1000);last=now;draw();requestAnimationFrame(frame);});
