'use strict';
// Static, cached SVG materials. Never regenerate texture during animation.
window.BookMaterials=(()=>{
 const ns='http://www.w3.org/2000/svg',cache=new Map();
 function decorate(source){
  if(cache.has(source))return cache.get(source);
  const doc=new DOMParser().parseFromString(source,'image/svg+xml'),root=doc.documentElement;
  if(root.querySelector('[data-book-material]'))return source;
  let hash=2166136261;for(const c of source)hash=Math.imul(hash^c.charCodeAt(0),16777619)>>>0;
  const prefix='book-'+hash.toString(36),make=(tag,attrs)=>{const n=doc.createElementNS(ns,tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,v);return n;};
  const defs=make('defs',{'data-book-material':'defs'});root.prepend(defs);
  const pattern=make('pattern',{id:prefix,width:79,height:83,patternUnits:'userSpaceOnUse'});
  pattern.append(make('path',{d:'M7 12l8-1m29 22 12-2M16 64l17 1M61 73l7-1',stroke:'#fff4d8','stroke-width':1.3,opacity:.19,fill:'none','stroke-linecap':'round'}),make('path',{d:'M31 19l5 1M9 47l8-1M62 54l7 1',stroke:'#655642','stroke-width':.7,opacity:.10,fill:'none'}));defs.append(pattern);
  const room=!!root.querySelector('[data-room-material]');
  const shapes=[...root.querySelectorAll('path,rect,ellipse,circle')].filter(n=>!n.closest('defs,text,[data-part],.cat-sample,[data-plant-material],[data-room-material]')&&n.getAttribute('fill')&& !/^(none|url\(|transparent)/.test(n.getAttribute('fill')));
  shapes.forEach((shape,i)=>{
   // Existing room finishes and plant marks already have their own material treatment.
   if(shape.nextElementSibling?.matches('[data-room-material],[data-plant-material]'))return;
   if(room&&!/sky|window|outside/.test((shape.id||'')+' '+(shape.parentElement.id||'')))return;
   const fill=shape.getAttribute('fill'),isSky=shape.tagName==='rect'&&Number(shape.getAttribute('width'))>=400&&!room&&i===0&&!/マップ|病院|スーパー|ショップ|譲渡|名前/.test(root.getAttribute('aria-label')||'');
   const copy=shape.cloneNode(false);copy.removeAttribute('id');copy.removeAttribute('stroke');copy.setAttribute('fill',`url(#${prefix})`);copy.setAttribute('data-book-material','paper');copy.setAttribute('pointer-events','none');shape.after(copy);
   if(isSky){const id=prefix+'sky',clip=make('clipPath',{id});clip.append(shape.cloneNode(false));defs.append(clip);const g=make('g',{'clip-path':`url(#${id})`,'data-book-material':'sky','pointer-events':'none'});g.append(make('path',{d:'M0 0H450V154Q260 121 0 158Z',fill:'#7997ab',opacity:.068}),make('path',{d:'M-20 215Q150 165 470 208V340Q250 280-20 333Z',fill:'#efe0bf',opacity:.116}));copy.after(g);}
  });
  const out=new XMLSerializer().serializeToString(root);cache.set(source,out);return out;
 }
 function fur(rig){
  const make=(tag,attrs)=>{const n=document.createElementNS(ns,tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,v);return n;};
  for(const key of ['chest','rump','headSkin','tail','legFarBackUpper','legFarFrontUpper','legNearBackUpper','legNearFrontUpper']){
   const part=rig.nodes[key];if(!part||part.querySelector('[data-fur-overlay]'))continue;
   const clip=key==='headSkin'?part.getAttribute('clip-path'):part.querySelector('[clip-path]')?.getAttribute('clip-path');if(!clip)continue;
   const body=key==='chest'||key==='rump',head=key==='headSkin',coat=rig.d[head?'headCoat':body?'bodyCoat':key==='tail'?'tailCoat':'legCoat'],dark=coat==='black';
   const g=make('g',{'data-fur-overlay':key,'clip-path':clip,opacity:.65,'pointer-events':'none'});
   g.append(make('path',{d:body?'M-34 -91Q-14 -30 -39 28T-23 100L-3 102Q-19 35 0-10T-8-98Z':head?'M-58 -24Q-28 -10-40 24L-23 36Q-11 12-30-29Z':'M-17 -24Q1 0-7 49L7 55Q14 16 1-30Z',fill:dark?'#afa389':'#fff1cb',opacity:.18}));
   let seed=123,ink='';const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
   for(let i=0;i<(body?65:head?28:18);i++){const x=body?rand()*95-48:head?rand()*100-50:rand()*50-20,y=body?rand()*180-88:head?rand()*52-30:rand()*90-35,len=2+rand()*4;ink+=`M${x.toFixed(1)} ${y.toFixed(1)}q${(rand()*2-1).toFixed(1)} ${len.toFixed(1)} 1 ${(len+1).toFixed(1)}`;}
   g.append(make('path',{d:ink,fill:'none',stroke:dark?'#d7c8a4':'#6b5438','stroke-width':.75,'stroke-linecap':'round',opacity:.3}));part.append(g);
  }
 }
 return{decorate,fur};
})();
