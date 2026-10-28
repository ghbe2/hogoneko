'use strict';
// Shared motion director for the game and its pose review pages.
window.CatLifeMotion=(()=>{
 const basePoseModel=CatSVG.poseModel;
 const tau=Math.PI*2,clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
 const toys=new Set(['stalk','bat','pin','hunt']);
 // A held glance, with separate eye and head timing, not perpetual oscillation.
 function glance(t,delay=0){const u=((t-delay)%7+7)%7;return u<1.2?0:u<1.8?smooth((u-1.2)/.6):u<3?1:u<3.8?1-2*smooth((u-3)/.8):u<5?-1:u<5.8?-1+smooth((u-5)/.8):0;}
 function expression(p,t){
  if(p.startsWith('reaction')){const [tag,base]=p.split(':'),level=Number(tag.slice(8)),e=expression(base,t);e.lid=[.6,.8,1][level];return e;}
  const q=action(p,t),horizontal=['walk','dash','jump','stalk','bat','pin','hunt','scratch','eat','poop','vomit','rest','sleep'].includes(p);
  let turn=horizontal?-.65:glance(t,.22)*.68,eye=glance(t)*.7,lid=1,ear=0;
  if(toys.has(p)){turn=-.58-.25*glance(t,.16);eye=-.8;lid=.85;ear=-5;}
  if(p==='walk'){turn=-.66+.24*glance(t,.25);eye=-.6;}
  if(p==='dash'||p==='jump'){turn=-.85;eye=-.9;lid=.88;}
  if(p==='cower'){turn=glance(t,.35)*.48;lid=.76;ear=28;}
  if(p==='alert'){turn=glance(t,.12)*.85;ear=-7;}
  if(p==='punch'){turn=-.65;eye=-.9;lid=.8;ear=12;}
  if(p==='knead'){turn=glance(t,.5)*.22;lid=.48;}
  if(p==='sniff'){turn=-.4+.14*Math.sin(t*1.8);lid=.9;}
  if(p==='settle'){turn=-.18;lid=1-.55*smooth(((t%8)-1)/2);}
  if(p==='disengage'){turn=.55*smooth(((t%8)-.4)/1.2);ear=16;}
  if(p==='avoid'){turn=.85*smooth((t%8)/.6);ear=18;lid=.85;}
  if(p==='rest'){turn=-.35+.24*glance(t,.4);lid=.55;}
  if(p==='sleep'){turn=-.35;lid=0;}
  if(p==='eat'){turn=-.8+.18*glance(t,.2);eye=-.65;lid=.65;}
  if(p==='vomit'){lid=.3;ear=22;turn=-.83;}
  if(p==='poop'){turn=-.6+.32*glance(t,.4);lid=.72;ear=9;}
  if(p==='scratch'){turn=-.8;eye=-.8;lid=.8;}
  return {turn,eye,lid,ear};
 }
 function action(p,t){if(p!=='hunt')return {pose:p,t};const u=t%7.8;return u<2?{pose:'stalk',t:u}:u<4.4?{pose:'bat',t:u-2}:u<6.5?{pose:'pin',t:u-4.4}:{pose:'stalk',t:u-6.5};}
 // Lift slowly, strike quickly, stay in contact, then release. Not a sine-wave punch.
 function strike(t,offset=0){const u=(t+offset)%1.05;return u<.34?{reach:0,lift:smooth(u/.34),hit:0}:u<.46?{reach:smooth((u-.34)/.12),lift:1-smooth((u-.34)/.12),hit:0}:u<.67?{reach:1,lift:0,hit:Math.exp(-(u-.46)*16)}:{reach:1-smooth((u-.67)/.38),lift:0,hit:0};}
 function toyModel(p,t){
  const a=action(p,t),q=a.pose,u=a.t,m=basePoseModel('walk',0),breath=Math.sin(t*1.9);
  Object.assign(m,{bx:8,by:-47,br:-87,bw:.65,bh:1.04,hx:-62,hy:-78,hr:8,hs:.91,yaw:76,headTurn:.93,tx:75,ty:-47,tr:-30,frontBend:.18,bend:2,rumpRaise:5});
  m.legs=[[61,-40,70,0],[-43,-42,-65,0],[74,-38,83,0],[-36,-40,-59,0]];
  m.bw+=breath*.008;m.hy+=Math.sin(t*1.9-.4)*.7;
  if(q==='stalk'){
   const coil=Math.sin(u*5)*Math.pow(Math.max(0,Math.sin(u*1.6)),3);
   m.bx+=coil*1.7;m.rumpRaise+=coil*2.8;m.hx+=Math.sin(u*.9)*2;m.tr+=Math.sin(u*3)*3;
  }
  if(q==='bat'){
   const l=strike(u),r=strike(u,.525),lead=l.reach-r.reach;
   m.legs[1]=[-43,-42,-65-l.reach*49,-l.lift*47];m.legs[3]=[-36,-40,-59-r.reach*52,-r.lift*48];
   m.bx-=Math.max(l.reach,r.reach)*4;m.bend+=lead*5;m.rumpRaise-=lead*2;
   m.hx-=Math.max(l.reach,r.reach)*5;m.hy+=Math.max(l.hit,r.hit)*2;m.hr+=lead*3;
   m.tr+=Math.sin(u*4-.7)*7;
  }
  if(q==='pin'){
   const cycle=u%2.1;
   const lift=cycle<.5?smooth(cycle/.5):1-smooth((cycle-.5)/.14);
   const reach=cycle<.5?smooth(cycle/.5)*.35:cycle<1.55?.35+.65*smooth((cycle-.5)/.14):1-smooth((cycle-1.55)/.55);
   const impact=cycle>=.64?Math.exp(-(cycle-.64)*12):0;
   m.legs[1]=[-43,-42,-65-reach*49,-lift*58];m.legs[3]=[-36,-40,-59-reach*49,-lift*56];
   m.by-=lift*9;m.hx-=reach*9;m.hy-=lift*15;m.hy+=impact*6;
   m.bx-=reach*6;m.bend=-lift*7+impact*6;m.rumpRaise=4+lift*4;m.tr=-30+lift*12-impact*8;
  }
  return m;
 }
 function model(p,t){
  if(p.startsWith('reaction')){
   const [tag,base]=p.split(':'),level=Number(tag.slice(8)),u=t%6;
   // A visible sequence, not merely three playback speeds: eager continuous
   // engagement, sustained engagement with a short pause, single actions with
   // clear observation breaks. Every positive level still plays/eats.
   const active=level===0||u<(level===1?4.4:2.5);
   const activeModel=model(base,t*[1.2,.85,.7][level]);
   const waiting=model(base==='eat'?'walk':'stalk',0);
   if(base==='eat'){waiting.hx=level===1?-89:-72;waiting.hy=level===1?-72:-102;waiting.hr=level===1?12:-4;}
   const amount=level===0?1:1-smooth((u-(level===1?4.1:2.2))/.3);
   const m=CatSVG.mixModel(waiting,activeModel,amount);
   if(level===0){m.bx-=5;m.hx-=5;m.tr-=12;}
   if(level===2&&active&&base!=='eat'){
    // Keep a single deliberate paw reach, not the enthusiastic double strike.
    m.legs[3]=[-36,-40,-59,0];
   }
   return m;
  }
  if(p==='avoid'){
   const m=basePoseModel('sit',t),a=smooth((t%8)/.6);
   m.hx+=12*a;m.hr+=8*a;m.br+=3*a;m.tr+=Math.sin(t*3)*10;
   return m;
  }
  if(['sniff','settle','disengage'].includes(p)){
   const u=t%(p==='disengage'?10:8),envelope=smooth(u/.8)*(1-smooth((u-6.6)/1.4)),m=basePoseModel('sit',t);
   if(p==='sniff'){
    const reach=smooth((u-.4)/1.2)*envelope,check=Math.sin(u*8)*smooth((u-1.4)/.5)*(1-smooth((u-4.7)/.6));
    m.bx=-7*reach;m.br=-4*reach;m.hx=-18*reach+check*1.4;m.hy+=10*reach+check*.7;m.hr=-4*reach;m.bend=-2*reach;
   }else if(p==='settle'){
    const relax=smooth((u-1)/2)*envelope;
    m.by+=7*relax;m.bh-=.07*relax;m.bw+=.03*relax;m.hy+=13*relax;m.hr=-4*relax;m.tr=3*Math.sin(t*.5);m.sleep=0;
    m.legs[1]=[-19,-110+7*relax,-19,0];m.legs[3]=[18,-108+7*relax,18,0];
   }else{
    // Turn away, get all four paws underneath, then retreat. Never translate
    // the upright seated model. Return travel is only the preview's loop reset.
    const standing=smooth((u-.45)/.75)*(1-smooth((u-8.3)/.8));
    const out=Math.max(0,Math.min(2,u-1.4)),back=Math.max(0,Math.min(2,u-6));
    const moving=u>=1.4&&u<3.4||u>=6&&u<8,sign=u<6?1:-1;
    const walking=basePoseModel('walk',0);
    walking.hx=-72;walking.hy=-100;walking.hr=-3;walking.headTurn=1;
    walking.legs=walking.legs.map((l,i)=>{
     const anchor=i%2?-65:72,phase=(((u-(sign>0?1.4:6))/1.4+[.5,.25,0,.75][i])%1+1)%1;
     const stance=phase<.7,v=stance?phase/.7:(phase-.7)/.3;
     const x=stance?11.76-23.52*v:-11.76+23.52*smooth(v);
     const fade=moving?Math.min(smooth((u-(sign>0?1.4:6))/.2),1-smooth((u-(sign>0?3.2:7.8))/.2)):0;
     return[l[0],l[1],anchor+sign*x*fade,stance?0:-9*Math.sin(v*Math.PI)*fade];
    });
    Object.assign(m,CatSVG.mixModel(m,walking,standing));
    m.reactionOffset=(out-back)*24;
   }
   return m;
  }
  if(toys.has(p))return toyModel(p,t);
  const m=basePoseModel(p,t),s=Math.sin;
  if(p==='walk'){
   const cycle=1.65,phase=t/cycle*tau;
   // Four-beat gait; stance moves back steadily, swing follows a lifted arc.
   m.legs=m.legs.map((l,i)=>{const u=(t/cycle+[.5,.25,0,.75][i])%1,front=i%2===1,anchor=front?-63:71,reach=front?22:18;
    const contact=u<.7,v=contact?u/.7:(u-.7)/.3;
    const x=contact?anchor-reach+reach*2*v:anchor+reach-reach*2*smooth(v),y=contact?0:-13*Math.sin(v*Math.PI);
    return[l[0]+s(phase+(front?0:Math.PI))*(front?2:1),l[1],x,y];});
   m.by=-68+Math.cos(phase*2)*1.5;m.br=-86+s(phase)*1.4;
   m.bend=s(phase-.45)*2.5;m.rumpRaise=4+s(phase+1.4)*2;
   m.hy=-99+Math.cos(phase*2-.65)*1.1;m.hr=-7+s(phase-.9)*2.2;
   m.hx=-77+s(phase-.35)*2;m.headTurn=.91+s(phase*.5)*.025;
   m.yaw=84+s(phase)*4;m.tr=-39+s(phase*.5-1.1)*6;m.tx=77+s(phase-.6);
  }else if(['sleep','rest'].includes(p)){
   const b=s(t*1.45);m.bw*=1+b*.022;m.by-=b*.7;m.hy+=s(t*1.45-.65)*.8;
   m.hr+=s(t*.35)*1.8;m.bend=b*.65;m.tr=p==='sleep'?15+s(t*.65)*2:m.tr+s(t*.65)*2;
   if(p==='sleep'){m.tx=40;m.ty=-15;}else{m.sleep=0;m.hx+=glance(t,.4)*3;m.hr+=glance(t,.4)*4;}m.yaw=106+Math.round(s(t*.4)*2);
  }else if(p==='dash'){
   // Spine compresses before extension; head stabilises against the shoulder rise.
   const ph=t*10;m.bend=s(ph-.35)*7;m.rumpRaise=5+s(ph+.7)*5;
   m.hy=-101+s(ph-.55)*2;m.hr=-7+s(ph-.8)*3;
   m.tr=-43+s(ph-1)*8;m.headTurn=.92;
  }else if(p==='jump'){
   const u=t%2.6,landing=smooth((u-.8)/.06)*(1-smooth((u-.91)/.25));
   m.hy+=landing*7;m.bend+=landing*5;m.tr+=s(t*2.5-.8)*5;
   m.hr+=landing*4;m.bw*=1+landing*.025;
  }else if(p==='knead'){
   const phase=t*3.7,shift=s(phase),l=Math.max(0,shift),r=Math.max(0,-shift);
   m.bx=shift*2.3;m.bend=shift*2.4;m.hr=-shift*2;m.hy=-190+Math.abs(shift)*3;
   m.legs[1]=[-19,-110,-20,-9*l];m.legs[3]=[18,-108,19,-9*r];
   m.yaw=shift*3;m.tr=s(phase*.23-.8)*5;
  }else if(p==='cower'){
   const peek=glance(t,.25),b=s(t*2.8);m.hx=peek*7;m.hy=-143+b*.8;m.hr=peek*6;
   m.bw*=1+b*.018;m.bend=-peek*2;m.tr=8+s(t*.7)*2;
  }else if(p==='alert'){
   const look=glance(t,.22);m.hx=look*12;m.hy=-199-Math.abs(look)*2;m.hr=look*5;
   m.headTurn=1;
   m.bend=glance(t,.5)*2;m.tr=10+s(t*2.5)*4;m.bw*=1+s(t*2)*.015;
  }else if(p==='punch'){
   const u=t%2.6,a=strike(u),active=u<1.05,reach=active?a.reach:0,lift=active?a.lift:0;
   m.legs[1]=[-19,-110,-19-68*reach,-72*lift-66*reach];
   m.hx=-7-reach*6;m.hy=-193+reach*3;m.hr=-4-reach*5;
   m.bx=-reach*3;m.bend=-reach*5;m.tr=4+s(t*1.2)*4;
  }else if(p==='wall'){
   const ph=t*4.5,lean=s(ph);m.bend=lean*3;m.hx=lean*2;m.hr=-lean*2;
   m.hy=-193+Math.abs(lean)*2;m.by=-87+Math.abs(lean)*2;
   m.legs[1]=[-19,-110,-28,-135-19*s(ph)];m.legs[3]=[18,-108,28,-135+19*s(ph)];
   m.tr=s(ph*.25-.7)*6;
  }else if(p==='scratch'){
   const u=t%3.4,active=u<2.3,ph=u*7;
   m.hx=-78;m.hy=-83;m.hr=8;m.bend=active?s(ph)*3:0;
   for(const i of [1,3]){const v=((u*1.6+(i===1?0:.5))%1),reach=active?1-v:0;
    m.legs[i]=[i===1?-59:-54,-60,-58-reach*34,active&&v>.78?-Math.sin((v-.78)/.22*Math.PI)*12:0];}
   m.bx=7+(active?s(ph)*2:0);m.tr=-40+s(t)*4;
  }else if(p==='eat'){
   const u=t%5,up=smooth((u-3)/.5)*(1-smooth((u-4.1)/.7)),chew=u<3?s(t*13):0;
   Object.assign(m,{by:-47,br:-101,bw:.66,bh:1.02,bend:up*2,rumpRaise:2,frontBend:.24,hs:.89,headTurn:.96});
   m.hy=-44-up*17+chew*.7;m.hx=-91+up*6;m.hr=10-up*8;
   m.legs=[[67,-57,72,0],[-52,-33,-65,0],[75,-56,82,0],[-46,-32,-58,0]];
   m.tx=78;m.ty=-64;m.bw*=1+s(t*1.9)*.012;m.tr=-40+s(t*.7)*3;
  }else if(p==='vomit'){
   const u=t%4.8,pulse=u<2.2?Math.pow(Math.max(0,s(u*8)),3):0,release=smooth((u-2.2)/.2)*(1-smooth((u-2.7)/.7));
   Object.assign(m,{by:-49+pulse*2,br:-100,bw:.68,bh:1.02,frontBend:.24,hs:.89,headTurn:.96,rumpRaise:3});
   m.bend=-pulse*4;m.hy=-55+pulse*3+release*7;
   m.hx=-88-release*4;m.hr=8+pulse*3+release*5;m.bw*=1-pulse*.035;
   m.legs=[[67,-59,72,0],[-52,-35,-65,0],[75,-58,82,0],[-46,-34,-58,0]];m.tx=78;m.ty=-65;
   m.tr=-40+s(t*.5)*2;
  }else if(p==='poop'){
   // Side-on squat: a raised rump, folded rear hocks and two planted forepaws.
   // Separate the paw pairs instead of stacking all four below the belly.
   const effort=Math.pow(Math.max(0,s(t*2)),4);
   Object.assign(m,{bx:8,by:-64+effort,br:-70,bw:.82,bh:.88,
    hx:-69,hy:-113+effort,hr:-3,hs:.86,headTurn:1,yaw:88,
    bend:2+effort*2,rumpRaise:3,frontBend:.04,tx:65,ty:-80,tr:-79+s(t*.6)*2});
   m.legs=[[47,-52,65,-1],[-37,-68,-47,0],[59,-50,79,0],[-28,-66,-33,0]];
  }else{
   const weight={sit:1,cower:.6,alert:.8,punch:.7,dash:.45,jump:.4,wall:.6,scratch:.7,eat:.6,poop:.3,vomit:.25}[p]??.5;
   m.bend+=s(t*1.7-.4)*1.7*weight;m.rumpRaise+=s(t*1.7-1.2)*.8*weight;
   m.bw*=1+s(t*1.7)*.013*weight;m.hy+=s(t*1.7-.65)*.6*weight;
   m.hr+=s(t*.9-.4)*1.8*weight;m.tr+=s(t*.75-1)*3*weight;
   if(p!=='wall')m.yaw+=Math.round(s(t*.6)*3*weight);
  }
  if(['walk','dash','jump'].includes(p)){
   // The skull sits forward of the shoulder, not on top of the spine.
   m.hx-=9;m.hy-=3;m.hs=.86;m.headTurn=1;
  }
  return m;
 }
 function prepare(r){
  if(r.lifeAnatomy)return;
  const outline=r.svg.querySelector(`#${r.id}-headUnion path`),chestShape=r.svg.querySelector(`#${r.id}-chest path`);
  const legPaint={};
  for(const side of ['Near','Far'])for(const end of ['Front','Back'])for(const bone of ['Upper','Lower']){
   const key=`leg${side}${end}${bone}`;legPaint[key]=r.nodes[key].querySelector('g').innerHTML;
  }
  r.lifeAnatomy={outline,path:outline.getAttribute('d'),chestShape,chestPath:chestShape.getAttribute('d'),legPaint,paintRight:false};
 }
 function reset(r){prepare(r);r.lifeAnatomy.outline.setAttribute('d',r.lifeAnatomy.path);r.lifeAnatomy.chestShape.setAttribute('d',r.lifeAnatomy.chestPath);}
 function finish(r,m,p,t){
  if(p.startsWith('reaction'))p=p.split(':')[1];
  prepare(r);
  if(p==='punch')r.nodes.effects.replaceChildren();
  const locomotion=['walk','dash','jump'].includes(p);
  const right=r.reviewDirection==='right'&&(locomotion||toys.has(p));
  // Turning exposes the other physical flank; it is not a mirrored photograph
  // of the first flank. The same fixed coat map is sampled at the opposite yaw.
  if(right){
   const paint=CatSurface.project(r.surface,-m.yaw);
   for(const key of ['chest','rump'])r.nodes[key].querySelector('g').innerHTML=paint;
   r.surfaceYaw=null;
   r.nodes.body.setAttribute('data-view-angle',-m.yaw);
  }
  // Near/far are rendering slots, not the identity of the cat's limbs.
  // Exchange their coat paint when the opposite pair comes to the front.
  if(r.lifeAnatomy.paintRight!==right){
   for(const key of Object.keys(r.lifeAnatomy.legPaint)){
    const source=right?key.replace(/Near|Far/,side=>side==='Near'?'Far':'Near'):key;
    r.nodes[key].querySelector('g').innerHTML=r.lifeAnatomy.legPaint[source];
   }
   r.lifeAnatomy.paintRight=right;
  }
  const turn=Math.max(-.85,Math.min(.85,r.reviewHeadTurn??(right?-expression(p,t).turn:expression(p,t).turn)));
  // One original face: skin, markings, eyes, muzzle and ears share this transform.
  // Never replace, project, crop or mirror its markings for a different pose.
  const face=r.nodes.headRig;
  if(right){
   for(const key of ['body','tail','legFarBack','legFarFront','legNearBack','legNearFront'])
    r.nodes[key].setAttribute('transform','scale(-1 1) '+r.nodes[key].getAttribute('transform'));
   const young=r.d.age==='kitten',s=m.hs*(young?1.15:1);
   face.setAttribute('transform',`translate(${-m.hx} ${m.hy*(young?.88:1)}) rotate(${-m.hr}) scale(${s} ${s})`);
  }
  // Keep skull volume; depth is expressed inside the face, not as a tilted card.
  if(!window.CatFaceDepth)face.setAttribute('transform',face.getAttribute('transform')+` rotate(${turn*4}) skewY(${turn*5}) scale(${1-Math.abs(turn)*.06} 1)`);
  r.nodes.face.removeAttribute('transform');
  // One shoulder/neck silhouette, painted in the chest's own continuous coat space.
  // The two upper contour endpoints sit under the jaw/back of the skull, not at
  // a synthetic centre-line bridge. Rotating the head therefore bends the neck.
  {
   const n=r.lifeAnatomy,toChest=r.nodes.chest.getCTM().inverse().multiply(r.nodes.headRig.getCTM());
   const side=smooth((m.yaw-25)/40)*(1-smooth((m.yaw-140)/30));
   const underside=['walk','dash','jump','eat','vomit'].includes(p);
   let a=new DOMPoint(-19+side*7,8+(underside?side*5:-side*4)).matrixTransform(toChest);
   let b=new DOMPoint(19+side*11,8+(underside?side*7:-side*26)).matrixTransform(toChest);
   // Rear-facing head rigs are mirrored. Preserve left/right contour order.
   if(a.x>b.x)[a,b]=[b,a];
   // Keep the shoulder volume supporting the forelegs when the head rises.
   // Both contours share one clip and one coat fill: no layered colour seam.
   const shoulder=locomotion?'M-24 -62 C-34 -42 -35 -30 -46 -10 L-49 7 Q0 20 50 7 L47 -7 C35 -30 34 -42 24 -62Z':n.chestPath;
   if(p!=='rest'&&p!=='sleep')n.chestShape.setAttribute('d',shoulder+` M-46 -10 L-49 7 Q0 20 50 7 L47 -7 C34 -42 ${b.x+4} ${b.y+22} ${b.x} ${b.y} L${a.x} ${a.y} C${a.x-4} ${a.y+20} -35 -42 -46 -10Z`);
   if(locomotion||p==='poop')n.chestShape.setAttribute('d',`M-46 -10 L-49 7 Q0 20 50 7 L47 -7 C34 -42 ${b.x+4} ${b.y+22} ${b.x} ${b.y} L${a.x} ${a.y} C${a.x-4} ${a.y+20} -35 -42 -46 -10Z`);
  }
  const tail=r.nodes.tail,base=tail.getAttribute('transform');tail.setAttribute('transform',base+` skewX(${Math.sin(t*1.8-.8)*2.2})`);
  if(window.CatFaceDepth&&!r.depthManual){
   const depthTurn=p==='wall'?0:p==='sleep'?-.16:Math.max(-.58,Math.min(.58,turn));
   CatFaceDepth.apply(r,depthTurn);
  }
  if(m.reactionOffset){const travel=r.nodes.travel;travel.setAttribute('transform',travel.getAttribute('transform')+` translate(${m.reactionOffset*r.scale} 0)`);}
  r.svg.querySelector('[data-life-shadow]')?.setAttribute('transform',`translate(${(m.reactionOffset||0)*r.scale} 0)`);
  const toy=r.svg.querySelector('[data-life-toy]');if(!toy)return;
  toy.style.display=toys.has(p)?'':'none';
  if(toys.has(p)){
   const a=action(p,t),scale=r.scale*(r.d.age==='kitten'?.74:1),l=strike(a.t),rr=strike(a.t,.525);
   const impact=a.pose==='bat'?Math.max(l.hit,rr.hit):a.pose==='pin'&&(a.t%2.1)>.64?Math.exp(-((a.t%2.1)-.64)*12):0;
   const wiggle=a.pose==='stalk'?Math.sin(t*2)*2:impact*5;
   toy.setAttribute('transform',`translate(${360+(-110+wiggle)*scale} ${r.ground-3*scale}) scale(${scale} ${scale*(1-impact*.24)})`);
  }
 }
 return {model,finish,reset,toys,action,expression};
})();
