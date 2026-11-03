'use strict';
window.CatHoldMotion=(()=>{
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x)};
function grooming(t){const u=t%4.6,raised=smooth((u-.25)/.55)*(1-smooth((u-3.25)/.55));return {raised,lick:u>.85&&u<3.15?Math.max(0,Math.sin((u-.85)*Math.PI*5)):0};}
function model(t,r,elapsed,phase){
 const m=CatLifeMotion.model('sit',t),relax=r.a===0?1:r.a===1?.55:0;
 const struggle=r.a===3;
 const kick=struggle?Math.sin(t*22):0,breath=Math.sin(t*1.7);
 // A diagonal cradle: rump tucked under, chest supported, limbs attached to
 // the rotated shoulders/hips. The head rests toward the same shoulder.
 const roll=-32-relax*20,angle=roll*Math.PI/180;
 m.bx=12;m.by=-85+breath;m.br=roll+(struggle?Math.sin(t*14)*4:0);m.bw=1.04;m.bh=.88;m.frontBend=.30;
 const point=(x,y)=>[12+x*Math.cos(angle)-y*Math.sin(angle),m.by+x*Math.sin(angle)+y*Math.cos(angle)];
 const shoulder=point(0,-78),hip=point(0,40);
 m.hx=shoulder[0]-8-relax*8;m.hy=shoulder[1]-43+relax*9;m.hr=-7-relax*17+(r.a===0?Math.sin(t*1.5)*3:0);m.bend=breath*.5;
 m.tx=hip[0]+15;m.ty=hip[1]+9;m.tr=75+relax*18+Math.sin(t*1.2)*3;
 const backFar=point(-19,38),frontFar=point(-16,-53),backNear=point(23,38),frontNear=point(20,-53);
 m.legs=[[...backFar,hip[0]-10+kick*15,hip[1]+28-kick*15],[...frontFar,shoulder[0]-12,shoulder[1]+48+relax*8],[...backNear,hip[0]+8-kick*26,hip[1]+35+kick*17],[...frontNear,shoulder[0]+18-relax*8,shoulder[1]+55+relax*12]];
 if(r.a===0){
  const g=grooming(elapsed),nod=g.lick*2;
  m.hy+=g.raised*5+nod;m.hr+=g.raised*10;
  const angle=m.hr*Math.PI/180,reach=35;
  const paw=[m.hx-Math.sin(angle)*reach,m.hy+Math.cos(angle)*reach];
  m.legs[3][2]+=(paw[0]-m.legs[3][2])*g.raised;
  m.legs[3][3]+=(paw[1]-m.legs[3][3])*g.raised;
 }
 if(r.a===2){
  // Three sharp kicks, a breath, two kicks, then a longer rest.
  // Each stroke extends quickly and recoils; hips stay supported in place.
  const u=elapsed%2.65,stroke=at=>{const x=u-at;return x<0||x>.19?0:x<.055?smooth(x/.055):1-smooth((x-.055)/.135);};
  const far=Math.max(stroke(.12),stroke(.31),stroke(.50));
  const near=Math.max(stroke(1.11),stroke(1.30));
  m.legs[0][2]+=far*24;m.legs[0][3]+=far*51;
  m.legs[2][2]+=near*34;m.legs[2][3]+=near*58;
  m.tr+=(near-far)*9;
  m.hr+=8;m.hx+=4;
 }
 m.sleep=relax*.8;return m;
}
function decorate(rig,r,blend,clock,elapsed,phase){CatFaceDepth.apply(rig,blend>.2?(r.a===0?0:r.a===2?.48+Math.sin(clock*1.1)*.06:Math.sin(clock*.9)*(r.tense?.2:.35)):Math.sin(clock*.5)*.12);
 if(blend>.95&&r.a===0&&phase==='hold'){const g=grooming(elapsed);if(g.lick>0){const tongue=document.createElementNS('http://www.w3.org/2000/svg','path');tongue.dataset.holdTongue='';tongue.setAttribute('d',`M-2 25 Q0 23 2 25 L2 ${27+g.lick*7} Q0 ${31+g.lick*7} -2 ${27+g.lick*7}Z`);tongue.setAttribute('fill','#ce8f8d');rig.nodes.face.append(tongue);}}
 if(blend>.2&&r.a<=2){const lid=r.a===2?1-blend*.42:1-blend*(r.a===0?.82:.55)*( .86+.14*Math.sin(clock*1.4));for(const def of rig.nodes.face.querySelectorAll('defs')){const eye=def.nextElementSibling,iris=eye?.nextElementSibling;if(eye&&iris){const tf=`translate(0 -3) scale(1 ${lid}) translate(0 3)`;eye.setAttribute('transform',tf);iris.setAttribute('transform',tf);}}}
 if(blend>.2&&r.tense)for(const side of ['L','R']){const x=side==='L'?-30:30,angle=(side==='L'?-1:1)*(r.a===2?43:25)*blend,tf=`translate(${x} -10) rotate(${angle}) translate(${-x} 10)`;for(const k of ['ear','inner'])rig.nodes[k+side].setAttribute('transform',tf);rig.svg.querySelector(`[data-clip-ear="${side}"]`)?.setAttribute('transform',tf);}
}
function reaction(score,heart){const base=2-Math.max(-2,Math.min(2,score)),tier=heart>=90?2:heart>=70?1:0,a=Math.max(0,base-tier);return {a,base,tier,tense:a>=2,away:a>=2};}
return {model,decorate,reaction};
})();
