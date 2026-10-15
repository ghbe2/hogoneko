'use strict';
const ns='http://www.w3.org/2000/svg',el=id=>document.getElementById(id);
let rigs=[],paused=false,time=0,last=0;
function svgNode(tag,attrs){const n=document.createElementNS(ns,tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,v);return n;}
function addFur(rig){
 const strength=+el('fur').value,dark=el('coat').value==='black';
 // Paint is attached to each rig part, inside its original silhouette clip.
 // Chest/rump overlays sit outside the coat projection node, which is repainted on turn.
 for(const key of ['chest','rump','headSkin','tail','legFarBackUpper','legFarFrontUpper','legNearBackUpper','legNearFrontUpper']){
  const part=rig.nodes[key];if(!part)continue;const clip=key==='headSkin'?part.getAttribute('clip-path'):part.querySelector('[clip-path]')?.getAttribute('clip-path');if(!clip)continue;
  const group=svgNode('g',{'data-fur-overlay':key,'clip-path':clip,opacity:strength,'pointer-events':'none'});
  const body=key==='chest'||key==='rump',face=key==='headSkin';let ink='';
  // Broad broken washes, not a second spotted coat.
  const wash=svgNode('path',{d:body?'M-34 -91Q-14 -30 -39 28T-23 100L-3 102Q-19 35 0-10T-8-98Z':face?'M-58 -24Q-28 -10-40 24L-23 36Q-11 12-30-29Z':'M-17 -24Q1 0-7 49L7 55Q14 16 1-30Z',fill:dark?'#afa389':'#fff1cb',opacity:'.18'});group.append(wash);
  let seed=123;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const count=body?65:face?28:18;
  for(let i=0;i<count;i++){const x=body?rand()*95-48:face?rand()*100-50:rand()*50-20,y=body?rand()*180-88:face?rand()*52-30:rand()*90-35;const len=2+rand()*4;ink+=`M${x.toFixed(1)} ${y.toFixed(1)}q${(rand()*2-1).toFixed(1)} ${len.toFixed(1)} 1 ${(len+1).toFixed(1)}`;}
  group.append(svgNode('path',{d:ink,fill:'none',stroke:dark?'#d7c8a4':'#6b5438','stroke-width':'.75','stroke-linecap':'round',opacity:'.3'}));
  part.append(group);
 }
}
function paintSky(){const strength=+el('sky-strength').value;el('sky').innerHTML=`<defs><filter id="paper-grain"><feTurbulence type="fractalNoise" baseFrequency=".13" numOctaves="2" seed="7"/><feColorMatrix type="saturate" values="0"/></filter></defs><path fill="#bacdcc" d="M0 0H360V460H0Z"/><g opacity="${strength}"><path d="M0 0H360V93Q256 76 187 111T0 96Z" fill="#7997ab" opacity=".085"/><path d="M-20 140Q79 106 192 138T384 115L380 213Q220 178 130 211T-20 202Z" fill="#efe0bf" opacity=".145"/><rect width="360" height="385" filter="url(#paper-grain)" opacity=".07" style="mix-blend-mode:multiply"/></g><path fill="#c9ba93" d="M0 385Q170 380 360 388V460H0Z"/>`;}
function rebuild(){const coat=el('coat').value,dna={...CatSVG.defaults,body:'slim',tail:'long',headCoat:coat,bodyCoat:coat,legCoat:coat,tailCoat:coat};rigs=['plain','textured'].map(id=>{const rig=CatSVG.buildCat(el(id),id,dna,375,1);rig.svg.querySelector('.floor')?.remove();CatSVG.applyPose(rig,CatSVG.poseModel(el('pose').value,time),time,el('pose').value);return rig;});addFur(rigs[1]);paintSky();}
function frame(now){if(now-last>=1000/24){if(!paused)time+=Math.min(.06,(now-last)/1000);last=now;for(const rig of rigs)CatSVG.applyPose(rig,CatSVG.poseModel(el('pose').value,time),time,el('pose').value);}requestAnimationFrame(frame);}
for(const id of ['coat','fur'])el(id).addEventListener('change',rebuild);el('sky-strength').addEventListener('change',paintSky);el('pose').addEventListener('change',()=>{time=0;});el('pause').onclick=()=>{paused=!paused;el('pause').textContent=paused?'動かす':'動きを止める';el('pause').setAttribute('aria-pressed',String(paused));};
el('fur').value='.65';
rebuild();requestAnimationFrame(frame);
