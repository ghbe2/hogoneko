'use strict';
// Independent surface treatments for future room finishes; no purchase/state logic.
window.RoomMaterials=(()=>{
 const presets={linen:{curtain:'woven',wall:'wash',floor:'grain'},plain:{curtain:null,wall:null,floor:null}};
 const cache=new Map(),ns='http://www.w3.org/2000/svg';
 function decorate(source,preset='linen'){
  const settings=typeof preset==='string'?presets[preset]:preset;if(!settings)throw Error('Unknown room finish');
  const key=JSON.stringify(settings)+source;if(cache.has(key))return cache.get(key);
  const doc=new DOMParser().parseFromString(source,'image/svg+xml'),root=doc.documentElement;
  if(root.querySelector('[data-room-material]')){
   if(preset!=='plain')return source;
   root.querySelectorAll('[data-room-material]').forEach(n=>n.remove());
   root.setAttribute('data-room-finish','plain');
   const plain=new XMLSerializer().serializeToString(root);cache.set(key,plain);return plain;
  }
  const node=(tag,attrs)=>{const n=doc.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);return n;};
  const defs=node('defs',{});root.prepend(defs);let serial=0;
  function overlay(shape,material,paths){if(!shape)return;const id='room-material-'+material+'-'+serial++,clip=node('clipPath',{id});clip.append(shape.cloneNode(true));defs.append(clip);
   const group=node('g',{'clip-path':`url(#${id})`,'data-room-material':material,'pointer-events':'none','aria-hidden':'true'});
   for(const [d,color,opacity,width,dash] of paths)group.append(node('path',{d,fill:'none',stroke:color,opacity,'stroke-width':width,'stroke-linecap':'round',...(dash?{'stroke-dasharray':dash}:{})}));
   shape.after(group);
  }
  const base=[...root.children].filter(n=>n.tagName==='path');
  if(settings.wall==='wash')overlay(base.find(n=>n.getAttribute('d')==='M0 0H900V760H0Z'),'wall',[
   ['M-15 42Q150 33 280 43T580 40T925 43','#fff9e5',.1,22,'92 7 49 3'],
   ['M-10 390Q170 384 290 392T570 390T922 385','#b9aa84',.065,14,'160 9 75 4'],
   ['M385 104Q533 99 702 105T920 101','#fff9e5',.09,31,'83 4 108 5']]);
  if(settings.floor==='grain')overlay(base.find(n=>n.getAttribute('d')?.startsWith('M0 429')),'floor',[
   ['M18 476Q56 463 108 473T239 475M368 546Q418 535 477 542T616 544M43 628Q102 614 181 626T307 626M518 725Q600 714 690 722T847 721','#83623f',.13,1.2],
   ['M35 481Q78 472 122 478M393 553Q465 543 523 551M75 635Q126 626 176 632M553 731Q624 722 687 729','#f1dbac',.21,1.7],
   ['M222 548q26-10 50 0q-23 9-50 0m9 0q14-4 29 0M729 623q22-8 43 0q-22 8-43 0','#8e704a',.12,.9]]);
  if(settings.curtain==='woven')for(const shape of [root.querySelector('#curtain-left>path'),root.querySelector('#closed-curtains>path')]){
   const paths=[];
   for(let x=47;x<334;x+=14){paths.push([`M${x} 76Q${x-3} 171 ${x-6} 243T${x-2} 365`,'#f6dfb7',.30,3.5,'23 2 41 3 15 1']);paths.push([`M${x+5} 77Q${x+2} 181 ${x} 251T${x+4} 365`,'#744c37',.12,.85,'9 3 17 2']);}
   for(let y=91;y<365;y+=19)paths.push([`M39 ${y}Q166 ${y+2} 333 ${y-1}`,'#f3d6ad',.14,.8,'4 8 2 13']);
   overlay(shape,'curtain',paths);
  }
  root.setAttribute('data-room-finish',typeof preset==='string'?preset:'custom');
  const painted=new XMLSerializer().serializeToString(root);
  const out=window.BookMaterials?.decorate(painted)||painted;cache.set(key,out);return out;
 }
 return {presets,decorate};
})();
