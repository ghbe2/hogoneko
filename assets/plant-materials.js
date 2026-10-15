'use strict';
window.PlantMaterials=(()=>{
 const cache=new Map(),ns='http://www.w3.org/2000/svg';
 // Match botanical silhouettes, never color: autumn colors also occur on roofs/clothes.
 const canopy='M-4 -157Q-72 -153';
 const shrubs=['M-20 511Q','M334 504Q','M-10 535Q','M320 589Q','M353 500Q'];
 const grass=['M0 369Q','M0 280Q'];
 function decorate(source){
  if(cache.has(source))return cache.get(source);
  const doc=new DOMParser().parseFromString(source,'image/svg+xml'),root=doc.documentElement;
  if(root.querySelector('[data-plant-material]'))return source;
  const make=(tag,attrs)=>{const n=doc.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);return n;};
  const shapes=[...root.querySelectorAll('path')].map(shape=>{const d=shape.getAttribute('d')||'';return {shape,kind:d.startsWith(canopy)||shrubs.some(s=>d.startsWith(s))?'leaf':grass.some(s=>d.startsWith(s))?'grass':null};}).filter(x=>x.kind);
  if(!shapes.length)return window.BookMaterials?.decorate(source)||source;
  let hash=2166136261;for(const c of source)hash=Math.imul(hash^c.charCodeAt(0),16777619)>>>0;const prefix='plant-'+hash.toString(36)+'-';
  const defs=make('defs',{});root.prepend(defs);
  const marks={
   leaf:[['M9 12q4-3 8-1m28 10 5-3m26 22q4-4 8-3M22 55l5-2m28 20q5-3 9-2M9 84l4-3','#e7dfb3',.26,2.1],['M28 29l4-3m31-15 4-2M8 64l5-2m66 16 5-4','#394f38',.17,1.6],['M14 17l5-2m39 60 6-2','#e7dfb3',.14,1]],
   grass:[['M18 34l-3-5m3 5 2-8m-2 8 5-3M85 92l-2-5m2 5 3-8M48 115l2-5','#607344',.22,1.3],['M23 38l10-1M77 96l13-2M67 18l7-1','#f1e5b9',.25,1.6]]
  };
  for(const kind of ['leaf','grass']){const size=kind==='leaf'?96:134,pattern=make('pattern',{id:prefix+kind,width:size,height:size,patternUnits:'userSpaceOnUse'});for(const [d,stroke,opacity,width] of marks[kind])pattern.append(make('path',{d,stroke,opacity,'stroke-width':width,fill:'none','stroke-linecap':'round'}));defs.append(pattern);}
  shapes.forEach(({shape,kind},i)=>{
   const id=prefix+'clip-'+i,clip=make('clipPath',{id});clip.append(shape.cloneNode(true));defs.append(clip);
   const g=make('g',{'data-plant-material':kind,'clip-path':`url(#${id})`,'pointer-events':'none','aria-hidden':'true'});
   g.append(make('rect',{x:-110,y:-200,width:1110,height:1100,fill:`url(#${prefix+kind})`}));shape.after(g);
  });
  const painted=new XMLSerializer().serializeToString(root);
  const out=window.BookMaterials?.decorate(painted)||painted;cache.set(source,out);return out;
 }
 return {decorate};
})();
